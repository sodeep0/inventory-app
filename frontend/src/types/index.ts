// TypeScript interfaces for frontend data structures
// These are separate from backend models to maintain proper separation of concerns

export interface Item {
  _id: string;
  name: string;
  supplierName?: string;
  sku: string;
  quantity: number;
  lowStockThreshold: number;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  _id: string;
  itemId: { name: string; sku: string } | null;
  type: 'sale' | 'purchase' | 'addition' | 'adjustment' | 'return';
  quantity: number;
  delta: number;
  customerName?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
