#!/usr/bin/env node

/**
 * Script to consolidate all existing credits into universal type
 * Usage: node scripts/consolidate-credits.js [email]
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function consolidateCredits(userEmail) {
  try {
    console.log(`🔄 Consolidating credits for ${userEmail || 'all users'}...`);

    let whereClause = {};
    if (userEmail) {
      // Find the specific user
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, email: true, name: true, role: true }
      });

      if (!user) {
        console.error(`❌ User not found: ${userEmail}`);
        return;
      }

      if (user.role !== 'employer') {
        console.error(`❌ User is not an employer: ${user.role}`);
        return;
      }

      console.log(`✅ Found user: ${user.name || user.email} (${user.id})`);
      whereClause = { userId: user.id };
    }

    // Get all existing credits that are not already universal
    const existingCredits = await prisma.jobPostingCredit.findMany({
      where: {
        ...whereClause,
        type: {
          not: 'universal'
        }
      },
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    });

    console.log(`📊 Found ${existingCredits.length} non-universal credits to convert`);

    if (existingCredits.length === 0) {
      console.log(`✅ No credits need conversion - all are already universal!`);
      return;
    }

    // Group by user and type for reporting
    const creditsByUser = {};
    existingCredits.forEach(credit => {
      const userKey = credit.user.email;
      if (!creditsByUser[userKey]) {
        creditsByUser[userKey] = {
          user: credit.user,
          types: {}
        };
      }
      if (!creditsByUser[userKey].types[credit.type]) {
        creditsByUser[userKey].types[credit.type] = 0;
      }
      creditsByUser[userKey].types[credit.type]++;
    });

    // Show what will be converted
    console.log('\n📋 Credits to be converted:');
    Object.entries(creditsByUser).forEach(([email, data]) => {
      console.log(`  ${email}:`);
      Object.entries(data.types).forEach(([type, count]) => {
        console.log(`    - ${count} ${type} credits → universal`);
      });
    });

    // Ask for confirmation (in a real script, you might want to add readline)
    console.log('\n⚠️  This will convert ALL non-universal credits to universal type.');
    console.log('🔄 Proceeding with conversion...\n');

    // Convert all non-universal credits to universal
    const updateResult = await prisma.jobPostingCredit.updateMany({
      where: {
        ...whereClause,
        type: {
          not: 'universal'
        }
      },
      data: {
        type: 'universal'
      }
    });

    console.log(`✅ Successfully converted ${updateResult.count} credits to universal type`);

    // Verify the conversion
    const verificationCredits = await prisma.jobPostingCredit.findMany({
      where: whereClause,
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    });

    // Group verification results by user
    const verificationByUser = {};
    verificationCredits.forEach(credit => {
      const userKey = credit.user.email;
      if (!verificationByUser[userKey]) {
        verificationByUser[userKey] = {
          user: credit.user,
          total: 0,
          used: 0,
          available: 0,
          types: {}
        };
      }
      verificationByUser[userKey].total++;
      if (credit.isUsed) {
        verificationByUser[userKey].used++;
      } else {
        verificationByUser[userKey].available++;
      }
      if (!verificationByUser[userKey].types[credit.type]) {
        verificationByUser[userKey].types[credit.type] = 0;
      }
      verificationByUser[userKey].types[credit.type]++;
    });

    console.log('\n🎉 Verification Results:');
    Object.entries(verificationByUser).forEach(([email, data]) => {
      console.log(`  ${email}:`);
      console.log(`    - Total credits: ${data.total}`);
      console.log(`    - Available: ${data.available}`);
      console.log(`    - Used: ${data.used}`);
      console.log(`    - Types: ${Object.entries(data.types).map(([type, count]) => `${count} ${type}`).join(', ')}`);
    });

    console.log('\n✅ Credit consolidation completed successfully!');
    console.log('🔗 Test the modal: http://localhost:3000/employers/create-job-post');

  } catch (error) {
    console.error('❌ Error consolidating credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const userEmail = args[0];

if (args.length > 1) {
  console.log('Usage: node scripts/consolidate-credits.js [email]');
  console.log('  [email] - Optional: consolidate credits for specific user only');
  console.log('  If no email provided, consolidates credits for ALL users');
  process.exit(1);
}

consolidateCredits(userEmail);
