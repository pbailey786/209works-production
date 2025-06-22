#!/usr/bin/env node

/**
 * Test script to manually add credits to a user account for testing
 * Usage: node scripts/test-credits.js [email] [credits]
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestCredits(userEmail, creditCount = 5) {
  try {
    console.log(`🧪 Adding ${creditCount} test credits to ${userEmail}...`);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, name: true },
    });

    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      return;
    }

    if (user.role !== 'employer') {
      console.error(`❌ User is not an employer: ${user.role}`);
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.id})`);

    // Create a test purchase record
    const purchase = await prisma.jobPostingPurchase.create({
      data: {
        userId: user.id,
        stripeSessionId: `test_session_${Date.now()}`,
        tier: 'test_credits',
        tierPrice: 0,
        addons: [],
        totalAmount: 0,
        status: 'completed',
        jobPostCredits: creditCount,
        featuredPostCredits: 0,
        socialGraphicCredits: 0,
        repostCredits: 0,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        metadata: {
          testPurchase: true,
          createdBy: 'test-script',
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log(`✅ Created test purchase: ${purchase.id}`);

    // Create individual credit records
    const creditsToCreate = [];
    for (let i = 0; i < creditCount; i++) {
      creditsToCreate.push({
        userId: user.id,
        purchaseId: purchase.id,
        type: 'job_post',
        expiresAt: purchase.expiresAt,
      });
    }

    await prisma.jobPostingCredit.createMany({
      data: creditsToCreate,
    });

    console.log(`✅ Created ${creditCount} job posting credits`);

    // Verify credits
    const totalCredits = await prisma.jobPostingCredit.count({
      where: {
        userId: user.id,
        isUsed: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    console.log(`🎉 User now has ${totalCredits} total available credits`);
    console.log(
      `🔗 Test the dashboard: http://localhost:3000/employers/dashboard?purchase_success=true`
    );
  } catch (error) {
    console.error('❌ Error adding test credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const userEmail = args[0];
const creditCount = parseInt(args[1]) || 5;

if (!userEmail) {
  console.log('Usage: node scripts/test-credits.js <email> [credit_count]');
  console.log('Example: node scripts/test-credits.js employer@example.com 10');
  process.exit(1);
}

addTestCredits(userEmail, creditCount);
