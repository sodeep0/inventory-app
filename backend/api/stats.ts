import { Router, Response } from 'express';
import Item from '../models/item';
import StockMovement from '../models/stockMovement';
import auth from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    // Total items count
    const totalItems = await Item.countDocuments({ userId });

    // Total quantity of all items
    const quantityAgg = await Item.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const totalQuantity = quantityAgg.length > 0 ? quantityAgg[0].total : 0;

    // Low stock items count
    const lowStockItems = await Item.countDocuments({
      userId,
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    });

    // Total movements count
    const totalMovements = await StockMovement.countDocuments({ userId });

    // Recent movements (last 5)
    const recentMovements = await StockMovement.find({ userId })
      .populate('itemId', 'name sku')
      .sort({ createdAt: -1 })
      .limit(5);

    // Top 5 items by quantity
    const topItems = await Item.find({ userId })
      .sort({ quantity: -1 })
      .limit(5)
      .select('name quantity sku');

    // Low-stock items for dashboard banner (up to 5, lowest quantity first)
    const lowStockList = await Item.find({
      userId,
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    })
      .sort({ quantity: 1 })
      .limit(5)
      .select('name sku quantity lowStockThreshold');

    res.json({
      totalItems,
      totalQuantity,
      lowStockItems,
      totalMovements,
      recentMovements,
      topItems,
      lowStockList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
