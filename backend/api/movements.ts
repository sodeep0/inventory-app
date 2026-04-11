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
    const search = (req.query.search as string) || '';
    const type = (req.query.type as string) || '';
    const dateFrom = (req.query.dateFrom as string) || '';
    const dateTo = (req.query.dateTo as string) || '';
    const sort = (req.query.sort as string) || '-createdAt';

    // Build query
    const query: any = { userId: req.user!._id };

    // Filter by movement type
    if (type) {
      query.type = type;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // End of day for dateTo
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // Search by item name - need to find matching item IDs first
    if (search) {
      const matchingItems = await Item.find({
        userId: req.user!._id,
        name: { $regex: search, $options: 'i' },
      }).select('_id');
      const itemIds = matchingItems.map(item => item._id);
      query.itemId = { $in: itemIds };
    }

    // Sort options
    const sortOptions: any = {};
    if (sort === 'createdAt') {
      sortOptions.createdAt = 1;
    } else if (sort === '-createdAt') {
      sortOptions.createdAt = -1;
    } else if (sort === 'type') {
      sortOptions.type = 1;
    } else if (sort === '-type') {
      sortOptions.type = -1;
    } else if (sort === 'delta') {
      sortOptions.delta = 1;
    } else if (sort === '-delta') {
      sortOptions.delta = -1;
    }

    const movements = await StockMovement.find(query)
      .populate('itemId', 'name sku')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
      
    const total = await StockMovement.countDocuments(query);

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

