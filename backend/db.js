const { createClient } = require('@libsql/client');
require('dotenv').config();

let client;

function getDb() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_URL || 'file:gharkatasté.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

async function initDb() {
  const db = getDb();

  try {
    // We execute statements individually for better reliability across different platforms
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('customer', 'chef', 'admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS chefs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        area TEXT NOT NULL,
        menu TEXT NOT NULL,
        speciality TEXT,
        price_range TEXT NOT NULL,
        phone TEXT NOT NULL,
        rating REAL DEFAULT 4.5,
        image_url TEXT,
        bio TEXT,
        available INTEGER DEFAULT 1,
        is_verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chef_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chef_id INTEGER NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('Breakfast', 'Lunch', 'Dinner')),
        name TEXT NOT NULL,
        ingredients TEXT NOT NULL,
        is_veg INTEGER NOT NULL CHECK(is_veg IN (0, 1)),
        price REAL NOT NULL,
        image_url TEXT,
        is_verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS otps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        chef_id INTEGER NOT NULL,
        items_json TEXT NOT NULL,
        total REAL NOT NULL,
        contact_info TEXT,
        delivery_address TEXT,
        payment_method TEXT DEFAULT 'cash_on_delivery',
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        chef_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
        UNIQUE(user_id, chef_id)
      )`,
      `CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        chef_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
      )`
    ];

    for (const statement of statements) {
      await db.execute(statement);
    }

    // Handle migrations
    try { await db.execute('ALTER TABLE orders ADD COLUMN contact_info TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE orders ADD COLUMN delivery_address TEXT'); } catch(e) {}
    try { await db.execute("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cash_on_delivery'"); } catch(e) {}

    // Seed Admin if it doesn't exist
    const countResult = await db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const count = countResult.rows[0].count;
    if (count === 0 || count === 0n) {
      await seedAdminUser(db);
    }

    console.log('✅ Database initialized on Turso');
  } catch (err) {
    console.error('❌ Database Initialization Error:', err);
  }
}

async function seedAdminUser(db) {
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('123456', 10);
  await db.execute({
    sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    args: ['Admin', 'admin@admin.com', hash, 'admin']
  });
  console.log('✅ Admin user created');
}

module.exports = { getDb, initDb };
