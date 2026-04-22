const express = require('express');
const { getDb } = require('../db');
const { authenticate } = require('./auth');

const router = express.Router();

// POST place order (customer only)
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Only customers can place orders' });
  const { chef_id, items, total, contact_info, delivery_address, payment_method } = req.body;
  if (!chef_id || !items || !total || !contact_info || !delivery_address) return res.status(400).json({ error: 'Chef ID, items, total, contact_info, and delivery_address required' });

  const db = getDb();
  try {
    const itemsJson = JSON.stringify(items);
    const method = payment_method || 'cash_on_delivery';
    const result = await db.execute({
      sql: 'INSERT INTO orders (customer_id, chef_id, items_json, total, contact_info, delivery_address, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [req.user.id, chef_id, itemsJson, total, contact_info, delivery_address, method]
    });
    
    const orderId = Number(result.lastInsertRowid);
    const orderResult = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [orderId] });
    const order = orderResult.rows[0];
    order.items = JSON.parse(order.items_json);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET my orders (customer)
router.get('/my', authenticate, async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Only customers have orders' });
  const db = getDb();
  try {
    const result = await db.execute({
      sql: `SELECT o.*, c.name as chef_name, c.location as chef_location, c.id as chef_table_id
            FROM orders o
            JOIN chefs c ON o.chef_id = c.id
            WHERE o.customer_id = ?
            ORDER BY o.created_at DESC`,
      args: [req.user.id]
    });
    const orders = result.rows;
    orders.forEach(order => order.items = JSON.parse(order.items_json));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET orders for chef (chef only)
router.get('/chef', authenticate, async (req, res) => {
  if (req.user.role !== 'chef') return res.status(403).json({ error: 'Only chefs can view orders' });
  const db = getDb();
  try {
    const chefResult = await db.execute({ sql: 'SELECT id FROM chefs WHERE user_id = ?', args: [req.user.id] });
    const chef = chefResult.rows[0];
    if (!chef) return res.status(404).json({ error: 'Chef profile not found' });

    const result = await db.execute({
      sql: `SELECT o.*, u.name as customer_name, u.email as customer_email
            FROM orders o
            JOIN users u ON o.customer_id = u.id
            WHERE o.chef_id = ?
            ORDER BY o.created_at DESC`,
      args: [chef.id]
    });
    const orders = result.rows;
    orders.forEach(order => order.items = JSON.parse(order.items_json));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update order status (chef only)
router.patch('/:id/status', authenticate, async (req, res) => {
  if (req.user.role !== 'chef') return res.status(403).json({ error: 'Only chefs can update status' });
  const { status } = req.body;
  const allowed = ['confirmed', 'preparing', 'out_for_delivery', 'cancelled'];
  if (!status || !allowed.includes(status)) return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });

  const db = getDb();
  try {
    const orderResult = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [req.params.id] });
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const chefResult = await db.execute({ sql: 'SELECT id FROM chefs WHERE id = ? AND user_id = ?', args: [order.chef_id, req.user.id] });
    if (chefResult.rows.length === 0) return res.status(403).json({ error: 'Not your order' });

    await db.execute({ sql: 'UPDATE orders SET status = ? WHERE id = ?', args: [status, req.params.id] });
    res.json({ message: 'Status updated', status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH customer confirms delivery
router.patch('/:id/confirm-delivery', authenticate, async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Only customers can confirm delivery' });
  const db = getDb();
  try {
    const result = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ? AND customer_id = ?', args: [req.params.id, req.user.id] });
    const order = result.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'out_for_delivery') return res.status(400).json({ error: 'Order is not out for delivery yet' });
    
    await db.execute({ sql: 'UPDATE orders SET status = ? WHERE id = ?', args: ['delivered', req.params.id] });
    res.json({ message: 'Order confirmed as delivered', status: 'delivered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST toggle favorite
router.post('/favorites/toggle', authenticate, async (req, res) => {
  const { chef_id } = req.body;
  if (!chef_id) return res.status(400).json({ error: 'Chef ID required' });
  const db = getDb();
  try {
    const result = await db.execute({ sql: 'SELECT id FROM favorites WHERE user_id = ? AND chef_id = ?', args: [req.user.id, chef_id] });
    const existing = result.rows[0];
    
    if (existing) {
      await db.execute({ sql: 'DELETE FROM favorites WHERE id = ?', args: [existing.id] });
      return res.json({ favorited: false });
    } else {
      await db.execute({ sql: 'INSERT INTO favorites (user_id, chef_id) VALUES (?, ?)', args: [req.user.id, chef_id] });
      return res.json({ favorited: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET my favorites
router.get('/favorites/my', authenticate, async (req, res) => {
  const db = getDb();
  try {
    const result = await db.execute({
      sql: `SELECT c.* FROM favorites f
            JOIN chefs c ON f.chef_id = c.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC`,
      args: [req.user.id]
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;