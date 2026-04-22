const express = require('express');
const { getDb } = require('../db');
const { authenticate } = require('./auth');

const router = express.Router();

// POST place order (customer only)
router.post('/', authenticate, (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Only customers can place orders' });
  const { chef_id, items, total, contact_info, delivery_address, payment_method } = req.body;
  if (!chef_id || !items || !total || !contact_info || !delivery_address) return res.status(400).json({ error: 'Chef ID, items, total, contact_info, and delivery_address required' });

  const db = getDb();
  const itemsJson = JSON.stringify(items);
  const method = payment_method || 'cash_on_delivery';
  const result = db.prepare(
    'INSERT INTO orders (customer_id, chef_id, items_json, total, contact_info, delivery_address, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, chef_id, itemsJson, total, contact_info, delivery_address, method);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  order.items = JSON.parse(order.items_json);
  res.status(201).json(order);
});

// GET my orders (customer)
router.get('/my', authenticate, (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Only customers have orders' });
  const db = getDb();
  const orders = db.prepare(`
    SELECT o.*, c.name as chef_name, c.location as chef_location, c.id as chef_table_id
    FROM orders o
    JOIN chefs c ON o.chef_id = c.id
    WHERE o.customer_id = ?
    ORDER BY o.created_at DESC
  `).all(req.user.id);
  orders.forEach(order => order.items = JSON.parse(order.items_json));
  res.json(orders);
});

// GET orders for chef (chef only)
router.get('/chef', authenticate, (req, res) => {
  if (req.user.role !== 'chef') return res.status(403).json({ error: 'Only chefs can view orders' });
  const db = getDb();
  const chef = db.prepare('SELECT id FROM chefs WHERE user_id = ?').get(req.user.id);
  if (!chef) return res.status(404).json({ error: 'Chef profile not found' });
  const orders = db.prepare(`
    SELECT o.*, u.name as customer_name, u.email as customer_email
    FROM orders o
    JOIN users u ON o.customer_id = u.id
    WHERE o.chef_id = ?
    ORDER BY o.created_at DESC
  `).all(chef.id);
  orders.forEach(order => order.items = JSON.parse(order.items_json));
  res.json(orders);
});

// PATCH update order status (chef only) - chef can move pending -> confirmed -> preparing -> out_for_delivery
router.patch('/:id/status', authenticate, (req, res) => {
  if (req.user.role !== 'chef') return res.status(403).json({ error: 'Only chefs can update status' });
  const { status } = req.body;
  const allowed = ['confirmed', 'preparing', 'out_for_delivery', 'cancelled'];
  if (!status || !allowed.includes(status)) return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const chef = db.prepare('SELECT id FROM chefs WHERE id = ? AND user_id = ?').get(order.chef_id, req.user.id);
  if (!chef) return res.status(403).json({ error: 'Not your order' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Status updated', status });
});

// PATCH customer confirms delivery
router.patch('/:id/confirm-delivery', authenticate, (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Only customers can confirm delivery' });
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND customer_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'out_for_delivery') return res.status(400).json({ error: 'Order is not out for delivery yet' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('delivered', req.params.id);
  res.json({ message: 'Order confirmed as delivered', status: 'delivered' });
});

// POST toggle favorite
router.post('/favorites/toggle', authenticate, (req, res) => {
  const { chef_id } = req.body;
  if (!chef_id) return res.status(400).json({ error: 'Chef ID required' });
  const db = getDb();
  const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND chef_id = ?').get(req.user.id, chef_id);
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
    return res.json({ favorited: false });
  } else {
    db.prepare('INSERT INTO favorites (user_id, chef_id) VALUES (?, ?)').run(req.user.id, chef_id);
    return res.json({ favorited: true });
  }
});

// GET my favorites
router.get('/favorites/my', authenticate, (req, res) => {
  const db = getDb();
  const favorites = db.prepare(`
    SELECT c.* FROM favorites f
    JOIN chefs c ON f.chef_id = c.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.user.id);
  res.json(favorites);
});

module.exports = router;