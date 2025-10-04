const router = require('express').Router();
const mongoose = require('mongoose');
const Item = require('../models/item');
const StockMovement = require('../models/stockMovement');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { items, customerName } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid sales data' });
    }

    for (const item of items) {
      const existingItem = await Item.findOne({ sku: item.sku, userId: req.user._id });
      if (!existingItem) {
        throw new Error(`Item with SKU ${item.sku} not found`);
      }
      if (existingItem.quantity < item.quantity) {
        throw new Error(`Insufficient stock for SKU ${item.sku}`);
      }

      existingItem.quantity -= item.quantity;
      await existingItem.save();

      await StockMovement.create({
        itemId: existingItem._id,
        userId: req.user._id,
        customerName,
        type: 'sale',
        delta: -item.quantity,
      });
    }

    res.status(201).json({ message: 'Sale recorded successfully' });
  } catch (error) {
    res.status(422).json({ message: error.message });
  }
});

module.exports = router;
