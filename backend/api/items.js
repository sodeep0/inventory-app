const router = require('express').Router();
const Item = require('../models/item');
const StockMovement = require('../models/stockMovement');
const { generateUniqueSku } = require('../services/skuService');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const sort = req.query.sort || 'quantity';

    const query = {
      userId: req.user._id,
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
        ],
      }),
    };

    const sortOptions = {};
    if (sort === 'quantity') {
      sortOptions.quantity = 1;
    } else if (sort === '-quantity') {
      sortOptions.quantity = -1;
    }

    const items = await Item.find(query).sort(sortOptions).skip(skip).limit(limit);
    const total = await Item.countDocuments(query);

    res.json({ items, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, quantity, lowStockThreshold, supplierName } = req.body;

    if (!name || quantity === undefined || lowStockThreshold === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const sku = await generateUniqueSku(name);

    const newItem = new Item({
      ...req.body,
      userId: req.user._id,
      sku,
      status: 'active',
    });

    const result = await newItem.save();

    await StockMovement.create({
      itemId: result._id,
      userId: req.user._id,
      type: 'initial',
      delta: result.quantity,
      reason: 'Initial stock',
    });

    res.status(201).json(result._id);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'SKU already exists' });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, lowStockThreshold, supplierName } = req.body;

    if (!name || quantity === undefined || lowStockThreshold === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const item = await Item.findOne({ _id: id, userId: req.user._id });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.name = name;
    item.quantity = parseInt(quantity, 10);
    item.lowStockThreshold = parseInt(lowStockThreshold, 10);
    item.supplierName = supplierName;

    await item.save();

    res.status(200).json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Item.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!result) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Also delete all stock movements associated with this item
    await StockMovement.deleteMany({ itemId: id, userId: req.user._id });

    res.status(200).json({ message: 'Item and associated movements deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findOne({ _id: id, userId: req.user._id });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/:id/adjust', auth, async (req, res) => {
  try {
    const { delta, reason, type } = req.body;
    const { id } = req.params;

    if (delta === undefined || !reason) {
      return res.status(400).json({ message: 'Invalid adjustment data' });
    }

    const item = await Item.findOne({ _id: id, userId: req.user._id });
    if (!item) {
      throw new Error(`Item with id ${id} not found`);
    }

    item.quantity += parseInt(delta, 10);
    await item.save();

    const allowedTypes = ['sale', 'return', 'adjustment', 'purchase', 'initial'];
    let movementType = 'adjustment';
    if (allowedTypes.includes(type)) {
      movementType = type;
    } else if (parseInt(delta, 10) > 0) {
      // Infer purchase for positive additions when client didn't pass a type
      movementType = 'purchase';
    }

    const movement = await StockMovement.create({
      itemId: item._id,
      userId: req.user._id,
      type: movementType,
      delta: parseInt(delta, 10),
      reason,
    });

    res.status(201).json({ message: 'Adjustment recorded successfully', movement });
  } catch (error) {
    res.status(422).json({ message: error.message });
  }
});

module.exports = router;
