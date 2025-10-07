import { Router, Response } from 'express';
import Item from '../models/item';
import StockMovement from '../models/stockMovement';
import { generateUniqueSku } from '../services/skuService';
import auth from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const sort = (req.query.sort as string) || 'quantity';

    const query: any = {
      userId: req.user!._id,
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
        ],
      }),
    };

    const sortOptions: any = {};
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

router.post('/', auth, validate('item'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, quantity, lowStockThreshold, supplierName } = req.body;

    if (!name || quantity === undefined || lowStockThreshold === undefined) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const sku = await generateUniqueSku(name);

    const newItem = new Item({
      ...req.body,
      userId: req.user!._id,
      sku,
      status: 'active',
    });

    const result = await newItem.save();

    await StockMovement.create({
      itemId: result._id,
      userId: req.user!._id,
      type: 'initial',
      delta: result.quantity,
      reason: 'Initial stock',
    });

    res.status(201).json(result._id);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ message: 'SKU already exists' });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/:id', auth, validate('itemUpdate'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, quantity, lowStockThreshold, supplierName } = req.body;

    if (!name || quantity === undefined || lowStockThreshold === undefined) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const item = await Item.findOne({ _id: id, userId: req.user!._id });

    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
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

router.delete('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await Item.findOneAndDelete({ _id: id, userId: req.user!._id });

    if (!result) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }

    // Also delete all stock movements associated with this item
    await StockMovement.deleteMany({ itemId: id, userId: req.user!._id });

    res.status(200).json({ message: 'Item and associated movements deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await Item.findOne({ _id: id, userId: req.user!._id });

    if (!item) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/:id/adjust', auth, validate('adjustment'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { delta, reason, type } = req.body;
    const { id } = req.params;

    if (delta === undefined || !reason) {
      res.status(400).json({ message: 'Invalid adjustment data' });
      return;
    }

    const item = await Item.findOne({ _id: id, userId: req.user!._id });
    if (!item) {
      throw new Error(`Item with id ${id} not found`);
    }

    item.quantity += parseInt(delta, 10);
    await item.save();

    const allowedTypes = ['sale', 'return', 'adjustment', 'purchase', 'initial'];
    let movementType: 'sale' | 'return' | 'adjustment' | 'purchase' | 'initial' = 'adjustment';
    if (allowedTypes.includes(type)) {
      movementType = type;
    } else if (parseInt(delta, 10) > 0) {
      // Infer purchase for positive additions when client didn't pass a type
      movementType = 'purchase';
    }

    const movement = await StockMovement.create({
      itemId: item._id,
      userId: req.user!._id,
      type: movementType,
      delta: parseInt(delta, 10),
      reason,
    });

    res.status(201).json({ message: 'Adjustment recorded successfully', movement });
  } catch (error: any) {
    res.status(422).json({ message: error.message });
  }
});

export default router;

