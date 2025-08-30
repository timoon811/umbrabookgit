#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing migration state for production deployment...');

// Create a script to handle the migration state fix via Prisma resolve
const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');

// Create a temporary migration to resolve the conflict
const tempMigrationDir = path.join(migrationsDir, '20250830110700_resolve_migration_conflict');

if (!fs.existsSync(tempMigrationDir)) {
  fs.mkdirSync(tempMigrationDir, { recursive: true });
}

// Create a simple migration that will be marked as applied
const migrationContent = `-- Resolve migration conflict
-- This migration resolves the failed migration state in production

-- Placeholder migration to resolve conflict
SELECT 1;
`;

fs.writeFileSync(path.join(tempMigrationDir, 'migration.sql'), migrationContent);

console.log('✅ Created conflict resolution migration');
console.log('📝 Use: npx prisma migrate resolve --applied 20250830103500_add_telegram_and_status_fields');

process.exit(0);
