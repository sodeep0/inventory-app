const router = require('express').Router();
const StockMovement = require('../models/stockMovement');
const Item = require('../models/item');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const movements = await StockMovement.find({ userId: req.user._id })
      .populate('itemId', 'name sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await StockMovement.countDocuments({ userId: req.user._id });

    res.json({ movements, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/item/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const startingQuantity = req.query.startingQuantity ? parseInt(req.query.startingQuantity, 10) : null;
    const skip = (page - 1) * limit;

    const movements = await StockMovement.find({ itemId, userId: req.user._id })
      .populate('itemId', 'name sku')
      .sort({ createdAt: -1 }) // Always sort newest first
      .skip(skip)
      .limit(limit);
      
    const total = await StockMovement.countDocuments({ itemId, userId: req.user._id });

    let runningQuantity;
    if (startingQuantity !== null) {
      runningQuantity = startingQuantity;
    } else {
      const item = await Item.findOne({ _id: itemId, userId: req.user._id });
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      runningQuantity = item.quantity;
    }

    const movementsWithRunningQuantity = movements.map((movement) => {
      const movementWithRunningQuantity = {
        ...movement.toObject(),
        runningQuantity,
      };
      runningQuantity -= movement.delta;
      return movementWithRunningQuantity;
    });

    res.json({ movements: movementsWithRunningQuantity, total, continuationQuantity: runningQuantity });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
