const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creating test user...');

    // Hash the password
    const password = 'Test12345!';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create or update test user
    const user = await prisma.user.upsert({
      where: { email: 'test@209.works' },
      update: {
        passwordHash: hashedPassword,
        isEmailVerified: true,
      },
      create: {
        email: 'test@209.works',
        name: 'Test User',
        passwordHash: hashedPassword,
        role: 'job_seeker',
        isEmailVerified: true,
        onboardingCompleted: true,
      },
    });

    console.log('✅ Test user created/updated:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    console.log('🔑 Login credentials:');
    console.log('  Email: test@209.works');
    console.log('  Password: Test12345!');
  } catch (error) {
    console.error('💥 Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
