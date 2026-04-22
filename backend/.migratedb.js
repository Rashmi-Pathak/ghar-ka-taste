const db = require('better-sqlite3')('gharkatasté.db');
try {
  db.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cash_on_delivery'");
  console.log('payment_method column added');
} catch(e) {
  console.log('Result:', e.message);
}
