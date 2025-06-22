#!/usr/bin/env node

/**
 * Script to add universal credits to a user account for testing
 * Usage: node scripts/add-universal-credits.js [email] [credits]
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addUniversalCredits(userEmail, creditCount = 15) {
  try {
    console.log(`🧪 Adding ${creditCount} universal credits to ${userEmail}...`);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, name: true }
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
        stripeSessionId: `test_universal_${Date.now()}`,
        tier: 'test_universal_credits',
        tierPrice: 0,
        addons: [],
        totalAmount: 0,
        status: 'completed',
        jobPostCredits: 0,
        featuredPostCredits: 0,
        socialGraphicCredits: 0,
        repostCredits: 0,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        metadata: {
          testPurchase: true,
          createdBy: 'universal-credits-script',
          timestamp: new Date().toISOString()
        }
      }
    });

    console.log(`✅ Created test purchase: ${purchase.id}`);

    // Create individual universal credit records
    const creditsToCreate = [];
    for (let i = 0; i < creditCount; i++) {
      creditsToCreate.push({
        userId: user.id,
        purchaseId: purchase.id,
        type: 'universal',
        expiresAt: purchase.expiresAt,
      });
    }

    await prisma.jobPostingCredit.createMany({
      data: creditsToCreate
    });

    console.log(`✅ Created ${creditCount} universal credits`);

    // Verify credits
    const totalCredits = await prisma.jobPostingCredit.count({
      where: {
        userId: user.id,
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    const universalCredits = await prisma.jobPostingCredit.count({
      where: {
        userId: user.id,
        type: 'universal',
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    console.log(`🎉 User now has ${totalCredits} total available credits`);
    console.log(`🎉 User now has ${universalCredits} universal credits`);
    console.log(`🔗 Test the dashboard: http://localhost:3000/employers/dashboard?purchase_success=true`);

  } catch (error) {
    console.error('❌ Error adding universal credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const userEmail = args[0];
const creditCount = parseInt(args[1]) || 15;

if (!userEmail) {
  console.log('Usage: node scripts/add-universal-credits.js <email> [credit_count]');
  console.log('Example: node scripts/add-universal-credits.js employer@example.com 15');
  process.exit(1);
}

addUniversalCredits(userEmail, creditCount);
