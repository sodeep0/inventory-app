import { Router, Response } from 'express';
import Item from '../models/item';
import StockMovement from '../models/stockMovement';
import { generateUniqueSku } from '../services/skuService';
import { sendLowStockAlert } from '../services/emailService';
import { logger } from '../utils/logger';
import auth from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = Math.min(parseInt((req.query.limit as string) || '10', 10), 100); // Cap at 100 items per page
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const sort = (req.query.sort as string) || 'quantity';
    const category = (req.query.category as string) || '';

    const query: any = {
      userId: req.user!._id,
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
        ],
      }),
      ...(category && { category: category.toLowerCase() }),
    };

    const sortOptions: any = {};
    if (sort === 'quantity') {
      sortOptions.quantity = 1;
    } else if (sort === '-quantity') {
      sortOptions.quantity = -1;
    } else if (sort === 'name') {
      sortOptions.name = 1;
    } else if (sort === '-name') {
      sortOptions.name = -1;
    } else if (sort === 'createdAt') {
      sortOptions.createdAt = 1;
    } else if (sort === '-createdAt') {
      sortOptions.createdAt = -1;
    }

    // Use lean() for better performance when we don't need Mongoose documents
    const [items, total] = await Promise.all([
      Item.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
      Item.countDocuments(query),
    ]);

    res.json({ items, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/', auth, validate('item'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, quantity, lowStockThreshold, buyPrice, sellPrice, supplierName } = req.body;

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
      buyPrice: buyPrice ?? 0,
      sellPrice: sellPrice ?? 0,
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
    const { name, quantity, lowStockThreshold, buyPrice, sellPrice, supplierName } = req.body;

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
    item.buyPrice = buyPrice ?? item.buyPrice;
    item.sellPrice = sellPrice ?? item.sellPrice;

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

router.get('/categories', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await Item.distinct('category', {
      userId: req.user!._id,
      category: { $nin: [null, ''] },
    });
    const sorted = categories.sort();
    res.json({ categories: sorted });
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

const checkLowStockAlert = async (item: any, previousQuantity: number, userEmail: string | undefined): Promise<void> => {
  try {
    const prevWasAboveThreshold = previousQuantity > item.lowStockThreshold;
    const nowAtOrBelowThreshold = item.quantity <= item.lowStockThreshold;
    
    if (prevWasAboveThreshold && nowAtOrBelowThreshold) {
      if (!userEmail) {
        logger.warn('No user email found, skipping low stock alert.');
        return;
      }

      await sendLowStockAlert({
        to: userEmail,
        itemName: item.name,
        sku: item.sku,
        quantity: item.quantity,
        threshold: item.lowStockThreshold,
      });
    }
  } catch (error) {
    logger.error(`Error checking low stock alert: ${error}`);
  }
};

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

    const previousQuantity = item.quantity;
    item.quantity += parseInt(delta, 10);
    await item.save();

    // Check for low stock alert after adjustment
    await checkLowStockAlert(item, previousQuantity, req.user?.email);

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

// CSV Import endpoint
router.post('/import', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const itemsData = req.body.items as Array<{
      name: string;
      sku?: string;
      quantity: number;
      buyPrice?: number;
      sellPrice?: number;
      lowStockThreshold?: number;
      category?: string;
      tags?: string[];
      supplierName?: string;
    }>;
    
    if (!itemsData || !Array.isArray(itemsData) || itemsData.length === 0) {
      res.status(400).json({ message: 'Invalid import data. Expected an array of items.' });
      return;
    }
    
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    for (const itemData of itemsData) {
      try {
        // Validate required fields
        if (!itemData.name) {
          errors.push(`Item skipped: missing name`);
          skipped++;
          continue;
        }
        
        if (itemData.quantity === undefined || itemData.quantity === null) {
          errors.push(`Item "${itemData.name}" skipped: missing quantity`);
          skipped++;
          continue;
        }
        
        // Determine SKU
        let sku = itemData.sku;
        if (!sku) {
          sku = await generateUniqueSku(itemData.name);
        }
        
        // Check if SKU already exists for this user
        const existingItem = await Item.findOne({ sku, userId: req.user!._id });
        if (existingItem) {
          errors.push(`Item "${itemData.name}" skipped: SKU "${sku}" already exists`);
          skipped++;
          continue;
        }
        
        const newItem = new Item({
          name: itemData.name,
          sku,
          quantity: parseInt(String(itemData.quantity), 10),
          buyPrice: itemData.buyPrice ? parseFloat(String(itemData.buyPrice)) : 0,
          sellPrice: itemData.sellPrice ? parseFloat(String(itemData.sellPrice)) : 0,
          lowStockThreshold: itemData.lowStockThreshold !== undefined && itemData.lowStockThreshold !== null
            ? parseInt(String(itemData.lowStockThreshold), 10) : 0,
          category: itemData.category ? itemData.category.toLowerCase() : undefined,
          tags: itemData.tags || [],
          supplierName: itemData.supplierName,
          userId: req.user!._id,
          status: 'active',
        });
        
        await newItem.save();
        
        await StockMovement.create({
          itemId: newItem._id,
          userId: req.user!._id,
          type: 'initial',
          delta: newItem.quantity,
          reason: 'Initial stock (import)',
        });
        
        created++;
      } catch (itemError: any) {
        if (itemError.code === 11000) {
          errors.push(`Item "${itemData.name}" skipped: duplicate SKU`);
          skipped++;
        } else {
          errors.push(`Item "${itemData.name}" error: ${itemError.message}`);
          skipped++;
        }
      }
    }
    
    res.status(200).json({
      message: 'Import completed',
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;

