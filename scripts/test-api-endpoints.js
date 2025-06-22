const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApiEndpoints() {
  try {
    console.log('🧪 Testing API endpoints directly...\n');

    // Test user
    const testUserId = 'e38872f7-ac61-4f78-a101-0fb0e7228f55'; // digitalstele@gmail.com

    console.log('1. Testing credit calculation manually...');

    // Get all available credits (both new universal and legacy types)
    const allCredits = await prisma.jobPostingCredit.findMany({
      where: {
        userId: testUserId,
        isUsed: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    // Count universal credits
    const universalCredits = allCredits.filter(
      c => c.type === 'universal'
    ).length;

    // Count legacy credits (for backward compatibility)
    const jobPostCredits = allCredits.filter(c => c.type === 'job_post').length;
    const featuredPostCredits = allCredits.filter(
      c => c.type === 'featured_post'
    ).length;
    const socialGraphicCredits = allCredits.filter(
      c => c.type === 'social_graphic'
    ).length;

    // Total credits = universal + all legacy credits (since they can all be used for any purpose now)
    const totalCredits =
      universalCredits +
      jobPostCredits +
      featuredPostCredits +
      socialGraphicCredits;

    const credits = {
      universal: universalCredits,
      total: totalCredits,
      // Legacy fields for backward compatibility
      jobPost: jobPostCredits,
      featuredPost: featuredPostCredits,
      socialGraphic: socialGraphicCredits,
    };

    console.log('Credits result:', credits);

    console.log('\n2. Testing subscription status...');

    // Check subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: testUserId,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Subscription result:', subscription);

    console.log('\n3. Testing user data...');

    const user = await prisma.user.findUnique({
      where: { id: testUserId },
      select: {
        id: true,
        role: true,
        currentTier: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        email: true,
        name: true,
      },
    });

    console.log('User result:', user);

    console.log('\n4. Testing raw credit query...');

    const rawCredits = await prisma.jobPostingCredit.findMany({
      where: {
        userId: testUserId,
        isUsed: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        id: true,
        type: true,
        isUsed: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    console.log('Raw credits:', rawCredits);
    console.log('Total raw credits:', rawCredits.length);
    console.log(
      'Universal credits:',
      rawCredits.filter(c => c.type === 'universal').length
    );
    console.log(
      'Job post credits:',
      rawCredits.filter(c => c.type === 'job_post').length
    );
  } catch (error) {
    console.error('❌ Error testing API endpoints:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiEndpoints();
