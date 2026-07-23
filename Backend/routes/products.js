const express = require('express');
const router = express.Router();
const db = require('../db/database');

function getUserId(req) {
  const userId = req.headers['x-user-id'] || req.query.user_id || req.body?.user_id;
  return userId || 'default';
}

// GET all products
router.get('/', (req, res) => {
  const userId = getUserId(req);
  const products = db.prepare('SELECT * FROM products WHERE user_id = ? ORDER BY date_created DESC').all(userId);
  res.json(products);
});

// GET single product
router.get('/:id', (req, res) => {
  const userId = getUserId(req);
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST create product
router.post('/', (req, res) => {
  const { name, price, category, description } = req.body;
  const userId = getUserId(req);
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const result = db.prepare('INSERT INTO products (name, price, category, description, user_id) VALUES (?, ?, ?, ?, ?)').run(name, price, category, description, userId);
  res.json({ id: result.lastInsertRowid, message: 'Product created successfully' });
});

// PUT update product
router.put('/:id', (req, res) => {
  const { name, price, category, description } = req.body;
  const userId = getUserId(req);
  db.prepare('UPDATE products SET name=?, price=?, category=?, description=? WHERE id=? AND user_id=?').run(name, price, category, description, req.params.id, userId);
  res.json({ message: 'Product updated successfully' });
});

// DELETE product
router.delete('/:id', (req, res) => {
  const userId = getUserId(req);
  db.prepare('DELETE FROM products WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ message: 'Product deleted successfully' });
});

module.exports = router;
