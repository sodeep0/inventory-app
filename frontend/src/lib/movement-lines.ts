import { InventoryItemOption, MovementLineItem } from "@/types/movement-ui";

export function addOrMergeLine(
  lines: MovementLineItem[],
  item: InventoryItemOption,
  quantity: number,
  options?: { maxTotal?: number }
): { lines: MovementLineItem[]; error?: string } {
  const existing = lines.find((l) => l.itemId === item._id);
  const existingQty = existing?.quantity ?? 0;
  const newTotal = existingQty + quantity;

  if (options?.maxTotal !== undefined && newTotal > options.maxTotal) {
    return {
      lines,
      error: `Cannot add ${newTotal}. Only ${options.maxTotal} in stock for ${item.name}.`,
    };
  }

  if (existing) {
    return {
      lines: lines.map((l) =>
        l.itemId === item._id ? { ...l, quantity: newTotal } : l
      ),
    };
  }

  return {
    lines: [
      ...lines,
      {
        itemId: item._id,
        sku: item.sku,
        name: item.name,
        quantity,
        availableStock: item.quantity,
      },
    ],
  };
}

export function updateLineQuantity(
  lines: MovementLineItem[],
  itemId: string,
  quantity: number
): MovementLineItem[] {
  return lines.map((l) =>
    l.itemId === itemId ? { ...l, quantity } : l
  );
}

export function removeLine(
  lines: MovementLineItem[],
  itemId: string
): MovementLineItem[] {
  return lines.filter((l) => l.itemId !== itemId);
}

export function validateSaleLines(
  lines: MovementLineItem[],
  items: InventoryItemOption[]
): string | null {
  for (const line of lines) {
    const item = items.find((i) => i._id === line.itemId);
    if (!item) return `Item not found for ${line.name}.`;
    if (line.quantity > item.quantity) {
      return `${line.name}: requested ${line.quantity}, only ${item.quantity} in stock.`;
    }
  }
  return null;
}
