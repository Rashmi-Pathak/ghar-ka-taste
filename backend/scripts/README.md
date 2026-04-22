# Backend Scripts

Utility and management scripts for the Ghar Ka Taste backend.

## Directory Structure

```
scripts/
├── migrations/          # Database migration scripts
│   ├── 001-add-payment-method.js
│   ├── 002-create-orders-table.js
│   └── README.md
├── wipe-db.js          # Database reset script (dev only)
└── README.md           # This file
```

## Available Scripts

### Database Migrations
See `migrations/README.md` for details.

```bash
npm run migrate    # Run all migrations (defined in package.json)
```

### Database Wipe (Development Only)
Resets the database to a clean state, preserving admin users.

```bash
# From backend directory
node scripts/wipe-db.js
```

⚠️ **WARNING**: Only works in development environment. Will error in production.

## Deployment

For smooth deployments:

1. **Before deploying**, ensure all migrations have been run:
   ```bash
   npm run migrate
   ```

2. **Backup your database** before running any migrations

3. **In production**, ensure `NODE_ENV=production` to prevent accidental data loss

## Adding New Migrations

1. Create a new file in `scripts/migrations/` with format: `NNN-description.js`
2. Use next sequential number (e.g., `003-`, `004-`)
3. Add migration logic and console logs
4. Update `package.json` scripts to include the new migration
5. Update `migrations/README.md` with the new migration details

## Best Practices

✅ Keep migrations simple and focused
✅ Make migrations idempotent where possible
✅ Include clear console logging
✅ Document what each migration does
✅ Test migrations locally before deploying
✅ Never modify old migrations - create new ones instead
