"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { QuantityStepper } from "./quantity-stepper";
import { ItemSearchPicker } from "./item-search-picker";
import { StockPreviewStrip } from "./stock-preview-strip";
import { InventoryItemOption } from "@/types/movement-ui";

interface AddLineControlsProps {
  items: InventoryItemOption[];
  isLoading?: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onSearchChange?: (query: string) => void;
  quantity: number;
  onQuantityChange: (q: number) => void;
  onAdd: () => void;
  excludeOutOfStock?: boolean;
  maxQuantity?: number;
  deltaForPreview?: number;
}

export function AddLineControls({
  items,
  isLoading,
  selectedId,
  onSelect,
  onSearchChange,
  quantity,
  onQuantityChange,
  onAdd,
  excludeOutOfStock = false,
  maxQuantity,
  deltaForPreview = 0,
}: AddLineControlsProps) {
  const selected = items.find((i) => i._id === selectedId);
  const canAdd =
    selectedId &&
    quantity > 0 &&
    (maxQuantity === undefined || quantity <= maxQuantity);

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
      <ItemSearchPicker
        items={items}
        isLoading={isLoading}
        selectedId={selectedId}
        onSelect={onSelect}
        onSearchChange={onSearchChange}
        excludeOutOfStock={excludeOutOfStock}
      />

      {selected && deltaForPreview !== 0 && (
        <StockPreviewStrip
          itemName={selected.name}
          sku={selected.sku}
          currentStock={selected.quantity}
          delta={deltaForPreview}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Label>Quantity</Label>
          <QuantityStepper
            value={quantity}
            onChange={onQuantityChange}
            min={1}
            max={maxQuantity}
          />
        </div>
        <Button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className="sm:flex-1"
        >
          Add to list
        </Button>
      </div>
    </div>
  );
}
