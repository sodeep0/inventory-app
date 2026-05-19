import { Router, Response } from 'express';
import mongoose from 'mongoose';
import StockMovement from '../models/stockMovement';
import Item from '../models/item';
import auth from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const VALID_TYPES = ['sale', 'return', 'adjustment', 'purchase', 'initial'] as const;

const buildSortStage = (sort: string): Record<string, 1 | -1> => {
  switch (sort) {
    case 'createdAt':
      return { createdAt: 1 };
    case '-createdAt':
      return { createdAt: -1 };
    case 'type':
      return { type: 1, createdAt: -1 };
    case '-type':
      return { type: -1, createdAt: -1 };
    case 'delta':
      return { delta: 1, createdAt: -1 };
    case '-delta':
      return { delta: -1, createdAt: -1 };
    case 'itemId':
      return { 'item.name': 1, createdAt: -1 };
    case '-itemId':
      return { 'item.name': -1, createdAt: -1 };
    default:
      return { createdAt: -1 };
  }
};

router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = Math.min(parseInt((req.query.limit as string) || '10', 10), 100);
    const skip = (page - 1) * limit;
    const search = ((req.query.search as string) || '').trim();
    const type = (req.query.type as string) || '';
    const sort = (req.query.sort as string) || '-createdAt';

    const userId = new mongoose.Types.ObjectId(String(req.user!._id));

    const matchStage: Record<string, unknown> = { userId };
    if (type && VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
      matchStage.type = type;
    }

    const pipeline: mongoose.PipelineStage[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'items',
          localField: 'itemId',
          foreignField: '_id',
          as: 'item',
        },
      },
      { $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'item.name': { $regex: search, $options: 'i' } },
            { 'item.sku': { $regex: search, $options: 'i' } },
            { customerName: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    const sortStage = buildSortStage(sort);

    const [result] = await StockMovement.aggregate([
      ...pipeline,
      {
        $facet: {
          data: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                userId: 1,
                itemId: {
                  _id: '$item._id',
                  name: '$item.name',
                  sku: '$item.sku',
                },
                customerName: 1,
                type: 1,
                delta: 1,
                reason: 1,
                createdAt: 1,
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const movements = result?.data || [];
    const total = result?.total?.[0]?.count || 0;

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
      .sort({ createdAt: -1 })
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
