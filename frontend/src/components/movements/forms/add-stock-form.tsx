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
} from "@/lib/movement-lines";
import { MovementErrorBanner } from "@/components/movements/movement-error-banner";
import { MovementLineList } from "@/components/movements/movement-line-list";
import { AddLineControls } from "@/components/movements/add-line-controls";
import { MovementPageShell } from "@/components/movements/movement-page-shell";
import { MovementFormFooter } from "@/components/movements/movement-form-footer";

export function AddStockForm({ token }: { token?: string }) {
  const router = useRouter();
  const { items, isLoading, fetchItems } = useInventoryItems(token);
  const [lines, setLines] = useState<MovementLineItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedItem = items.find((i) => i._id === selectedId);

  const handleAddLine = () => {
    if (!selectedItem || addQty <= 0) return;
    const result = addOrMergeLine(lines, selectedItem, addQty);
    setLines(result.lines);
    setSelectedId("");
    setAddQty(1);
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    if (isSubmitting || lines.length === 0) return;

    const reason = note.trim() || "Stock addition";

    try {
      setIsSubmitting(true);
      for (const line of lines) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/items/${line.itemId}/adjust`,
          { delta: line.quantity, reason, type: "purchase" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      const totalUnits = lines.reduce((s, l) => s + l.quantity, 0);
      toast.success("Stock added successfully.", {
        description: `Added ${totalUnits} unit(s) across ${lines.length} item(s).`,
      });
      router.push("/movements");
    } catch (error) {
      const backendMsg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : undefined;
      setErrorMessage(
        backendMsg ||
          "Failed to add stock. Some items may have been updated — refresh and check."
      );
      toast.error("Failed to add stock.", {
        description: backendMsg || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalUnits = lines.reduce((s, l) => s + l.quantity, 0);
  const summary =
    lines.length > 0
      ? `${lines.length} item${lines.length !== 1 ? "s" : ""} · +${totalUnits} unit${totalUnits !== 1 ? "s" : ""}`
      : undefined;

  return (
    <MovementPageShell
      title="Add Stock"
      description="Receive inventory for one or more items. All lines share the same note."
      footer={
        <MovementFormFooter
          summary={summary}
          submitLabel="Add Stock"
          submittingLabel="Adding…"
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
        deltaForPreview={selectedItem ? addQty : 0}
      />

      <section className="space-y-2">
        <Label>Items to receive</Label>
        <MovementLineList
          lines={lines}
          mode="add"
          onUpdateQuantity={(id, q) =>
            setLines((prev) => updateLineQuantity(prev, id, q))
          }
          onRemove={(id) => setLines((prev) => removeLine(prev, id))}
          emptyMessage="Search above and add items to receive."
        />
      </section>

      <section className="space-y-2">
        <Label htmlFor="stockNote">Note (optional)</Label>
        <Input
          id="stockNote"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Supplier delivery, restock"
        />
      </section>
    </MovementPageShell>
  );
}
