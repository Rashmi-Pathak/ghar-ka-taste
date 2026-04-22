const express = require('express');
const { getDb } = require('../db');
const { authenticate } = require('./auth');

const router = express.Router();

// Middleware to ensure user is admin
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can perform this action' });
  }
  next();
}

// GET all chefs (including unverified)
router.get('/chefs', authenticate, isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const result = await db.execute('SELECT * FROM chefs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TOGGLE verification status
router.patch('/verify-chef/:id', authenticate, isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const chefId = req.params.id;
    const result = await db.execute({ sql: 'SELECT id, is_verified FROM chefs WHERE id = ?', args: [chefId] });
    const chef = result.rows[0];
    if (!chef) return res.status(404).json({ error: 'Chef not found' });

    const newStatus = chef.is_verified ? 0 : 1;
    await db.execute({ sql: 'UPDATE chefs SET is_verified = ? WHERE id = ?', args: [newStatus, chefId] });
    
    res.json({ success: true, is_verified: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TOGGLE verification status for meals
router.patch('/verify-meal/:id', authenticate, isAdmin, async (req, res) => {
  const db = getDb();
  try {
    const mealId = req.params.id;
    const result = await db.execute({ sql: 'SELECT id, is_verified FROM meals WHERE id = ?', args: [mealId] });
    const meal = result.rows[0];
    if (!meal) return res.status(404).json({ error: 'Meal not found' });

    const newStatus = meal.is_verified ? 0 : 1;
    await db.execute({ sql: 'UPDATE meals SET is_verified = ? WHERE id = ?', args: [newStatus, mealId] });
    
    res.json({ success: true, is_verified: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
