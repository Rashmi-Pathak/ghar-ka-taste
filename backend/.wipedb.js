const db = require('better-sqlite3')('gharkatasté.db');
db.exec("DELETE FROM feedback; DELETE FROM favorites; DELETE FROM orders; DELETE FROM otps; DELETE FROM meals; DELETE FROM chefs; DELETE FROM users WHERE role != 'admin';");
console.log('Database wiped completely, retaining only admin');
