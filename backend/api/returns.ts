import { Router, Response } from 'express';
import Item from '../models/item';
import StockMovement from '../models/stockMovement';
import auth from '../middleware/auth';
import { validate } from '../middleware/validation';
import { AuthRequest } from '../types';

const router = Router();

router.post('/', auth, validate('return'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Invalid returns data' });
      return;
    }

    // Process each item with atomic operations
    // Note: Without transactions (Atlas M0), partial updates may occur on error
    const processedItems: any[] = [];

    for (const item of items) {
      // Use findOneAndUpdate with atomic operation
      const existingItem = await Item.findOneAndUpdate(
        { sku: item.sku, userId: req.user!._id },
        { $inc: { quantity: item.quantity } },
        { new: true }
      );
      
      if (!existingItem) {
        // If an item fails, try to rollback previously processed items
        for (const processed of processedItems) {
          await Item.findOneAndUpdate(
            { _id: processed.itemId, userId: req.user!._id },
            { $inc: { quantity: -processed.quantity } }
          ).catch(err => console.error('Rollback error:', err));
          
          await StockMovement.findByIdAndDelete(processed.movementId)
            .catch(err => console.error('Rollback error:', err));
        }
        
        throw new Error(`Item with SKU ${item.sku} not found`);
      }

      // Create stock movement record
      const movement = await StockMovement.create({
        itemId: existingItem._id,
        userId: req.user!._id,
        type: 'return',
        delta: item.quantity,
        reason: item.reason,
      });
      
      // Track for potential rollback
      processedItems.push({
        itemId: existingItem._id,
        quantity: item.quantity,
        movementId: movement._id,
      });
    }

    res.status(201).json({ message: 'Return recorded successfully' });
  } catch (error: any) {
    console.error('Return error:', error);
    res.status(422).json({ message: error.message });
  }
});

router.post('/from-movement/:movementId', auth, validate('returnFromMovement'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { movementId } = req.params;
    const { reason } = req.body;
    const originalMovement = await StockMovement.findOne({ 
      _id: movementId, 
      userId: req.user!._id 
    });

    if (!originalMovement) {
      res.status(404).json({ message: 'Original movement not found' });
      return;
    }

    if (originalMovement.type !== 'sale') {
      res.status(400).json({ message: 'Only sale transactions can be returned' });
      return;
    }

    const returnQuantity = -originalMovement.delta; // Make the delta positive
    
    // Use findOneAndUpdate with atomic operation
    const item = await Item.findOneAndUpdate(
      { _id: originalMovement.itemId, userId: req.user!._id },
      { $inc: { quantity: returnQuantity } },
      { new: true }
    );
    
    if (!item) {
      throw new Error('Associated item not found');
    }

    // Create stock movement record
    await StockMovement.create({
      itemId: item._id,
      userId: req.user!._id,
      type: 'return',
      delta: returnQuantity,
      reason: reason || `Return of sale from ${new Date(originalMovement.createdAt).toLocaleDateString()}`,
      customerName: originalMovement.customerName,
    });

    res.status(201).json({ message: 'Return recorded successfully' });
  } catch (error: any) {
    console.error('Return from movement error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

