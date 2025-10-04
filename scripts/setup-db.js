#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// Read current schema
let schema = fs.readFileSync(schemaPath, 'utf8');

// Determine environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const isDevelopment = !isProduction;

console.log(`🔧 Setting up database for ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} environment`);

if (isDevelopment) {
  // Development: Use SQLite
  console.log('📱 Using SQLite for development');
  
  schema = schema.replace(
    /datasource db \{[^}]*\}/s,
    `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`
  );
} else {
  // Production: Use PostgreSQL
  console.log('🚀 Using PostgreSQL for production');
  
  schema = schema.replace(
    /datasource db \{[^}]*\}/s,
    `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`
  );
}

// Write updated schema
fs.writeFileSync(schemaPath, schema);
console.log('✅ Database configuration updated');
