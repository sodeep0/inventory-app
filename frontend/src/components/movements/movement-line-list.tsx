"use client";

import { Button } from "@/components/ui/button";
import { PhosphorIcon } from "@/components/icons";
import { MovementLineItem } from "@/types/movement-ui";
import { QuantityStepper } from "./quantity-stepper";

interface MovementLineListProps {
  lines: MovementLineItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  mode: "sale" | "add" | "return";
  emptyMessage?: string;
}

export function MovementLineList({
  lines,
  onUpdateQuantity,
  onRemove,
  mode,
  emptyMessage = "No items added yet. Search and add items above.",
}: MovementLineListProps) {
  const totalUnits = lines.reduce((sum, l) => sum + l.quantity, 0);

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center">
        <PhosphorIcon
          name="Package"
          size={28}
          className="mx-auto text-muted-foreground/50 mb-2"
        />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {lines.length} item{lines.length !== 1 ? "s" : ""}
        </span>
        <span className="text-muted-foreground">
          {totalUnits} unit{totalUnits !== 1 ? "s" : ""} total
        </span>
      </div>
      <ul className="rounded-lg border border-border/60 divide-y divide-border/60 max-h-52 overflow-y-auto">
        {lines.map((line) => {
          const maxQty =
            mode === "sale" ? line.availableStock : undefined;
          const stockAfter =
            mode === "sale"
              ? line.availableStock - line.quantity
              : line.availableStock + line.quantity;

          return (
            <li
              key={line.itemId}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{line.name}</p>
                <p className="text-xs text-muted-foreground">{line.sku}</p>
                {mode === "sale" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Stock after:{" "}
                    <span
                      className={
                        stockAfter < 0
                          ? "text-pale-red-text font-medium"
                          : "text-foreground"
                      }
                    >
                      {stockAfter}
                    </span>
                  </p>
                )}
                {(mode === "add" || mode === "return") && (
                  <p className="text-xs text-pale-green-text mt-1">
                    → {stockAfter} in stock
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <QuantityStepper
                  value={line.quantity}
                  onChange={(q) => onUpdateQuantity(line.itemId, q)}
                  min={1}
                  max={maxQty}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-pale-red-text"
                  onClick={() => onRemove(line.itemId)}
                  aria-label={`Remove ${line.name}`}
                >
                  <PhosphorIcon name="Trash" size={16} />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
