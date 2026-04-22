const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../backend/gharkatasté.db');
const db = new Database(DB_PATH);

console.log('Migrating orders table...');

try {
    db.exec('DROP TABLE IF EXISTS orders;');
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
    console.log('✅ Orders table recreated successfully.');
} catch (e) {
    console.error('❌ Migration failed:', e);
} finally {
    db.close();
}
