/**
 * Migration: Add payment_method column to orders table
 * Adds support for payment method selection (cash_on_delivery, etc.)
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../gharkatasté.db');
const db = new Database(DB_PATH);

console.log('Migration: Adding payment_method column to orders table...');

try {
  db.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cash_on_delivery'");
  console.log('✅ payment_method column added successfully');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('⚠️  Column already exists, skipping...');
  } else {
    throw e;
  }
} finally {
  db.close();
}
