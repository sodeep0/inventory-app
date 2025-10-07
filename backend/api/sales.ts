import { Router, Response } from 'express';
import Item from '../models/item';
import StockMovement from '../models/stockMovement';
import auth from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AuthRequest } from '../types';

const router = Router();

router.post('/', auth, validate('sale'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, customerName } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Invalid sales data' });
      return;
    }

    // Process each item with atomic operations
    // Note: Without transactions (Atlas M0), partial updates may occur on error
    const processedItems: any[] = [];
    
    for (const item of items) {
      // Use findOneAndUpdate with atomic operation to prevent race conditions
      const existingItem = await Item.findOneAndUpdate(
        { 
          sku: item.sku, 
          userId: req.user!._id,
          quantity: { $gte: item.quantity } // Atomic check for sufficient stock
        },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
      
      if (!existingItem) {
        // If an item fails, try to rollback previously processed items
        for (const processed of processedItems) {
          await Item.findOneAndUpdate(
            { _id: processed.itemId, userId: req.user!._id },
            { $inc: { quantity: processed.quantity } }
          ).catch(err => console.error('Rollback error:', err));
          
          await StockMovement.findByIdAndDelete(processed.movementId)
            .catch(err => console.error('Rollback error:', err));
        }
        
        throw new Error(`Item with SKU ${item.sku} not found or insufficient stock`);
      }

      // Create stock movement record
      const movement = await StockMovement.create({
        itemId: existingItem._id,
        userId: req.user!._id,
        customerName,
        type: 'sale',
        delta: -item.quantity,
      });
      
      // Track for potential rollback
      processedItems.push({
        itemId: existingItem._id,
        quantity: item.quantity,
        movementId: movement._id,
      });
    }

    res.status(201).json({ message: 'Sale recorded successfully' });
  } catch (error: any) {
    console.error('Sale error:', error);
    res.status(422).json({ message: error.message });
  }
});

export default router;

