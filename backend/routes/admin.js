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
router.get('/chefs', authenticate, isAdmin, (req, res) => {
  const db = getDb();
  const chefs = db.prepare('SELECT * FROM chefs ORDER BY created_at DESC').all();
  res.json(chefs);
});

// TOGGLE verification status
router.patch('/verify-chef/:id', authenticate, isAdmin, (req, res) => {
  const db = getDb();
  const chefId = req.params.id;
  
  const chef = db.prepare('SELECT id, is_verified FROM chefs WHERE id = ?').get(chefId);
  if (!chef) return res.status(404).json({ error: 'Chef not found' });

  const newStatus = chef.is_verified ? 0 : 1;
  db.prepare('UPDATE chefs SET is_verified = ? WHERE id = ?').run(newStatus, chefId);
  
  res.json({ success: true, is_verified: newStatus });
});

// TOGGLE verification status for meals
router.patch('/verify-meal/:id', authenticate, isAdmin, (req, res) => {
  const db = getDb();
  const mealId = req.params.id;
  
  const meal = db.prepare('SELECT id, is_verified FROM meals WHERE id = ?').get(mealId);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });

  const newStatus = meal.is_verified ? 0 : 1;
  db.prepare('UPDATE meals SET is_verified = ? WHERE id = ?').run(newStatus, mealId);
  
  res.json({ success: true, is_verified: newStatus });
});

module.exports = router;
