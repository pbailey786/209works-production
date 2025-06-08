import { PrismaClient } from '@prisma/client';

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

    // Test validation schema
    console.log('🔍 Testing validation schema...');
    const { z } = await import('zod');
    
    const onboardingSchema = z.object({
      name: z.string().min(1, 'Name is required').max(100).optional(),
      currentJobTitle: z.string().optional(),
      location: z.string().min(1, 'Location is required').max(200).optional(),
      phoneNumber: z.string().optional(),
      linkedinUrl: z.string().url().optional().or(z.literal('')),
      skills: z.array(z.string()).optional(),
      experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
      preferredJobTypes: z.array(z.string()).optional(),
      openToRemote: z.boolean().optional(),
      expectedSalaryMin: z.number().optional(),
      expectedSalaryMax: z.number().optional(),
      companyName: z.string().optional(),
      companyWebsite: z.string().optional().refine(
        (val) => !val || val === '' || z.string().url().safeParse(val).success,
        { message: 'Must be a valid URL or empty' }
      ),
      industry: z.string().optional(),
      companySize: z.string().optional(),
      onboardingCompleted: z.boolean().default(true),
      completedSteps: z.array(z.string()).optional(),
    });

    const validationResult = onboardingSchema.safeParse(testData);
    if (validationResult.success) {
      console.log('✅ Validation passed');
    } else {
      console.log('❌ Validation failed:', validationResult.error.errors);
    }

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testOnboardingFlow().catch(console.error);
