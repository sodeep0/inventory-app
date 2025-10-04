const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./db/mongoose');

connectDB();

const app = express();
const port = process.env.PORT || 5000;

//allow cors for https://inventory-app-vert-two.vercel.app/
app.use(cors({
  origin: 'https://inventory-app-vert-two.vercel.app',
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
