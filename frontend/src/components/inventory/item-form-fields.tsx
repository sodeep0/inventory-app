"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ItemFormValues {
  name: string;
  quantity: number | "";
  lowStockThreshold: number | "";
  buyPrice: number | "";
  sellPrice: number | "";
  supplierName: string;
  category: string;
  tags: string;
}

interface ItemFormFieldsProps {
  mode: "add" | "edit";
  values: ItemFormValues;
  onChange: <K extends keyof ItemFormValues>(
    field: K,
    value: ItemFormValues[K]
  ) => void;
  currentQuantity?: number;
  sku?: string;
}

export function ItemFormFields({
  mode,
  values,
  onChange,
  currentQuantity,
  sku,
}: ItemFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Enter item name"
        />
      </div>

      {mode === "edit" && sku && (
        <div className="space-y-2">
          <Label>SKU</Label>
          <p className="px-3 py-2 rounded-md border border-border/60 bg-muted/30 text-sm text-muted-foreground">
            {sku}
          </p>
        </div>
      )}

      {mode === "add" ? (
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min={0}
            placeholder="0"
            value={values.quantity}
            onChange={(e) =>
              onChange(
                "quantity",
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Current quantity</Label>
          <p className="px-3 py-2 rounded-md border border-border/60 bg-muted/30 text-sm font-medium">
            {currentQuantity ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">
            Use Movements to record sales, stock in, or adjustments.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="lowStockThreshold">Low stock threshold</Label>
        <Input
          id="lowStockThreshold"
          type="number"
          min={0}
          placeholder="0"
          value={values.lowStockThreshold}
          onChange={(e) =>
            onChange(
              "lowStockThreshold",
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="buyPrice">Buy price</Label>
          <Input
            id="buyPrice"
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            value={values.buyPrice}
            onChange={(e) =>
              onChange(
                "buyPrice",
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sellPrice">Sell price</Label>
          <Input
            id="sellPrice"
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            value={values.sellPrice}
            onChange={(e) =>
              onChange(
                "sellPrice",
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier">Supplier</Label>
        <Input
          id="supplier"
          value={values.supplierName}
          onChange={(e) => onChange("supplierName", e.target.value)}
          placeholder="Enter supplier name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={values.category}
          onChange={(e) => onChange("category", e.target.value)}
          placeholder="Enter category"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={values.tags}
          onChange={(e) => onChange("tags", e.target.value)}
          placeholder="Comma-separated tags"
        />
      </div>
    </div>
  );
}
