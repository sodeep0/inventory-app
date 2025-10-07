import mongoose, { Schema } from 'mongoose';
import { IItem, IItemDocument } from '../types';

const itemSchema = new Schema<IItemDocument>({
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  lowStockThreshold: {
    type: Number,
    default: 0,
  },
  supplierName: {
    type: String,
  },
  status: {
    type: String,
    default: 'active',
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for optimized queries
itemSchema.index({ userId: 1, name: 1 }); // For filtering by user and searching by name
itemSchema.index({ userId: 1, sku: 1 }); // For filtering by user and searching by SKU
itemSchema.index({ userId: 1, quantity: 1 }); // For sorting by quantity per user
itemSchema.index({ userId: 1, createdAt: -1 }); // For sorting by creation date per user
itemSchema.index({ userId: 1, status: 1 }); // For filtering by status per user

// Text index for full-text search on name and sku
itemSchema.index({ name: 'text', sku: 'text' });

export default mongoose.model<IItemDocument>('Item', itemSchema);

