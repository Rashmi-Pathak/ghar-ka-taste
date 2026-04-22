/**
 * Migration: Create/Recreate orders table with full schema
 * Ensures orders table exists with all required columns and constraints
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../gharkatasté.db');
const db = new Database(DB_PATH);

console.log('Migration: Creating orders table...');

try {
  // Check if table exists
  const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'").get();
  if (tableInfo) {
    console.log('Dropping existing orders table...');
    db.exec('DROP TABLE IF EXISTS orders;');
  }

  db.exec(`
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      chef_id INTEGER NOT NULL,
      items_json TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
      payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (chef_id) REFERENCES chefs(id) ON DELETE CASCADE
    );
  `);

  console.log('✅ Orders table created successfully with full schema');
} catch (e) {
  console.error('❌ Migration failed:', e.message);
  process.exit(1);
} finally {
  db.close();
}
