const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'gharkatasté.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'chef', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chefs (
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
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chef_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meals (
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
    );

    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
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
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chef_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE,
      UNIQUE(user_id, chef_id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chef_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
    );
  `);

  try { database.exec('ALTER TABLE orders ADD COLUMN contact_info TEXT'); } catch(e) {}
  try { database.exec('ALTER TABLE orders ADD COLUMN delivery_address TEXT'); } catch(e) {}
  try { database.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cash_on_delivery'"); } catch(e) {}

  // Seed Admin if it doesn't exist
  const count = database.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").get();
  if (count.c === 0) seedAdminUser(database);

  console.log('✅ Database initialized');
}

function seedAdminUser(database) {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('123456', 10);
  const insertUser = database.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  );
  insertUser.run('Admin', 'admin@admin.com', hash, 'admin');
  console.log('✅ Admin user created');
}

module.exports = { getDb, initDb };
