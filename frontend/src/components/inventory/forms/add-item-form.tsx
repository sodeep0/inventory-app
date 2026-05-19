"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { ItemFormPageShell } from "@/components/inventory/item-form-page-shell";
import {
  ItemFormFields,
  ItemFormValues,
} from "@/components/inventory/item-form-fields";
import { MovementFormFooter } from "@/components/movements/movement-form-footer";
import { markOnboardingComplete } from "@/components/onboarding-checklist";

const emptyValues: ItemFormValues = {
  name: "",
  quantity: "",
  lowStockThreshold: "",
  buyPrice: "",
  sellPrice: "",
  supplierName: "",
  category: "",
  tags: "",
};

export function AddItemForm({ token }: { token?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<ItemFormValues>(emptyValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = <K extends keyof ItemFormValues>(
    field: K,
    value: ItemFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting || !values.name.trim()) {
      if (!values.name.trim()) {
        toast.error("Item name is required.");
      }
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/items`,
        {
          name: values.name.trim(),
          quantity: values.quantity === "" ? 0 : values.quantity,
          lowStockThreshold:
            values.lowStockThreshold === "" ? 0 : values.lowStockThreshold,
          buyPrice: values.buyPrice === "" ? 0 : values.buyPrice,
          sellPrice: values.sellPrice === "" ? 0 : values.sellPrice,
          supplierName: values.supplierName,
          category: values.category || undefined,
          tags: values.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      markOnboardingComplete();
      toast.success("Item added successfully.", {
        description: `${values.name.trim()} has been added to inventory.`,
      });
      router.push("/inventory");
    } catch (error) {
      console.error("Failed to add item", error);
      toast.error("Failed to add item.", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ItemFormPageShell
      title="Add item"
      description="Create a new product in your inventory."
      footer={
        <MovementFormFooter
          cancelHref="/inventory"
          submitLabel="Add item"
          submittingLabel="Adding…"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!values.name.trim()}
        />
      }
    >
      <ItemFormFields mode="add" values={values} onChange={handleChange} />
    </ItemFormPageShell>
  );
}
