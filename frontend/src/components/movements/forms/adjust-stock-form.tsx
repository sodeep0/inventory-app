"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInventoryItems } from "@/hooks/use-inventory-items";
import { MovementErrorBanner } from "@/components/movements/movement-error-banner";
import { ItemSearchPicker } from "@/components/movements/item-search-picker";
import { QuantityStepper } from "@/components/movements/quantity-stepper";
import { StockPreviewStrip } from "@/components/movements/stock-preview-strip";
import { MovementPageShell } from "@/components/movements/movement-page-shell";
import { MovementFormFooter } from "@/components/movements/movement-form-footer";
import { cn } from "@/lib/utils";

type AdjustMode = "add" | "remove" | "set";

export function AdjustStockForm({ token }: { token?: string }) {
  const router = useRouter();
  const { items, isLoading, fetchItems } = useInventoryItems(token);
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState<AdjustMode>("add");
  const [quantity, setQuantity] = useState(1);
  const [newCount, setNewCount] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selected = items.find((i) => i._id === selectedId);

  useEffect(() => {
    if (selected) {
      setNewCount(selected.quantity);
    }
  }, [selectedId, selected?.quantity]);

  const delta = (() => {
    if (!selected) return 0;
    if (mode === "add") return quantity;
    if (mode === "remove") return -quantity;
    const target = typeof newCount === "number" ? newCount : selected.quantity;
    return target - selected.quantity;
  })();

  const handleSubmit = async () => {
    if (isSubmitting || !selectedId || !selected) return;
    if (!reason.trim()) {
      setErrorMessage("Please enter a reason for this adjustment.");
      return;
    }
    if (delta === 0) {
      setErrorMessage("No change in quantity. Update the amount or pick another item.");
      return;
    }
    if (mode === "remove" && quantity > selected.quantity) {
      setErrorMessage(`Cannot remove ${quantity}. Only ${selected.quantity} in stock.`);
      return;
    }
    if (mode === "set" && typeof newCount === "number" && newCount < 0) {
      setErrorMessage("Stock count cannot be negative.");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/items/${selectedId}/adjust`,
        { delta, reason: reason.trim(), type: "adjustment" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Stock adjusted successfully.", {
        description: `${delta > 0 ? "Added" : "Removed"} ${Math.abs(delta)} unit(s) for ${selected.name}.`,
      });
      router.push("/movements");
    } catch (error) {
      const backendMsg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : undefined;
      setErrorMessage(backendMsg || "Failed to adjust stock. Please try again.");
      toast.error("Failed to adjust stock.", {
        description: backendMsg || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary =
    selected && delta !== 0
      ? `${selected.name}: ${delta > 0 ? "+" : ""}${delta} units`
      : undefined;

  return (
    <MovementPageShell
      title="Adjust Stock"
      description="Correct inventory after damage, cycle counts, or errors."
      footer={
        <MovementFormFooter
          summary={summary}
          submitLabel="Adjust Stock"
          submittingLabel="Adjusting…"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disabled={!selectedId || delta === 0}
        />
      }
    >
      <MovementErrorBanner message={errorMessage} />

      <ItemSearchPicker
        items={items}
        isLoading={isLoading}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onSearchChange={fetchItems}
      />

      {selected && (
        <>
          <section className="space-y-2">
            <Label>How to adjust</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "add" as const, label: "Add units" },
                  { id: "remove" as const, label: "Remove units" },
                  { id: "set" as const, label: "Set exact count" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    mode === m.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </section>

          {mode === "set" ? (
            <section className="space-y-2">
              <Label htmlFor="newCount">New stock count</Label>
              <Input
                id="newCount"
                type="number"
                min={0}
                value={newCount}
                onChange={(e) =>
                  setNewCount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
            </section>
          ) : (
            <section className="space-y-2">
              <Label>Units to {mode === "add" ? "add" : "remove"}</Label>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={mode === "remove" ? selected.quantity : undefined}
              />
            </section>
          )}

          {delta !== 0 && (
            <StockPreviewStrip
              itemName={selected.name}
              sku={selected.sku}
              currentStock={selected.quantity}
              delta={delta}
            />
          )}
        </>
      )}

      <section className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Cycle count, breakage"
        />
      </section>
    </MovementPageShell>
  );
}
