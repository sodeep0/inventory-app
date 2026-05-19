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
import { cn } from "@/lib/utils";

const RETURN_REASONS = [
  "Damaged",
  "Wrong item",
  "Customer return",
  "Supplier return",
] as const;

export function RecordReturnForm({ token }: { token?: string }) {
  const router = useRouter();
  const { items, isLoading, fetchItems } = useInventoryItems(token);
  const [lines, setLines] = useState<MovementLineItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [reasonPreset, setReasonPreset] = useState<string>("");
  const [reasonOther, setReasonOther] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const reason =
    reasonPreset === "Other"
      ? reasonOther.trim()
      : reasonPreset || reasonOther.trim();

  const handleAddLine = () => {
    if (!selectedId || addQty <= 0) return;
    const item = items.find((i) => i._id === selectedId);
    if (!item) return;
    const result = addOrMergeLine(lines, item, addQty);
    setLines(result.lines);
    setSelectedId("");
    setAddQty(1);
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    if (isSubmitting || lines.length === 0) return;
    if (!reason) {
      setErrorMessage("Please select or enter a return reason.");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/returns`,
        {
          items: lines.map(({ sku, quantity }) => ({
            sku,
            quantity,
            reason,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const totalUnits = lines.reduce((s, l) => s + l.quantity, 0);
      toast.success("Return recorded successfully.", {
        description: `Returned ${totalUnits} unit(s) across ${lines.length} item(s).`,
      });
      router.push("/movements");
    } catch (error) {
      const backendMsg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : undefined;
      setErrorMessage(backendMsg || "Failed to record return. Please try again.");
      toast.error("Failed to record return.", {
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
      title="Record Return"
      description="Add stock back for one or more items with a shared return reason."
      footer={
        <MovementFormFooter
          summary={summary}
          submitLabel="Record Return"
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
        deltaForPreview={0}
      />

      <section className="space-y-2">
        <Label>Items in this return</Label>
        <MovementLineList
          lines={lines}
          mode="return"
          onUpdateQuantity={(id, q) =>
            setLines((prev) => updateLineQuantity(prev, id, q))
          }
          onRemove={(id) => setLines((prev) => removeLine(prev, id))}
          emptyMessage="Search above and add items to return."
        />
      </section>

      <section className="space-y-2">
        <Label>Reason</Label>
        <div className="flex flex-wrap gap-2">
          {RETURN_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setReasonPreset(r);
                setReasonOther("");
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                reasonPreset === r
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted/50"
              )}
            >
              {r}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setReasonPreset("Other")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              reasonPreset === "Other"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-muted/50"
            )}
          >
            Other
          </button>
        </div>
        {(reasonPreset === "Other" || !reasonPreset) && (
          <Input
            value={reasonOther}
            onChange={(e) => setReasonOther(e.target.value)}
            placeholder="Describe the return reason"
          />
        )}
      </section>
    </MovementPageShell>
  );
}
