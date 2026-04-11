import { Router, Response } from 'express';
import Item from '../models/item';
import StockMovement from '../models/stockMovement';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

const router = Router();

// Authenticate from query token (for direct browser downloads)
const authenticateExport = async (req: AuthRequest, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;
  const tokenQueryParam = req.query.token as string;
  const token = authHeader?.split(' ')[1] || tokenQueryParam;

  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    const User = (await import('../models/user')).default;
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    req.user = user as any;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Escape CSV field
const escapeCsvField = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Export items as CSV
router.get('/items', authenticateExport, async (req: AuthRequest, res: Response): Promise<void> => {
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
        return escapeCsvField((item as any)[h]);
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

// Export movements as CSV
router.get('/movements', authenticateExport, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movements = await StockMovement.find({ userId: req.user!._id })
      .populate('itemId', 'name sku')
      .sort({ createdAt: -1 })
      .lean();

    const headers = ['itemName', 'sku', 'type', 'delta', 'customerName', 'reason', 'createdAt'];
    const headerRow = headers.join(',');

    const rows = movements.map(mov => {
      const item = mov.itemId as any;
      const fields = headers.map(h => {
        if (h === 'itemName') return escapeCsvField(item?.name || '—');
        if (h === 'sku') return escapeCsvField(item?.sku || '—');
        if (h === 'createdAt') return escapeCsvField(mov.createdAt ? new Date(mov.createdAt as any).toISOString() : '');
        return escapeCsvField((mov as any)[h]);
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
