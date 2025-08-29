#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Setting up PostgreSQL schema...');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// Read current schema
let currentSchema = fs.readFileSync(schemaPath, 'utf8');

// Replace only the datasource block to ensure PostgreSQL is used
currentSchema = currentSchema.replace(
  /datasource db \{[^}]*\}/s,
  `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
);

// Write the updated schema
fs.writeFileSync(schemaPath, currentSchema);
console.log('✅ PostgreSQL schema applied');

process.exit(0);
