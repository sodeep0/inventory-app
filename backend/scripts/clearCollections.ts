import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Item from '../models/item';
import StockMovement from '../models/stockMovement';
import User from '../models/user';

// Load environment variables
dotenv.config();

const clearCollections = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB successfully!\n');

    // Delete all documents from each collection
    console.log('Starting to clear collections...\n');

    // Clear Items
    const itemsResult = await Item.deleteMany({});
    console.log(`✓ Deleted ${itemsResult.deletedCount} documents from 'items' collection`);

    // Clear Stock Movements
    const movementsResult = await StockMovement.deleteMany({});
    console.log(`✓ Deleted ${movementsResult.deletedCount} documents from 'stockmovements' collection`);

    // Clear Users
    const usersResult = await User.deleteMany({});
    console.log(`✓ Deleted ${usersResult.deletedCount} documents from 'users' collection`);

    console.log('\n✅ All collections cleared successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error clearing collections:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
clearCollections();

