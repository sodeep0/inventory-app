import { Request } from 'express';
import { Document, Types } from 'mongoose';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: IUserDocument;
  token?: string;
}

// User Interface
export interface IUser {
  verificationCode: string;
  verificationCodeExpires: Date;
  email: string;
  username: string;
  password: string;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(password: string): Promise<boolean>;
}

// Item Interface
export interface IItem {
  name: string;
  sku: string;
  quantity: number;
  lowStockThreshold: number;
  supplierName?: string;
  status: string;
  userId: Types.ObjectId;
}

export interface IItemDocument extends IItem, Document {
  createdAt: Date;
  updatedAt: Date;
}

// Stock Movement Interface
export interface IStockMovement {
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  customerName?: string;
  type: 'sale' | 'return' | 'adjustment' | 'purchase' | 'initial';
  delta: number;
  reason?: string;
}

export interface IStockMovementDocument extends IStockMovement, Document {
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  status?: string;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items?: T[];
  movements?: T[];
  total: number;
  page?: number;
  limit?: number;
  continuationQuantity?: number;
}

// Error Types
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

