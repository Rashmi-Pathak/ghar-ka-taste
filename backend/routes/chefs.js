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

// GET all chefs
router.get('/', async (req, res) => {
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
  try {
    const result = await db.execute({ sql: query, args: params });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single chef
router.get('/:id', async (req, res) => {
  const db = getDb();
  try {
    const result = await db.execute({ sql: 'SELECT * FROM chefs WHERE id = ?', args: [req.params.id] });
    const chef = result.rows[0];
    if (!chef) return res.status(404).json({ error: 'Chef not found' });
    res.json(chef);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET current chef's profile
router.get('/my/profile', authenticate, async (req, res) => {
  const db = getDb();
  try {
    const result = await db.execute({ sql: 'SELECT * FROM chefs WHERE user_id = ?', args: [req.user.id] });
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE or UPDATE chef profile
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'chef')
    return res.status(403).json({ error: 'Only chefs can create profiles' });

  const { name, location, area, phone, bio } = req.body;
  if (!name || !location || !area || !phone)
    return res.status(400).json({ error: 'Required fields missing' });

  const menu = 'N/A';
  const speciality = 'N/A';
  const price_range = 'N/A';

  const db = getDb();
  try {
    const existingResult = await db.execute({ sql: 'SELECT id FROM chefs WHERE user_id = ?', args: [req.user.id] });
    const existing = existingResult.rows[0];
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);

    if (existing) {
      await db.execute({
        sql: `UPDATE chefs SET name=?, location=?, area=?, menu=?, speciality=?, price_range=?, phone=?, bio=?, image_url=COALESCE(?,image_url)
              WHERE user_id=?`,
        args: [name, location, area, menu, speciality, price_range, phone, bio, imageUrl, req.user.id]
      });
      const updatedResult = await db.execute({ sql: 'SELECT * FROM chefs WHERE user_id = ?', args: [req.user.id] });
      return res.json(updatedResult.rows[0]);
    }

    const result = await db.execute({
      sql: `INSERT INTO chefs (user_id, name, location, area, menu, speciality, price_range, phone, bio, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [req.user.id, name, location, area, menu, speciality, price_range, phone, bio, imageUrl]
    });

    const chefId = Number(result.lastInsertRowid);
    const newChefResult = await db.execute({ sql: 'SELECT * FROM chefs WHERE id = ?', args: [chefId] });
    res.status(201).json(newChefResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle availability
router.patch('/:id/availability', authenticate, async (req, res) => {
  const db = getDb();
  try {
    const result = await db.execute({ sql: 'SELECT * FROM chefs WHERE id = ? AND user_id = ?', args: [req.params.id, req.user.id] });
    const chef = result.rows[0];
    if (!chef) return res.status(404).json({ error: 'Not found or unauthorized' });
    
    await db.execute({ sql: 'UPDATE chefs SET available = ? WHERE id = ?', args: [chef.available ? 0 : 1, chef.id] });
    res.json({ available: !chef.available });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET meals for a chef
router.get('/:id/meals', async (req, res) => {
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
        const result = await db.execute({ sql: 'SELECT id FROM chefs WHERE user_id = ?', args: [user.id] });
        const chef = result.rows[0];
        if (chef && chef.id === parseInt(req.params.id)) showAll = true;
      }
    } catch (e) { }
  }

  let query = 'SELECT * FROM meals WHERE chef_id = ?';
  if (!showAll) query += ' AND is_verified = 1';
  query += ' ORDER BY category, name';

  try {
    const result = await db.execute({ sql: query, args: [req.params.id] });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add meal (chef only)
router.post('/:id/meals', authenticate, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'chef') return res.status(403).json({ error: 'Only chefs can add meals' });
  const db = getDb();
  try {
    const chefResult = await db.execute({ sql: 'SELECT id FROM chefs WHERE id = ? AND user_id = ?', args: [req.params.id, req.user.id] });
    if (chefResult.rows.length === 0) return res.status(403).json({ error: 'Not your chef profile' });

    const { category, name, ingredients, is_veg, price } = req.body;
    if (!category || !name || !ingredients || is_veg === undefined || !price) return res.status(400).json({ error: 'All fields required' });

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const result = await db.execute({
      sql: 'INSERT INTO meals (chef_id, category, name, ingredients, is_veg, price, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [req.params.id, category, name, ingredients, is_veg, price, imageUrl]
    });
    
    const mealId = Number(result.lastInsertRowid);
    const newMeal = await db.execute({ sql: 'SELECT * FROM meals WHERE id = ?', args: [mealId] });
    res.status(201).json(newMeal.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE meal
router.delete('/meals/:mealId', authenticate, async (req, res) => {
  if (req.user.role !== 'chef') return res.status(403).json({ error: 'Only chefs can delete meals' });
  const db = getDb();
  try {
    const mealResult = await db.execute({ sql: 'SELECT * FROM meals WHERE id = ?', args: [req.params.mealId] });
    const meal = mealResult.rows[0];
    if (!meal) return res.status(404).json({ error: 'Meal not found' });
    
    const chefResult = await db.execute({ sql: 'SELECT id FROM chefs WHERE id = ? AND user_id = ?', args: [meal.chef_id, req.user.id] });
    if (chefResult.rows.length === 0) return res.status(403).json({ error: 'Not your meal' });
    
    await db.execute({ sql: 'DELETE FROM meals WHERE id = ?', args: [req.params.mealId] });
    res.json({ message: 'Meal deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET feedback
router.get('/:id/feedback', async (req, res) => {
  const db = getDb();
  try {
    const result = await db.execute({
      sql: 'SELECT f.*, u.name as user_name FROM feedback f JOIN users u ON f.user_id = u.id WHERE f.chef_id = ? ORDER BY f.created_at DESC',
      args: [req.params.id]
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST feedback
router.post('/:id/feedback', authenticate, async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Only customers can give feedback' });
  const { rating, comment } = req.body;
  if (!rating) return res.status(400).json({ error: 'Rating required' });

  const db = getDb();
  try {
    await db.execute({
      sql: 'INSERT INTO feedback (user_id, chef_id, rating, comment) VALUES (?, ?, ?, ?)',
      args: [req.user.id, req.params.id, rating, comment]
    });
    res.status(201).json({ message: 'Feedback added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
