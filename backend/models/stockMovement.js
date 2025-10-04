const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model('StockMovement', stockMovementSchema);
