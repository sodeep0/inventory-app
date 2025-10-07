const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./db/mongoose');

connectDB();

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration - allow multiple origins for different deployments
const allowedOrigins = [
  'https://inventory-app-sudip.vercel.app',
  'https://inventory-app-ftnc.vercel.app',
  'http://localhost:3000', // For local development
  process.env.FRONTEND_URL // From environment variable
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Inventory App Backend');
});

const itemsRouter = require('./api/items');
const salesRouter = require('./api/sales');
const returnsRouter = require('./api/returns');
const authRouter = require('./api/auth');

app.use('/api/items', itemsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/returns', returnsRouter);
app.use('/api/auth', authRouter);

const movementsRouter = require('./api/movements');

app.use('/api/movements', movementsRouter);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
