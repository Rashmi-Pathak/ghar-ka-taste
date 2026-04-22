const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { getDb } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'gharkatasté_super_secret_2024';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const db = getDb();
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

    db.prepare('DELETE FROM otps WHERE email = ?').run(email);
    db.prepare('INSERT INTO otps (email, code, expires_at) VALUES (?, ?, ?)').run(email, otpCode, expiresAt);

    await transporter.sendMail({
      from: `"Ghar Ka Taste" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      text: `Your Ghar Ka Taste verification code is: ${otpCode}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #A0522D;">Welcome to Ghar Ka Taste! 🍛</h2>
          <p>Please use the following 6-digit code to verify your email address and complete registration:</p>
          <h1 style="letter-spacing: 5px; background: #f5f0e8; padding: 10px; border-radius: 8px; width: fit-content;">${otpCode}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    });

    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error('OTP Send Error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Register
router.post('/register', (req, res) => {
  const { name, email, password, role, otp_code } = req.body;
  if (!name || !email || !password || !role || !otp_code)
    return res.status(400).json({ error: 'All fields required including OTP' });
  if (!['customer', 'chef'].includes(role))
    return res.status(400).json({ error: 'Invalid role' });

  try {
    const db = getDb();
    
    // Verify OTP
    const otpRecord = db.prepare('SELECT * FROM otps WHERE email = ? ORDER BY id DESC LIMIT 1').get(email);
    if (!otpRecord) return res.status(400).json({ error: 'Please request an OTP first' });
    if (otpRecord.code !== otp_code) return res.status(400).json({ error: 'Invalid OTP code' });
    if (new Date(otpRecord.expires_at) < new Date()) return res.status(400).json({ error: 'OTP expired' });

    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    ).run(name, email, hash, role);
    
    // Cleanup OTP
    db.prepare('DELETE FROM otps WHERE email = ?').run(email);

    const token = jwt.sign({ id: result.lastInsertRowid, name, email, role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: result.lastInsertRowid, name, email, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete account
router.delete('/account', authenticate, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile
router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// GET current user
router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// DELETE account
router.delete('/account', authenticate, (req, res) => {
  const db = getDb();
  try {
    // Cascade delete related data
    const chef = db.prepare('SELECT id FROM chefs WHERE user_id = ?').get(req.user.id);
    if (chef) {
      db.prepare('DELETE FROM meals WHERE chef_id = ?').run(chef.id);
      db.prepare('DELETE FROM orders WHERE chef_id = ?').run(chef.id);
      db.prepare('DELETE FROM feedback WHERE chef_id = ?').run(chef.id);
      db.prepare('DELETE FROM favorites WHERE chef_id = ?').run(chef.id);
      db.prepare('DELETE FROM chefs WHERE id = ?').run(chef.id);
    }
    db.prepare('DELETE FROM orders WHERE customer_id = ?').run(req.user.id);
    db.prepare('DELETE FROM favorites WHERE user_id = ?').run(req.user.id);
    db.prepare('DELETE FROM feedback WHERE user_id = ?').run(req.user.id);
    db.prepare('DELETE FROM otps WHERE email = (SELECT email FROM users WHERE id = ?)').run(req.user.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    res.json({ message: 'Account deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
module.exports.authenticate = authenticate;
