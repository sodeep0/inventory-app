import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Item from '../models/item';

dotenv.config();

/**
 * Migrates SKU indexes from global unique to per-user unique.
 * Resolves duplicate SKUs within the same user by appending -2, -3, etc.
 */
const migrateSkuPerUser = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected.\n');

    const collection = Item.collection;

    // Drop legacy global unique index on sku if present
    const indexes = await collection.indexes();
    const skuGlobalIndex = indexes.find(
      (idx) => idx.key?.sku === 1 && idx.unique && !idx.key?.userId
    );
    if (skuGlobalIndex?.name) {
      console.log(`Dropping legacy index: ${skuGlobalIndex.name}`);
      await collection.dropIndex(skuGlobalIndex.name);
    }

    // Resolve duplicate SKUs within the same user
    const duplicates = await Item.aggregate([
      {
        $group: {
          _id: { userId: '$userId', sku: '$sku' },
          count: { $sum: 1 },
          ids: { $push: '$_id' },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate SKU group(s) per user. Resolving...`);
      for (const group of duplicates) {
        const [, ...restIds] = group.ids;
        const baseSku = group._id.sku as string;
        let suffix = 2;
        for (const id of restIds) {
          let candidate = `${baseSku}-${suffix}`;
          // eslint-disable-next-line no-await-in-loop
          while (await Item.findOne({ userId: group._id.userId, sku: candidate, _id: { $ne: id } })) {
            suffix += 1;
            candidate = `${baseSku}-${suffix}`;
          }
          // eslint-disable-next-line no-await-in-loop
          await Item.updateOne({ _id: id }, { $set: { sku: candidate } });
          console.log(`  Updated item ${id} → SKU "${candidate}"`);
          suffix += 1;
        }
      }
    } else {
      console.log('No per-user SKU duplicates found.');
    }

    // Ensure compound unique index exists
    const hasCompound = indexes.some(
      (idx) => idx.key?.userId === 1 && idx.key?.sku === 1 && idx.unique
    );
    if (!hasCompound) {
      console.log('Creating compound unique index { userId: 1, sku: 1 }...');
      await collection.createIndex({ userId: 1, sku: 1 }, { unique: true });
    } else {
      console.log('Compound index { userId: 1, sku: 1 } already exists.');
    }

    console.log('\n✅ SKU per-user migration complete.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

migrateSkuPerUser();
