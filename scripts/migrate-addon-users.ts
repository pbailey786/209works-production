import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AddOnMigrationPlan {
  userId: string;
  currentAddOns: string[];
  recommendedTier: 'starter' | 'professional' | 'enterprise';
  grandfatheringStrategy: 'upgrade' | 'credit' | 'refund';
  notes: string;
}

async function analyzeAddOnUsers(): Promise<AddOnMigrationPlan[]> {
  console.log('🔍 Analyzing current add-on users...');

  // Get all users with active add-ons
  const usersWithAddOns = await prisma.user.findMany({
    where: {
      UserAddOn: {
        some: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      },
    },
    include: {
      UserAddOn: {
        where: { isActive: true },
        include: { AddOn: true },
      },
    },
  });

  console.log(`📊 Found ${usersWithAddOns.length} users with active add-ons`);

  const migrationPlans: AddOnMigrationPlan[] = [];

  for (const user of usersWithAddOns) {
    const addOnSlugs = user.UserAddOn.map(ua => ua.AddOn.slug);
    const totalAddOnValue = user.UserAddOn.reduce(
      (sum, ua) => sum + Number(ua.pricePaid),
      0
    );

    // Determine recommended tier based on add-ons
    let recommendedTier: 'starter' | 'professional' | 'enterprise' = 'starter';
    let strategy: 'upgrade' | 'credit' | 'refund' = 'upgrade';

    // High-value or enterprise features -> Enterprise tier
    if (
      addOnSlugs.some(slug =>
        ['custom-hiring-campaign', 'white-label', 'api-access'].includes(slug)
      ) ||
      totalAddOnValue > 200
    ) {
      recommendedTier = 'enterprise';
    }
    // Multiple add-ons or professional features -> Professional tier
    else if (
      user.UserAddOn.length > 2 ||
      addOnSlugs.some(slug =>
        ['background-checks', 'sponsored-content'].includes(slug)
      )
    ) {
      recommendedTier = 'professional';
    }

    // Determine grandfathering strategy
    if (totalAddOnValue > 100) {
      strategy = 'credit'; // Give account credit for high-value users
    } else if (user.UserAddOn.length > 3) {
      strategy = 'upgrade'; // Free upgrade to higher tier
    }

    migrationPlans.push({
      userId: user.id,
      currentAddOns: addOnSlugs,
      recommendedTier,
      grandfatheringStrategy: strategy,
      notes: `Current add-ons: ${addOnSlugs.join(', ')}. Total value: $${totalAddOnValue}`,
    });
  }

  return migrationPlans;
}

async function generateMigrationReport(plans: AddOnMigrationPlan[]) {
  console.log('\n📋 MIGRATION REPORT');
  console.log('==================');

  const summary = {
    total: plans.length,
    starter: plans.filter(p => p.recommendedTier === 'starter').length,
    professional: plans.filter(p => p.recommendedTier === 'professional')
      .length,
    enterprise: plans.filter(p => p.recommendedTier === 'enterprise').length,
    upgrades: plans.filter(p => p.grandfatheringStrategy === 'upgrade').length,
    credits: plans.filter(p => p.grandfatheringStrategy === 'credit').length,
    refunds: plans.filter(p => p.grandfatheringStrategy === 'refund').length,
  };

  console.log(`Total users to migrate: ${summary.total}`);
  console.log(`Recommended tiers:`);
  console.log(`  - Starter: ${summary.starter}`);
  console.log(`  - Professional: ${summary.professional}`);
  console.log(`  - Enterprise: ${summary.enterprise}`);
  console.log(`Grandfathering strategies:`);
  console.log(`  - Free upgrades: ${summary.upgrades}`);
  console.log(`  - Account credits: ${summary.credits}`);
  console.log(`  - Refunds needed: ${summary.refunds}`);

  // Save detailed report
  const reportPath = 'scripts/addon-migration-report.json';
  await require('fs').promises.writeFile(
    reportPath,
    JSON.stringify(plans, null, 2)
  );
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);
}

async function main() {
  try {
    const plans = await analyzeAddOnUsers();
    await generateMigrationReport(plans);

    console.log('\n✅ Migration analysis complete!');
    console.log('Next steps:');
    console.log('1. Review the migration report');
    console.log('2. Communicate changes to affected users');
    console.log('3. Execute the migration script');
    console.log('4. Remove add-on system code');
  } catch (error) {
    console.error('❌ Migration analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { analyzeAddOnUsers, generateMigrationReport };
