const express = require('express');
const router = express.Router();
const db = require('../db/database');

function getUserId(req) {
  const userId = req.headers['x-user-id'] || req.query.user_id || req.body?.user_id;
  return userId || 'default';
}

// GET all orders
router.get('/', (req, res) => {
  const userId = getUserId(req);
  const orders = db.prepare(`
    SELECT o.*, c.name as customer_name, p.name as product_name, p.category, p.price
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    JOIN products p ON o.product_id = p.id
    WHERE o.user_id = ? AND c.user_id = ? AND p.user_id = ?
    ORDER BY o.date_created DESC
  `).all(userId, userId, userId);
  res.json(orders);
});

// GET orders by receipt id (grouped)
router.get('/receipt/:receipt_id', (req, res) => {
  const userId = getUserId(req);
  const receiptId = req.params.receipt_id;
  const orders = db.prepare(`
    SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, p.name as product_name, p.category, p.price
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    JOIN products p ON o.product_id = p.id
    WHERE o.user_id = ? AND o.receipt_id = ?
    ORDER BY o.date_created ASC
  `).all(userId, receiptId);
  res.json(orders);
});

// GET dashboard stats
// Optional query params: month (1-12), year (e.g. 2026). Either/both can be omitted or 'all' to mean "all time".
router.get('/stats', (req, res) => {
  const userId = getUserId(req);

  const { month, year } = req.query;
  const hasMonth = month && month !== 'all';
  const hasYear = year && year !== 'all';

  // Build a reusable date filter clause for a given date column
  function dateFilter(column) {
    const clauses = [];
    const params = [];
    if (hasMonth) {
      clauses.push(`CAST(strftime('%m', ${column}) AS INTEGER) = ?`);
      params.push(parseInt(month, 10));
    }
    if (hasYear) {
      clauses.push(`CAST(strftime('%Y', ${column}) AS INTEGER) = ?`);
      params.push(parseInt(year, 10));
    }
    return { sql: clauses.length ? ' AND ' + clauses.join(' AND ') : '', params };
  }

  const orderDateFilter = dateFilter('o.date_created');
  const customerDateFilter = dateFilter('date_created');

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM orders o WHERE o.user_id = ?${orderDateFilter.sql}
  `).get(userId, ...orderDateFilter.params).count;

  const delivered = db.prepare(`
    SELECT COUNT(*) as count FROM orders o WHERE o.status='Delivered' AND o.user_id = ?${orderDateFilter.sql}
  `).get(userId, ...orderDateFilter.params).count;

  const pending = db.prepare(`
    SELECT COUNT(*) as count FROM orders o WHERE o.status='Pending' AND o.user_id = ?${orderDateFilter.sql}
  `).get(userId, ...orderDateFilter.params).count;

  const outForDelivery = db.prepare(`
    SELECT COUNT(*) as count FROM orders o WHERE o.status='Out for Delivery' AND o.user_id = ?${orderDateFilter.sql}
  `).get(userId, ...orderDateFilter.params).count;

  const totalSalesRow = db.prepare(`
    SELECT COALESCE(SUM(p.price), 0) as total
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE o.user_id = ? AND p.user_id = ?${orderDateFilter.sql}
  `).get(userId, userId, ...orderDateFilter.params);
  const totalSales = totalSalesRow.total;

  const totalCustomers = db.prepare(`
    SELECT COUNT(*) as count FROM customers WHERE user_id = ?${customerDateFilter.sql}
  `).get(userId, ...customerDateFilter.params).count;

  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE user_id = ?').get(userId).count;

  res.json({ total, delivered, pending, outForDelivery, totalSales, totalCustomers, totalProducts });
});

// GET last 5 orders
router.get('/recent', (req, res) => {
  const userId = getUserId(req);
  const orders = db.prepare(`
    SELECT o.*, c.name as customer_name, p.name as product_name, p.price
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    JOIN products p ON o.product_id = p.id
    WHERE o.user_id = ? AND c.user_id = ? AND p.user_id = ?
    ORDER BY o.date_created DESC
    LIMIT 5
  `).all(userId, userId, userId);
  res.json(orders);
});

// POST create order
router.post('/', (req, res) => {
  const { customer_id, product_id, status, user_id, receipt_id } = req.body;
  const userId = user_id || getUserId(req);
  if (!customer_id || !product_id) return res.status(400).json({ error: 'Customer and Product are required' });
  const result = db.prepare('INSERT INTO orders (customer_id, product_id, status, user_id, receipt_id) VALUES (?, ?, ?, ?, ?)').run(customer_id, product_id, status || 'Pending', userId, receipt_id || null);
  res.json({ id: result.lastInsertRowid, message: 'Order created successfully' });
});

// PUT update order
router.put('/:id', (req, res) => {
  const { customer_id, product_id, status, user_id } = req.body;
  const userId = user_id || getUserId(req);
  db.prepare('UPDATE orders SET customer_id=?, product_id=?, status=? WHERE id=? AND user_id=?').run(customer_id, product_id, status, req.params.id, userId);
  res.json({ message: 'Order updated successfully' });
});

// DELETE order
router.delete('/:id', (req, res) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM orders WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ message: 'Order deleted successfully' });
});

module.exports = router;