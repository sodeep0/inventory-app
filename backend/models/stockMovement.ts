import mongoose, { Schema } from 'mongoose';
import { IStockMovement, IStockMovementDocument } from '../types';

const stockMovementSchema = new Schema<IStockMovementDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  customerName: {
    type: String,
  },
  type: {
    type: String,
    required: true,
    enum: ['sale', 'return', 'adjustment', 'purchase', 'initial'],
  },
  delta: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Indexes for optimized queries
stockMovementSchema.index({ userId: 1, createdAt: -1 }); // For listing movements by user, sorted by date
stockMovementSchema.index({ itemId: 1, createdAt: -1 }); // For listing movements by item, sorted by date
stockMovementSchema.index({ userId: 1, itemId: 1, createdAt: -1 }); // Compound index for item-specific history
stockMovementSchema.index({ userId: 1, type: 1, createdAt: -1 }); // For filtering by movement type
stockMovementSchema.index({ userId: 1, customerName: 1 }); // For searching by customer name

export default mongoose.model<IStockMovementDocument>('StockMovement', stockMovementSchema);

