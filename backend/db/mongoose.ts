import mongoose from 'mongoose';

// Cache the connection to avoid multiple connections in serverless
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

const connectDB = async (): Promise<void> => {
  try {
    // If we already have a connection, return it
    if (cached.conn) {
      return cached.conn;
    }

    // If we don't have a promise, create one
    if (!cached.promise) {
      const opts = {
        bufferCommands: false, // Disable mongoose buffering
        serverSelectionTimeoutMS: 10000, // Increase timeout for cold starts
        socketTimeoutMS: 45000,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        minPoolSize: 1, // Maintain at least 1 socket connection
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      };

      cached.promise = mongoose.connect(process.env.MONGODB_URI as string, opts).then((mongoose) => {
        console.log(`MongoDB connected: ${mongoose.connection.host}`);
        return mongoose;
      });
    }

    cached.conn = await cached.promise;
    
    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('error', (err: Error) => {
      console.error('MongoDB connection error:', err);
    });

    return cached.conn;
    
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    // Don't exit process in serverless - let the function handle the error
    throw error;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

export default connectDB;

