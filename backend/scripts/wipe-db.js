/**
 * Database Wipe Script - DEVELOPMENT ONLY
 * ⚠️  WARNING: This script deletes all user and application data!
 * Use only during development/testing to reset the database state.
 * Preserves admin users for testing.
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../gharkatasté.db');

if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: Cannot run wipe-db.js in production!');
  process.exit(1);
}

const db = new Database(DB_PATH);

console.log('⚠️  Wiping database (preserving admin users)...');

try {
  db.exec(`
    DELETE FROM feedback;
    DELETE FROM favorites;
    DELETE FROM orders;
    DELETE FROM otps;
    DELETE FROM meals;
    DELETE FROM chefs;
    DELETE FROM users WHERE role != 'admin';
  `);
  console.log('✅ Database wiped successfully - retaining admin users only');
} catch (e) {
  console.error('❌ Wipe failed:', e.message);
  process.exit(1);
} finally {
  db.close();
}
