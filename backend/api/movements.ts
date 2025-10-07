import { Router, Response } from 'express';
import StockMovement from '../models/stockMovement';
import Item from '../models/item';
import auth from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const skip = (page - 1) * limit;

    const movements = await StockMovement.find({ userId: req.user!._id })
      .populate('itemId', 'name sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await StockMovement.countDocuments({ userId: req.user!._id });

    res.json({ movements, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/item/:itemId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { itemId } = req.params;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const startingQuantity = req.query.startingQuantity ? parseInt(req.query.startingQuantity as string, 10) : null;
    const skip = (page - 1) * limit;

    const movements = await StockMovement.find({ itemId, userId: req.user!._id })
      .populate('itemId', 'name sku')
      .sort({ createdAt: -1 }) // Always sort newest first
      .skip(skip)
      .limit(limit);
      
    const total = await StockMovement.countDocuments({ itemId, userId: req.user!._id });

    let runningQuantity: number;
    if (startingQuantity !== null) {
      runningQuantity = startingQuantity;
    } else {
      const item = await Item.findOne({ _id: itemId, userId: req.user!._id });
      if (!item) {
        res.status(404).json({ message: 'Item not found' });
        return;
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

export default router;

