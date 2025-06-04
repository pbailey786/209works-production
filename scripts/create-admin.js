// Node.js script to create admin user
// Run with: node scripts/create-admin.js

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');

    // Admin user details - CHANGE THESE!
    const adminData = {
      email: 'admin@209.works',
      password: 'AdminPassword123!', // CHANGE THIS!
      name: 'Admin User',
    };

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email }
    });

    if (existingAdmin) {
      console.log('👤 Admin user already exists, updating role...');
      
      // Update existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email: adminData.email },
        data: { role: 'admin' }
      });

      console.log('✅ User updated to admin:', updatedUser.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create new admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminData.email,
        name: adminData.name,
        passwordHash: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        onboardingCompleted: true,
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('👤 Role:', adminUser.role);
    console.log('🆔 ID:', adminUser.id);
    
    console.log('\n🔐 Login credentials:');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();
