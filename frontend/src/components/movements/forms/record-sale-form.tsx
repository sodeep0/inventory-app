"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInventoryItems } from "@/hooks/use-inventory-items";
import { MovementLineItem } from "@/types/movement-ui";
import {
  addOrMergeLine,
  removeLine,
  updateLineQuantity,
  validateSaleLines,
} from "@/lib/movement-lines";
import { MovementErrorBanner } from "@/components/movements/movement-error-banner";
import { MovementLineList } from "@/components/movements/movement-line-list";
import { AddLineControls } from "@/components/movements/add-line-controls";
import { MovementPageShell } from "@/components/movements/movement-page-shell";
import { MovementFormFooter } from "@/components/movements/movement-form-footer";

export function RecordSaleForm({ token }: { token?: string }) {
  const router = useRouter();
  const { items, isLoading, fetchItems } = useInventoryItems(token);
  const [lines, setLines] = useState<MovementLineItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedItem = items.find((i) => i._id === selectedId);
  const cartQtyForSelected = lines.find((l) => l.itemId === selectedId)?.quantity ?? 0;
  const maxAddQty = selectedItem
    ? selectedItem.quantity - cartQtyForSelected
    : undefined;

  const handleAddLine = () => {
    if (!selectedItem || addQty <= 0) return;
    const result = addOrMergeLine(lines, selectedItem, addQty, {
      maxTotal: selectedItem.quantity,
    });
    if (result.error) {
      setErrorMessage(result.error);
      return;
    }
    setLines(result.lines);
    setSelectedId("");
    setAddQty(1);
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    if (isSubmitting || lines.length === 0) return;

    const validationError = validateSaleLines(lines, items);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/sales`,
        {
          items: lines.map(({ sku, quantity }) => ({ sku, quantity })),
          customerName: customerName.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const totalUnits = lines.reduce((s, l) => s + l.quantity, 0);
      toast.success("Sale recorded successfully.", {
        description: `Sold ${totalUnits} unit(s) across ${lines.length} item(s)${customerName.trim() ? ` to ${customerName.trim()}` : ""}.`,
      });
      router.push("/movements");
    } catch (error) {
      const backendMsg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : undefined;
      setErrorMessage(backendMsg || "Failed to record sale. Please try again.");
      toast.error("Failed to record sale.", {
        description: backendMsg || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalUnits = lines.reduce((s, l) => s + l.quantity, 0);
  const summary =
    lines.length > 0
      ? `${lines.length} item${lines.length !== 1 ? "s" : ""} · ${totalUnits} unit${totalUnits !== 1 ? "s" : ""}`
      : undefined;

  return (
    <MovementPageShell
      title="Record Sale"
      description="Add one or more items leaving inventory. Stock updates when you confirm."
      footer={
        <MovementFormFooter
          summary={summary}
          submitLabel="Record Sale"
          submittingLabel="Recording…"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={lines.length === 0}
        />
      }
    >
      <MovementErrorBanner message={errorMessage} />

      <AddLineControls
        items={items}
        isLoading={isLoading}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onSearchChange={fetchItems}
        quantity={addQty}
        onQuantityChange={setAddQty}
        onAdd={handleAddLine}
        excludeOutOfStock
        maxQuantity={maxAddQty}
        deltaForPreview={selectedItem ? -addQty : 0}
      />

      <section className="space-y-2">
        <Label>Items in this sale</Label>
        <MovementLineList
          lines={lines}
          mode="sale"
          onUpdateQuantity={(id, q) =>
            setLines((prev) => {
              const item = items.find((i) => i._id === id);
              const capped = item ? Math.min(q, item.quantity) : q;
              return updateLineQuantity(prev, id, capped);
            })
          }
          onRemove={(id) => setLines((prev) => removeLine(prev, id))}
          emptyMessage="Search above and add items to this sale."
        />
      </section>

      <section className="space-y-2">
        <Label htmlFor="customerName">Customer (optional)</Label>
        <Input
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer name"
        />
      </section>
    </MovementPageShell>
  );
}
