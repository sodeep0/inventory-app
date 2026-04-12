import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import connectDB from './db/mongoose';
import { logger, httpLogger } from './utils/logger';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { errorHandler, notFound } from './middleware/errorHandler';
import { checkDBConnection } from './middleware/dbCheck';

// Load environment variables
dotenv.config();

// Connect to database with error handling
connectDB().catch((error) => {
  console.error('Failed to connect to database:', error);
  // Don't exit in serverless - let individual requests handle the error
});

const app = express();
const port = process.env.PORT || 5000;

// Trust proxy - important for rate limiting behind reverse proxies (e.g., Vercel)
app.set('trust proxy', 1);

// Compression middleware - MUST be before other middleware that processes responses
app.use(compression({
  level: 6, // Balance between compression ratio and CPU usage
  threshold: 1024, // Only compress responses larger than 1KB
}));

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false, // Allow embedding
}));

// HTTP request logging
app.use(httpLogger);

// Configure CORS with environment variables
const allowedOrigins = [
  'https://inventory-app-sudip.vercel.app',
  'https://inventory-app-ftnc.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400, // Cache CORS preflight for 24 hours
}));

// Body parser with optimized limits
app.use(express.json({ 
  limit: '10mb',
  strict: true, // Only accept arrays and objects
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000, // Limit number of parameters
}));

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Inventory App API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Apply database connection check to all API routes
app.use('/api/', checkDBConnection);

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'success',
    message: 'Inventory App API root',
    endpoints: ['/api/items', '/api/sales', '/api/returns', '/api/auth', '/api/movements', '/api/stats', '/api/reports', '/api/export']
  });
});

// Load route handlers
import itemsRouter from './api/items';
import salesRouter from './api/sales';
import returnsRouter from './api/returns';
import authRouter from './api/auth';
import movementsRouter from './api/movements';
import statsRouter from './api/stats';
import reportsRouter from './api/reports';
import exportRouter from './api/export';

// Apply routes
app.use('/api/items', itemsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/returns', returnsRouter);
app.use('/api/auth', authLimiter, authRouter); // Stricter rate limiting for auth
app.use('/api/movements', movementsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/export', exportRouter);

// 404 handler for undefined routes
app.use(notFound);

// Centralized error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handler
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

const server = app.listen(port, () => {
  logger.info(`Server is running on port: ${port}`);
  console.log(`Server is running on port: ${port}`);
});

export default app;

