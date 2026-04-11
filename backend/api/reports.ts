import { Router, Response } from 'express';
import Item from '../models/item';
import StockMovement from '../models/stockMovement';
import auth from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    // Total stock value (sum of quantity * buyPrice)
    const stockValueAgg = await Item.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$buyPrice'] } } } },
    ]);
    const totalStockValue = stockValueAgg.length > 0 ? stockValueAgg[0].total : 0;

    // Potential revenue (sum of quantity * sellPrice)
    const revenueAgg = await Item.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$sellPrice'] } } } },
    ]);
    const potentialRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Sales count
    const salesCount = await StockMovement.countDocuments({ userId, type: 'sale' });

    // Returns count
    const returnsCount = await StockMovement.countDocuments({ userId, type: 'return' });

    // Recent activity (last 10 movements)
    const recentActivity = await StockMovement.find({ userId })
      .populate('itemId', 'name sku')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalStockValue,
      potentialRevenue,
      salesCount,
      returnsCount,
      recentActivity,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/movements-by-type', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const movementsByType = await StockMovement.aggregate([
      { $match: { userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ movementsByType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
