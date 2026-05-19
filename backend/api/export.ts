import { Router, Response } from 'express';
import Item from '../models/item';
import StockMovement from '../models/stockMovement';
import auth from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const escapeCsvField = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

router.get('/items', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await Item.find({ userId: req.user!._id }).sort({ createdAt: -1 });

    const headers = ['name', 'sku', 'quantity', 'buyPrice', 'sellPrice', 'lowStockThreshold', 'category', 'tags', 'supplierName', 'status', 'createdAt', 'updatedAt'];
    const headerRow = headers.join(',');

    const rows = items.map(item => {
      const fields = headers.map(h => {
        if (h === 'tags') {
          return escapeCsvField((item.tags || []).join('; '));
        }
        if (h === 'createdAt' || h === 'updatedAt') {
          const dateVal = item[h as keyof typeof item];
          return escapeCsvField(dateVal instanceof Date ? dateVal.toISOString() : '');
        }
        return escapeCsvField((item as unknown as Record<string, unknown>)[h]);
      });
      return fields.join(',');
    });

    const csv = [headerRow, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=items.csv');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/movements', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movements = await StockMovement.find({ userId: req.user!._id })
      .populate('itemId', 'name sku')
      .sort({ createdAt: -1 })
      .lean();

    const headers = ['itemName', 'sku', 'type', 'delta', 'customerName', 'reason', 'createdAt'];
    const headerRow = headers.join(',');

    const rows = movements.map(mov => {
      const item = mov.itemId as { name?: string; sku?: string } | null;
      const fields = headers.map(h => {
        if (h === 'itemName') return escapeCsvField(item?.name || '—');
        if (h === 'sku') return escapeCsvField(item?.sku || '—');
        if (h === 'createdAt') return escapeCsvField(mov.createdAt ? new Date(mov.createdAt as Date).toISOString() : '');
        return escapeCsvField((mov as Record<string, unknown>)[h]);
      });
      return fields.join(',');
    });

    const csv = [headerRow, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=movements.csv');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
