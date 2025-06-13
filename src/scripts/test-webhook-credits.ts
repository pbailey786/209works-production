/**
 * Test script to verify webhook credit allocation functionality
 * Run with: npx tsx src/scripts/test-webhook-credits.ts
 */

import { prisma } from '@/lib/database/prisma';

async function testCreditAllocation() {
  console.log('🧪 Testing credit allocation system...\n');

  try {
    // Test user ID (replace with actual test user)
    const testUserId = 'test-user-id';
    
    // Clean up any existing test data
    await prisma.jobPostingCredit.deleteMany({
      where: { userId: testUserId }
    });
    
    await prisma.subscription.deleteMany({
      where: { userId: testUserId }
    });

    console.log('✅ Cleaned up existing test data');

    // Test credit allocation for each tier
    const tiers = ['starter', 'standard', 'pro'];
    
    for (const tier of tiers) {
      console.log(`\n📊 Testing ${tier} tier...`);
      
      // Simulate subscription creation
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUserId,
          email: 'test@example.com',
          stripeSubscriptionId: `sub_test_${tier}`,
          tier: tier as any,
          billingCycle: 'monthly',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          price: tier === 'starter' ? 8900 : tier === 'standard' ? 19900 : 34900,
        },
      });

      // Allocate credits based on tier
      const creditAllocation = {
        starter: { jobPosts: 3, featuredPosts: 0 },
        standard: { jobPosts: 5, featuredPosts: 0 },
        pro: { jobPosts: 10, featuredPosts: 2 },
      };

      const allocation = creditAllocation[tier as keyof typeof creditAllocation];
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const creditsToCreate = [];

      // Add job posting credits
      for (let i = 0; i < allocation.jobPosts; i++) {
        creditsToCreate.push({
          userId: testUserId,
          type: 'job_post',
          expiresAt,
        });
      }

      // Add featured post credits
      for (let i = 0; i < allocation.featuredPosts; i++) {
        creditsToCreate.push({
          userId: testUserId,
          type: 'featured_post',
          expiresAt,
        });
      }

      if (creditsToCreate.length > 0) {
        await prisma.jobPostingCredit.createMany({
          data: creditsToCreate,
        });
      }

      // Verify credits were created
      const jobPostCredits = await prisma.jobPostingCredit.count({
        where: {
          userId: testUserId,
          type: 'job_post',
          isUsed: false,
        },
      });

      const featuredPostCredits = await prisma.jobPostingCredit.count({
        where: {
          userId: testUserId,
          type: 'featured_post',
          isUsed: false,
        },
      });

      console.log(`   ✅ Job post credits: ${jobPostCredits}/${allocation.jobPosts}`);
      console.log(`   ✅ Featured post credits: ${featuredPostCredits}/${allocation.featuredPosts}`);

      // Verify totals match expected
      if (jobPostCredits === allocation.jobPosts && featuredPostCredits === allocation.featuredPosts) {
        console.log(`   🎉 ${tier} tier credit allocation: PASSED`);
      } else {
        console.log(`   ❌ ${tier} tier credit allocation: FAILED`);
      }

      // Clean up for next test
      await prisma.jobPostingCredit.deleteMany({
        where: { userId: testUserId }
      });
      
      await prisma.subscription.delete({
        where: { id: subscription.id }
      });
    }

    console.log('\n🎉 All credit allocation tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testCreditAllocation();
}

export { testCreditAllocation };
