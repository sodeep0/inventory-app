import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import connectDB from '../db/mongoose';

export const checkDBConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // If we're not connected, ensure the connection process finishes
    // Mongoose readyState 1 means 'connected'
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (error) {
    res.status(503).json({ 
      message: 'Database connection failed. Please try again in a moment.',
      status: 'database_error',
      retryAfter: 2
    });
  }
};

// Optional: Add retry logic for database operations
export const withRetry = (fn: Function, maxRetries = 3, delay = 1000) => {
  return async (...args: unknown[]) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn(...args);
      } catch (error: unknown) {
        lastError = error;
        
        // Only retry on connection errors
        if (error && typeof error === 'object' && 'name' in error && 'message' in error) {
          const errorObj = error as { name: string; message: string };
          
          if (errorObj.name === 'MongooseServerSelectionError' || 
              errorObj.name === 'MongoNetworkError' ||
              errorObj.message?.includes('connection')) {
            
            console.log(`Database operation failed, retry ${i + 1}/${maxRetries}:`, errorObj.message);
            
            if (i < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
              continue;
            }
          }
        }
        
        // Don't retry for other types of errors
        throw error;
      }
    }
    
    throw lastError;
  };
};
