"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Item } from "@/types";
import { ItemFormPageShell } from "@/components/inventory/item-form-page-shell";
import {
  ItemFormFields,
  ItemFormValues,
} from "@/components/inventory/item-form-fields";
import { MovementFormFooter } from "@/components/movements/movement-form-footer";
import { handleAuthError } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";

function itemToFormValues(item: Item): ItemFormValues {
  return {
    name: item.name,
    quantity: item.quantity,
    lowStockThreshold: item.lowStockThreshold,
    buyPrice: item.buyPrice,
    sellPrice: item.sellPrice,
    supplierName: item.supplierName || "",
    category: item.category || "",
    tags: item.tags?.join(", ") || "",
  };
}

export function EditItemForm({
  token,
  itemId,
}: {
  token?: string;
  itemId: string;
}) {
  const router = useRouter();
  const { logout } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [values, setValues] = useState<ItemFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !itemId) return;

    const fetchItem = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/items/${itemId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setItem(res.data);
        setValues(itemToFormValues(res.data));
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 404
        ) {
          router.replace("/not-found");
          return;
        }
        handleAuthError(error, logout);
        toast.error("Failed to load item.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [token, itemId, router, logout]);

  const handleChange = <K extends keyof ItemFormValues>(
    field: K,
    value: ItemFormValues[K]
  ) => {
    setValues((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSubmit = async () => {
    if (!item || !values || isSubmitting || !values.name.trim()) {
      if (values && !values.name.trim()) {
        toast.error("Item name is required.");
      }
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/items/${item._id}`,
        {
          name: values.name.trim(),
          quantity: item.quantity,
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
      toast.success("Item updated successfully.", {
        description: `${values.name.trim()} has been updated.`,
      });
      router.push("/inventory");
    } catch (error) {
      console.error("Failed to update item", error);
      toast.error("Failed to update item.", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !values) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Loading item…
      </p>
    );
  }

  return (
    <ItemFormPageShell
      title="Edit item"
      description="Update details for this product. Change stock via Movements."
      footer={
        <MovementFormFooter
          cancelHref="/inventory"
          submitLabel="Save changes"
          submittingLabel="Saving…"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!values.name.trim()}
        />
      }
    >
      <ItemFormFields
        mode="edit"
        values={values}
        onChange={handleChange}
        currentQuantity={item?.quantity}
        sku={item?.sku}
      />
    </ItemFormPageShell>
  );
}
