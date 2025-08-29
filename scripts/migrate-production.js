#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Setting up PostgreSQL for production...');

// Check if we're in production (also check for Render environment)
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER || process.env.DATABASE_URL?.includes('postgres');

if (isProduction) {
  // Backup original schema
  const originalSchema = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  const backupSchema = path.join(__dirname, '..', 'prisma', 'schema.backup.prisma');
  const productionSchema = path.join(__dirname, '..', 'prisma', 'schema.production.prisma');

  // Copy current schema to backup
  if (fs.existsSync(originalSchema)) {
    fs.copyFileSync(originalSchema, backupSchema);
  }

  // Copy production schema to main
  if (fs.existsSync(productionSchema)) {
    fs.copyFileSync(productionSchema, originalSchema);
    console.log('✅ Switched to PostgreSQL schema');
  }
}

// Generate Prisma client
const generate = spawn('npx', ['prisma', 'generate'], {
  stdio: 'inherit',
  shell: true
});

generate.on('close', (generateCode) => {
  if (generateCode === 0) {
    console.log('✅ Prisma client generated successfully');
    
    if (isProduction) {
      // Run migration deploy in production
      const migrate = spawn('npx', ['prisma', 'migrate', 'deploy'], {
        stdio: 'inherit',
        shell: true
      });
      
      migrate.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Migration deployed successfully');
        } else {
          console.error('❌ Migration deployment failed');
          process.exit(1);
        }
      });
    }
  } else {
    console.error('❌ Failed to generate Prisma client');
    process.exit(1);
  }
});
