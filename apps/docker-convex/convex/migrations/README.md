# Convex Migrations

This directory contains individual migration files for the Convex database.

## File Naming Convention

Migrations should be named using the pattern: `NN_YYYY_MM_DD_description.ts`

- `NN`: Two-digit sequence number (01, 02, 03, ...)
- `YYYY_MM_DD`: Date when the migration is created (use underscores instead of hyphens)
- `description`: Brief description of what the migration does

## Current Migration

- `01_2024_01_01_initial_setup.ts`: Basic initial setup migration for clean database

## Running Migrations

### From Convex Dashboard
1. Go to your Convex dashboard
2. Navigate to Functions
3. Find and run the `migrations:run` function

### From CLI
```bash
# Run migrations in development
npx convex run convex/migrations:run

# Run migrations in production
npx convex run convex/migrations:run --prod
```

## Resetting Database

To perform a full database reset:
1. Run `npx convex dev --reset` in development
2. Or use the Convex dashboard to reset your project
3. Then run migrations: `npx convex run convex/migrations:run`