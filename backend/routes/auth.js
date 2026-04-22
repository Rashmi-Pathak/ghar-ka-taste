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
    const result = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email]
    });
    
    if (result.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

    await db.execute({ sql: 'DELETE FROM otps WHERE email = ?', args: [email] });
    await db.execute({
      sql: 'INSERT INTO otps (email, code, expires_at) VALUES (?, ?, ?)',
      args: [email, otpCode, expiresAt]
    });

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
router.post('/register', async (req, res) => {
  const { name, email, password, role, otp_code } = req.body;
  if (!name || !email || !password || !role || !otp_code)
    return res.status(400).json({ error: 'All fields required including OTP' });
  if (!['customer', 'chef'].includes(role))
    return res.status(400).json({ error: 'Invalid role' });

  try {
    const db = getDb();
    
    // Verify OTP
    const otpResult = await db.execute({
      sql: 'SELECT * FROM otps WHERE email = ? ORDER BY id DESC LIMIT 1',
      args: [email]
    });
    const otpRecord = otpResult.rows[0];

    if (!otpRecord) return res.status(400).json({ error: 'Please request an OTP first' });
    if (otpRecord.code !== otp_code) return res.status(400).json({ error: 'Invalid OTP code' });
    if (new Date(otpRecord.expires_at) < new Date()) return res.status(400).json({ error: 'OTP expired' });

    const existsResult = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email]
    });
    if (existsResult.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      args: [name, email, hash, role]
    });
    
    const userId = Number(result.lastInsertRowid);
    
    // Cleanup OTP
    await db.execute({ sql: 'DELETE FROM otps WHERE email = ?', args: [email] });

    const token = jwt.sign({ id: userId, name, email, role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: userId, name, email, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  try {
    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
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

async function authenticate(req, res, next) {
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

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE account
router.delete('/account', authenticate, async (req, res) => {
  const db = getDb();
  try {
    const userId = req.user.id;
    
    // Cascade delete related data (LibSQL/SQLite handles some via CASCADE but manual is safer here)
    const chefResult = await db.execute({ sql: 'SELECT id FROM chefs WHERE user_id = ?', args: [userId] });
    const chef = chefResult.rows[0];
    
    if (chef) {
      await db.execute({ sql: 'DELETE FROM meals WHERE chef_id = ?', args: [chef.id] });
      await db.execute({ sql: 'DELETE FROM orders WHERE chef_id = ?', args: [chef.id] });
      await db.execute({ sql: 'DELETE FROM feedback WHERE chef_id = ?', args: [chef.id] });
      await db.execute({ sql: 'DELETE FROM favorites WHERE chef_id = ?', args: [chef.id] });
      await db.execute({ sql: 'DELETE FROM chefs WHERE id = ?', args: [chef.id] });
    }
    
    await db.execute({ sql: 'DELETE FROM orders WHERE customer_id = ?', args: [userId] });
    await db.execute({ sql: 'DELETE FROM favorites WHERE user_id = ?', args: [userId] });
    await db.execute({ sql: 'DELETE FROM feedback WHERE user_id = ?', args: [userId] });
    
    // Cleanup OTP using email
    const emailResult = await db.execute({ sql: 'SELECT email FROM users WHERE id = ?', args: [userId] });
    if (emailResult.rows[0]) {
      await db.execute({ sql: 'DELETE FROM otps WHERE email = ?', args: [emailResult.rows[0].email] });
    }
    
    await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [userId] });
    res.json({ message: 'Account deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
module.exports.authenticate = authenticate;
