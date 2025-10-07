import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { AuthRequest } from '../types';

interface JwtPayload {
  userId: string;
}

const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    // Check if Authorization header exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    
    // Find user and exclude password from result
    const user = await User.findOne({ _id: decoded.userId }).select('-password');
    
    if (!user) {
      res.status(401).json({ message: 'Authentication failed' });
      return;
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error: any) {
    // Provide specific error messages for JWT errors
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export default auth;

