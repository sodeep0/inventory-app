import mongoose from 'mongoose';
import Item from '../models/item';

const generateSkuFromName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
};

export const generateUniqueSku = async (
  name: string,
  userId: mongoose.Types.ObjectId | string
): Promise<string> => {
  const baseSku = generateSkuFromName(name);

  const existing = await Item.findOne({ sku: baseSku, userId });
  if (!existing) return baseSku;

  const pattern = new RegExp(`^${baseSku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(-\\d+)?$`);
  const existingSkus = await Item.find({ userId, sku: pattern })
    .select('sku')
    .sort({ sku: -1 })
    .limit(1)
    .lean();

  let maxSuffix = 0;
  if (existingSkus.length > 0) {
    const match = existingSkus[0].sku.match(/-(\d+)$/);
    maxSuffix = match ? parseInt(match[1], 10) : 0;
  }

  return `${baseSku}-${maxSuffix + 1}`;
};
