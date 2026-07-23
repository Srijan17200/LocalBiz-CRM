const express = require('express');
const cors = require('cors');
const path = require('path');

const customersRouter = require('./routes/customers');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../Frontend')));

// API Routes
app.use('/api/customers', customersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// Start server
app.listen(PORT, HOST, () => {
  console.log(`LocalBiz CRM running at http://${HOST}:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
