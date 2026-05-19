export interface InventoryItemOption {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
}

export interface MovementLineItem {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  availableStock: number;
}
