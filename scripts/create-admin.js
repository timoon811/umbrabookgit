#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔄 Creating admin user...');
    
    const email = 'admin@umbra-platform.dev';
    const password = 'admin123!';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Check if admin already exists
    try {
      const existingAdmin = await prisma.users.findUnique({
        where: { email }
      });
      
      if (existingAdmin) {
        console.log('✅ Admin user already exists');
        return;
      }
    } catch (findError) {
      console.log('⚠️  Database schema may be updating, attempting to create admin...');
    }
    
    // Prepare user data - check if telegram field exists in schema
    let userData = {
      email,
      name: 'Administrator',
      password: hashedPassword,
      role: 'ADMIN'
    };
    
    // Try to add telegram field if it exists in the schema
    try {
      // Check if we can include telegram field
      const schemaInfo = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'telegram'`;
      if (schemaInfo.length > 0) {
        userData.telegram = '@admin';
        userData.status = 'APPROVED';
      }
    } catch (schemaError) {
      console.log('ℹ️  Using basic user schema (telegram field not available)');
    }
    
    // Create admin user
    const admin = await prisma.users.create({
      data: userData
    });
    
    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('⚠️  Please change the password after first login');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    // Don't exit with error - allow the app to start even if admin creation fails
    console.log('⚠️  App will continue starting, you can create admin manually later');
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
