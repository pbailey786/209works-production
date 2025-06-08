const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOnboardingFlow() {
  try {
    console.log('🧪 Testing onboarding flow...');

    // Test database connection
    console.log('📊 Testing database connection...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected. Found ${userCount} users.`);

    // Find a test employer user
    const testUser = await prisma.user.findFirst({
      where: { role: 'employer' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        onboardingCompleted: true,
        companyName: true,
        companyWebsite: true,
        industry: true,
        companySize: true,
        location: true,
      },
    });

    if (!testUser) {
      console.log('❌ No employer user found for testing');
      return;
    }

    console.log('👤 Found test user:', {
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
      onboardingCompleted: testUser.onboardingCompleted,
    });

    // Test data that would be sent from the frontend
    const testData = {
      name: testUser.name || 'Test Employer',
      companyName: 'Test Company Inc.',
      companyWebsite: 'https://testcompany.com',
      location: 'Modesto, CA',
      industry: 'technology',
      companySize: '1-10',
      onboardingCompleted: true,
      completedSteps: ['company', 'location', 'details'],
    };

    console.log('📦 Test data:', JSON.stringify(testData, null, 2));

    // Test the update operation
    console.log('🔄 Testing user update...');
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        name: testData.name,
        companyName: testData.companyName,
        companyWebsite: testData.companyWebsite,
        location: testData.location,
        industry: testData.industry,
        companySize: testData.companySize,
        onboardingCompleted: testData.onboardingCompleted,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboardingCompleted: true,
        location: true,
        companyName: true,
        industry: true,
        companySize: true,
        companyWebsite: true,
      },
    });

    console.log('✅ User updated successfully:', JSON.stringify(updatedUser, null, 2));
    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testOnboardingFlow().catch(console.error);
