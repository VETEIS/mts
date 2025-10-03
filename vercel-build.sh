#!/bin/bash

# Vercel Build Script for MTS
echo "🚀 Starting MTS build process..."

# Generate Prisma client
echo "📊 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️  Setting up database schema..."
npx prisma db push

# Seed database with initial data
echo "🌱 Seeding database..."
npm run db:seed

# Build Next.js app
echo "🔨 Building Next.js application..."
npm run build

echo "✅ MTS build complete!"
