const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDb } = require('../db');
const { authenticate } = require('./auth');

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `chef_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET all chefs (with optional area/search filter)
router.get('/', (req, res) => {
  const { area, search } = req.query;
  const db = getDb();
  let query = 'SELECT * FROM chefs WHERE is_verified = 1';
  const params = [];

  if (area && area !== 'All') {
    query += ' AND area = ?';
    params.push(area);
  }
  if (search) {
    query += ' AND (name LIKE ? OR menu LIKE ? OR speciality LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY rating DESC';
  const chefs = db.prepare(query).all(...params);
  res.json(chefs);
});

// GET single chef
router.get('/:id', (req, res) => {
  const db = getDb();
  const chef = db.prepare('SELECT * FROM chefs WHERE id = ?').get(req.params.id);
  if (!chef) return res.status(404).json({ error: 'Chef not found' });
  res.json(chef);
});

// GET current chef's profile (logged in chef)
router.get('/my/profile', authenticate, (req, res) => {
  const db = getDb();
  const chef = db.prepare('SELECT * FROM chefs WHERE user_id = ?').get(req.user.id);
  res.json(chef || null);
});

// CREATE or UPDATE chef profile (for role=chef)
router.post('/', authenticate, upload.single('image'), (req, res) => {
  if (req.user.role !== 'chef')
    return res.status(403).json({ error: 'Only chefs can create profiles' });

  const { name, location, area, phone, bio } = req.body;
  if (!name || !location || !area || !phone)
    return res.status(400).json({ error: 'Required fields missing' });

  const menu = 'N/A';
  const speciality = 'N/A';
  const price_range = 'N/A';

  const db = getDb();
  const existing = db.prepare('SELECT id FROM chefs WHERE user_id = ?').get(req.user.id);
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

  if (existing) {
    db.prepare(`
      UPDATE chefs SET name=?, location=?, area=?, menu=?, speciality=?, price_range=?, phone=?, bio=?, image_url=COALESCE(?,image_url)
      WHERE user_id=?
    `).run(name, location, area, menu, speciality, price_range, phone, bio, imageUrl, req.user.id);
    const updated = db.prepare('SELECT * FROM chefs WHERE user_id = ?').get(req.user.id);
    return res.json(updated);
  }

  const result = db.prepare(`
    INSERT INTO chefs (user_id, name, location, area, menu, speciality, price_range, phone, bio, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, name, location, area, menu, speciality, price_range, phone, bio, imageUrl);

  const chef = db.prepare('SELECT * FROM chefs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(chef);
});

// Toggle availability
router.patch('/:id/availability', authenticate, (req, res) => {
  const db = getDb();
  const chef = db.prepare('SELECT * FROM chefs WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!chef) return res.status(404).json({ error: 'Not found or unauthorized' });
  db.prepare('UPDATE chefs SET available = ? WHERE id = ?').run(chef.available ? 0 : 1, chef.id);
  res.json({ available: !chef.available });
});

// DELETE chef profile
router.delete('/my/profile', authenticate, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM chefs WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Chef profile deleted' });
});

// POST a review
router.post('/:id/reviews', authenticate, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating) return res.status(400).json({ error: 'Rating required' });

  const db = getDb();
  db.prepare('INSERT INTO reviews (chef_id, user_id, rating, comment) VALUES (?, ?, ?, ?)').run(req.params.id, req.user.id, rating, comment);

  // Update average rating
  const avg = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE chef_id = ?').get(req.params.id);
  db.prepare('UPDATE chefs SET rating = ? WHERE id = ?').run(Math.round(avg.avg * 10) / 10, req.params.id);

  res.status(201).json({ message: 'Review added' });
});

// GET meals for a chef
router.get('/:id/meals', (req, res) => {
  const db = getDb();
  let showAll = false;
  
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'gharkatasté_super_secret_2024';
      const user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
      
      if (user.role === 'admin') {
        showAll = true;
      } else if (user.role === 'chef') {
        const chef = db.prepare('SELECT id FROM chefs WHERE user_id = ?').get(user.id);
        if (chef && chef.id === parseInt(req.params.id)) showAll = true;
      }
    } catch (e) {
      // ignore invalid token, just treat as public
    }
  }

  let query = 'SELECT * FROM meals WHERE chef_id = ?';
  if (!showAll) query += ' AND is_verified = 1';
  query += ' ORDER BY category, name';

  const meals = db.prepare(query).all(req.params.id);
  res.json(meals);
});

// POST add meal (chef only)
router.post('/:id/meals', authenticate, upload.single('image'), (req, res) => {
  if (req.user.role !== 'chef') return res.status(403).json({ error: 'Only chefs can add meals' });
  const db = getDb();
  const chef = db.prepare('SELECT id FROM chefs WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!chef) return res.status(403).json({ error: 'Not your chef profile' });

  const { category, name, ingredients, is_veg, price } = req.body;
  if (!category || !name || !ingredients || is_veg === undefined || !price) return res.status(400).json({ error: 'All fields required' });

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const result = db.prepare('INSERT INTO meals (chef_id, category, name, ingredients, is_veg, price, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.params.id, category, name, ingredients, is_veg, price, imageUrl);
  const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(meal);
});

// DELETE meal (chef only)
router.delete('/meals/:mealId', authenticate, (req, res) => {
  if (req.user.role !== 'chef') return res.status(403).json({ error: 'Only chefs can delete meals' });
  const db = getDb();
  const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(req.params.mealId);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });
  const chef = db.prepare('SELECT id FROM chefs WHERE id = ? AND user_id = ?').get(meal.chef_id, req.user.id);
  if (!chef) return res.status(403).json({ error: 'Not your meal' });
  db.prepare('DELETE FROM meals WHERE id = ?').run(req.params.mealId);
  res.json({ message: 'Meal deleted' });
});

// GET feedback for a chef
router.get('/:id/feedback', (req, res) => {
  const db = getDb();
  const feedback = db.prepare('SELECT f.*, u.name as user_name FROM feedback f JOIN users u ON f.user_id = u.id WHERE f.chef_id = ? ORDER BY f.created_at DESC').all(req.params.id);
  res.json(feedback);
});

// POST feedback (customer only)
router.post('/:id/feedback', authenticate, (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Only customers can give feedback' });
  const { rating, comment } = req.body;
  if (!rating) return res.status(400).json({ error: 'Rating required' });

  const db = getDb();
  db.prepare('INSERT INTO feedback (user_id, chef_id, rating, comment) VALUES (?, ?, ?, ?)').run(req.user.id, req.params.id, rating, comment);
  res.status(201).json({ message: 'Feedback added' });
});

module.exports = router;
