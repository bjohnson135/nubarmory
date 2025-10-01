#!/usr/bin/env node

/**
 * Database Migration Script
 *
 * This script helps migrate from SQLite to PostgreSQL for production deployment.
 * Run this after setting up your PostgreSQL database.
 *
 * Usage:
 * 1. Set DATABASE_URL environment variable to your PostgreSQL connection string
 * 2. Run: node scripts/migrate-to-postgres.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Database Migration Script');
console.log('============================\n');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.log('\nPlease set DATABASE_URL to your PostgreSQL connection string:');
  console.log('Example: DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"');
  process.exit(1);
}

// Check if it's a PostgreSQL URL
if (!process.env.DATABASE_URL.includes('postgresql://')) {
  console.error('❌ ERROR: DATABASE_URL must be a PostgreSQL connection string');
  console.log('Current value:', process.env.DATABASE_URL);
  process.exit(1);
}

console.log('✅ DATABASE_URL is configured');
console.log('📦 Database:', process.env.DATABASE_URL.split('@')[1]?.split('/')[1]?.split('?')[0] || 'Unknown');

try {
  // Step 1: Generate Prisma Client
  console.log('\n1️⃣ Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Step 2: Create/Update database schema
  console.log('\n2️⃣ Pushing database schema...');
  execSync('npx prisma db push --skip-seed', { stdio: 'inherit' });

  // Step 3: Create initial admin user (optional)
  console.log('\n3️⃣ Creating initial admin user...');

  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const prisma = new PrismaClient();

  async function createAdminUser() {
    try {
      // Check if admin exists
      const existingAdmin = await prisma.adminUser.findFirst({
        where: { email: 'admin@nubarmory.com' }
      });

      if (existingAdmin) {
        console.log('ℹ️  Admin user already exists');
        return;
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash('ChangeThisPassword123!', 10);
      await prisma.adminUser.create({
        data: {
          email: 'admin@nubarmory.com',
          password: hashedPassword,
          name: 'Admin'
        }
      });

      console.log('✅ Admin user created:');
      console.log('   Email: admin@nubarmory.com');
      console.log('   Password: ChangeThisPassword123!');
      console.log('   ⚠️  IMPORTANT: Change this password after first login!');

    } catch (error) {
      console.error('❌ Error creating admin user:', error.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  createAdminUser().then(() => {
    console.log('\n✨ Database migration complete!');
    console.log('\nNext steps:');
    console.log('1. Update your Vercel environment variables');
    console.log('2. Deploy your application');
    console.log('3. Login and change the admin password');
  });

} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}