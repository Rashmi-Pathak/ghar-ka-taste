# Database Migrations

This directory contains database migration scripts for the Ghar Ka Taste backend.

## Files

### 001-add-payment-method.js
Adds the `payment_method` column to the orders table.
- **Purpose**: Support payment method selection (cash_on_delivery, card, etc.)
- **Safe**: Idempotent - skips if column already exists

### 002-create-orders-table.js
Creates or recreates the complete orders table with full schema.
- **Purpose**: Initialize orders table with all required columns and constraints
- **Warning**: Drops existing orders table - use carefully!

## Running Migrations

### Individually
```bash
# From backend directory
node scripts/migrations/001-add-payment-method.js
node scripts/migrations/002-create-orders-table.js
```

### All at once (Recommended)
```bash
# From backend directory
npm run migrate
```

Make sure this script is defined in `backend/package.json`:
```json
"scripts": {
  "migrate": "node scripts/migrations/001-add-payment-method.js && node scripts/migrations/002-create-orders-table.js"
}
```

## Order of Execution

Migrations should be run in numerical order:
1. `001-add-payment-method.js`
2. `002-create-orders-table.js`

## Safety Notes

- ✅ Migrations are safe to run multiple times (idempotent where possible)
- ⚠️ `002-create-orders-table.js` drops and recreates the orders table - it will DELETE data
- 🔒 Always backup your database before running migrations in production
