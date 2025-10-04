const router = require('express').Router();
const mongoose = require('mongoose');
const Item = require('../models/item');
const StockMovement = require('../models/stockMovement');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid returns data' });
    }

    for (const item of items) {
      const existingItem = await Item.findOne({ sku: item.sku, userId: req.user._id });
      if (!existingItem) {
        throw new Error(`Item with SKU ${item.sku} not found`);
      }

      existingItem.quantity += item.quantity;
      await existingItem.save();

      await StockMovement.create({
        itemId: existingItem._id,
        userId: req.user._id,
        type: 'return',
        delta: item.quantity,
        reason: item.reason,
      });
    }

    res.status(201).json({ message: 'Return recorded successfully' });
  } catch (error) {
    res.status(422).json({ message: error.message });
  }
});

router.post('/from-movement/:movementId', auth, async (req, res) => {
  try {
    const { movementId } = req.params;
    const { reason } = req.body;
    const originalMovement = await StockMovement.findOne({ _id: movementId, userId: req.user._id });

    if (!originalMovement) {
      return res.status(404).json({ message: 'Original movement not found' });
    }

    if (originalMovement.type !== 'sale') {
      return res.status(400).json({ message: 'Only sale transactions can be returned' });
    }

    const item = await Item.findOne({ _id: originalMovement.itemId, userId: req.user._id });
    if (!item) {
      return res.status(404).json({ message: 'Associated item not found' });
    }

    const returnQuantity = -originalMovement.delta; // Make the delta positive
    item.quantity += returnQuantity;
    await item.save();

    await StockMovement.create({
      itemId: item._id,
      userId: req.user._id,
      type: 'return',
      delta: returnQuantity,
      reason: reason || `Return of sale from ${new Date(originalMovement.createdAt).toLocaleDateString()}`,
      customerName: originalMovement.customerName,
    });

    res.status(201).json({ message: 'Return recorded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
