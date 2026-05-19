"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhosphorIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { InventoryItemOption } from "@/types/movement-ui";

interface ItemSearchPickerProps {
  items: InventoryItemOption[];
  isLoading?: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onSearchChange?: (query: string) => void;
  excludeOutOfStock?: boolean;
  label?: string;
}

export function ItemSearchPicker({
  items,
  isLoading,
  selectedId,
  onSelect,
  onSearchChange,
  excludeOutOfStock = false,
  label = "Search item",
}: ItemSearchPickerProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => onSearchChange?.(query), 300);
    return () => clearTimeout(t);
  }, [query, onSearchChange]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (excludeOutOfStock && item.quantity <= 0) return false;
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, query, excludeOutOfStock]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <PhosphorIcon
          name="MagnifyingGlass"
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or SKU…"
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border border-border/60 max-h-44 overflow-y-auto">
        {isLoading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            Loading items…
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            {query ? "No items match your search." : "No items available."}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((item) => {
              const isSelected = selectedId === item._id;
              const outOfStock = item.quantity <= 0;
              return (
                <li key={item._id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item._id)}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.sku}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-xs font-medium tabular-nums",
                          outOfStock
                            ? "text-pale-red-text"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.quantity} in stock
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
