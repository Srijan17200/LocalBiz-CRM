const express = require('express');
const router = express.Router();
const db = require('../db/database');

function getUserId(req) {
  const userId = req.headers['x-user-id'] || req.query.user_id || req.body?.user_id;
  return userId || 'default';
}

// GET all customers
router.get('/', (req, res) => {
  const userId = getUserId(req);
  const customers = db.prepare(`
    SELECT c.*, COUNT(o.id) as order_count 
    FROM customers c 
    LEFT JOIN orders o ON c.id = o.customer_id 
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY c.date_created DESC
  `).all(userId);
  res.json(customers);
});

// GET single customer with orders
router.get('/:id', (req, res) => {
  const userId = getUserId(req);
  const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const orders = db.prepare(`
    SELECT o.*, p.name as product_name, p.category, p.price
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE o.customer_id = ? AND o.user_id = ?
    ORDER BY o.date_created DESC
  `).all(req.params.id, userId);
  res.json({ customer, orders });
});

// POST create customer
router.post('/', (req, res) => {
  const { name, phone, email } = req.body;
  const userId = getUserId(req);
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const result = db.prepare('INSERT INTO customers (name, phone, email, user_id) VALUES (?, ?, ?, ?)').run(name, phone, email, userId);
  res.json({ id: result.lastInsertRowid, message: 'Customer created successfully' });
});

// PUT update customer
router.put('/:id', (req, res) => {
  const { name, phone, email } = req.body;
  const userId = getUserId(req);
  db.prepare('UPDATE customers SET name=?, phone=?, email=? WHERE id=? AND user_id=?').run(name, phone, email, req.params.id, userId);
  res.json({ message: 'Customer updated successfully' });
});

// DELETE customer
router.delete('/:id', (req, res) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM orders WHERE customer_id = ? AND user_id = ?').run(req.params.id, userId);
  db.prepare('DELETE FROM customers WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ message: 'Customer deleted successfully' });
});

module.exports = router;
