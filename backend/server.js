require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const chefRoutes = require('./routes/chefs');
const orderRoutes = require('./routes/orders');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Middleware
app.use(cors({ 
  origin: true, // This allows any origin that sends the request, perfect for quick fixes
  credentials: true 
}));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chefs', chefRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Ghar Ka Taste API running 🍛' }));

// Initialize DB then start server
const startServer = async () => {
  await initDb();
  app.listen(PORT, () => {
    console.log(`✅ Ghar Ka Taste Server running at http://localhost:${PORT}`);
  });
};

startServer();
