import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './db/mongoose';
import { logger, httpLogger } from './utils/logger';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { errorHandler, notFound } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const port = process.env.PORT || 5000;

// Trust proxy - important for rate limiting behind reverse proxies (e.g., Vercel)
app.set('trust proxy', 1);

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false, // Allow embedding
}));

// HTTP request logging
app.use(httpLogger);

// Configure CORS with environment variables
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
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
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Load route handlers
import itemsRouter from './api/items';
import salesRouter from './api/sales';
import returnsRouter from './api/returns';
import authRouter from './api/auth';
import movementsRouter from './api/movements';

// Apply routes
app.use('/api/items', itemsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/returns', returnsRouter);
app.use('/api/auth', authLimiter, authRouter); // Stricter rate limiting for auth
app.use('/api/movements', movementsRouter);

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

