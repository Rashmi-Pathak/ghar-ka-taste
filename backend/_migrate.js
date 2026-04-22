const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'gharkatasté.db');
const db = new Database(DB_PATH);

try {
  db.exec('ALTER TABLE orders ADD COLUMN contact_info TEXT');
  console.log('Added contact_info');
} catch (e) {
  console.log('contact_info already exists', e.message);
}

try {
  db.exec('ALTER TABLE orders ADD COLUMN delivery_address TEXT');
  console.log('Added delivery_address');
} catch (e) {
  console.log('delivery_address already exists', e.message);
}

try {
  db.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cash_on_delivery'");
  console.log('Added payment_method');
} catch (e) {
  console.log('payment_method already exists', e.message);
}

console.log('Migration complete');
