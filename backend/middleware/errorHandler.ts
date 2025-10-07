import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

// Centralized error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let isOperational = err.isOperational || false;

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e: any) => e.message);
    message = errors.join(', ');
    isOperational = true;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    isOperational = true;
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    isOperational = true;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    isOperational = true;
  }

  // Log error for debugging (in development mode, show full error)
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR DETAILS:', {
      message: err.message,
      stack: err.stack,
      statusCode,
      isOperational,
    });
  } else {
    // In production, only log operational errors with minimal details
    if (!isOperational) {
      console.error('CRITICAL ERROR:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Send error response
  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message: isOperational ? message : 'Something went wrong. Please try again later.',
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  });
};

// Async error wrapper to catch errors in async route handlers
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for undefined routes
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
  next(error);
};

