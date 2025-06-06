import { PricingTier, BillingInterval } from '@prisma/client';
import { prisma } from '@/lib/database/prisma';
import { PRICING_CONFIG } from './subscription';

export interface MigrationPlan {
  userId: string;
  currentTier: string;
  newTier: PricingTier;
  currentPrice: number;
  newPrice: number;
  priceDifference: number;
  migrationReason: string;
  grandfatheredUntil?: Date;
  notes: string;
}

export interface MigrationStats {
  totalUsers: number;
  migrationPlans: MigrationPlan[];
  tierDistribution: Record<PricingTier, number>;
  revenueImpact: {
    currentMonthlyRevenue: number;
    projectedMonthlyRevenue: number;
    difference: number;
    percentageChange: number;
  };
}

export class CustomerMigrationService {
  /**
   * Legacy tier mapping to new simplified tiers
   */
  private static readonly TIER_MIGRATION_MAP: Record<string, PricingTier> = {
    // Map old tiers to current valid tiers
    starter: 'starter',
    professional: 'professional',
    enterprise: 'enterprise',
    premium: 'premium',

    // Legacy tiers that may exist in old data
    basic: 'starter',
    essential: 'starter',
    professional_jobseeker: 'premium',
  };

  private static readonly PRICING_TIER_MAPPING: Record<PricingTier, number> = {
    basic: 0,
    essential: 1,
    starter: 2,
    professional: 3,
    premium: 4,
    enterprise: 5,
  };

  /**
   * Analyze all users and create migration plans
   */
  static async analyzeCustomerMigration(): Promise<MigrationStats> {
    // Get all users with active subscriptions (legacy tier check removed due to enum constraints)
    const users = await prisma.user.findMany({
      where: {
        subscriptions: {
          status: 'active',
        },
      },
      include: {
        subscriptions: true,
      },
    });

    const migrationPlans: MigrationPlan[] = [];
    const tierDistribution: Record<PricingTier, number> = {
      basic: 0,
      essential: 0,
      starter: 0,
      professional: 0,
      enterprise: 0,
      premium: 0,
    };

    let currentMonthlyRevenue = 0;
    let projectedMonthlyRevenue = 0;

    for (const user of users) {
      const plan = await this.createMigrationPlan(user);
      migrationPlans.push(plan);

      tierDistribution[plan.newTier]++;
      currentMonthlyRevenue += plan.currentPrice;
      projectedMonthlyRevenue += plan.newPrice;
    }

    const revenueImpact = {
      currentMonthlyRevenue,
      projectedMonthlyRevenue,
      difference: projectedMonthlyRevenue - currentMonthlyRevenue,
      percentageChange:
        currentMonthlyRevenue > 0
          ? ((projectedMonthlyRevenue - currentMonthlyRevenue) /
              currentMonthlyRevenue) *
            100
          : 0,
    };

    return {
      totalUsers: users.length,
      migrationPlans,
      tierDistribution,
      revenueImpact,
    };
  }

  /**
   * Create migration plan for a specific user
   */
  private static async createMigrationPlan(user: any): Promise<MigrationPlan> {
    const currentTier = user.currentTier;
    const activeSubscription = user.subscriptions;

    // Determine new tier based on mapping
    const newTier = this.TIER_MIGRATION_MAP[currentTier] || 'starter';

    // Calculate current and new pricing
    const currentPrice = activeSubscription?.price || 0;
    const newPrice = PRICING_CONFIG[newTier].price;
    const priceDifference = newPrice - currentPrice;

    // Determine migration strategy
    let migrationReason = '';
    let grandfatheredUntil: Date | undefined;
    let notes = '';

    if (currentTier === 'basic' || currentTier === 'essential') {
      migrationReason = 'Consolidation of basic tiers into Starter';
      notes = 'User gets more features at similar or lower price point';
    } else if (currentTier === 'professional_jobseeker') {
      migrationReason = 'Simplification of job seeker tiers';
      notes = 'Consolidated into single Premium tier with all features';
    } else if (priceDifference > 0) {
      migrationReason = 'Price increase due to tier consolidation';
      // Grandfather existing customers for 6 months
      grandfatheredUntil = new Date();
      grandfatheredUntil.setMonth(grandfatheredUntil.getMonth() + 6);
      notes = `Grandfathered at current price until ${grandfatheredUntil.toLocaleDateString()}`;
    } else {
      migrationReason = 'Direct tier mapping';
      notes = 'No price change, same or better features';
    }

    return {
      userId: user.id,
      currentTier,
      newTier,
      currentPrice,
      newPrice: grandfatheredUntil ? currentPrice : newPrice, // Use current price if grandfathered
      priceDifference,
      migrationReason,
      grandfatheredUntil,
      notes,
    };
  }

  /**
   * Execute migration for a specific user
   */
  static async migrateUser(userId: string, plan: MigrationPlan): Promise<void> {
    await prisma.$transaction(async tx => {
      // Update user's current tier
      await tx.user.update({
        where: { id: userId },
        data: { currentTier: plan.newTier },
      });

      // Update or create new subscription
      const activeSubscription = await tx.subscription.findFirst({
        where: { userId, status: 'active' },
      });

      if (activeSubscription) {
        await tx.subscription.update({
          where: { id: activeSubscription.id },
          data: {
            tier: plan.newTier,
            price: plan.newPrice,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new subscription for users who didn't have one
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        if (!user) {
          throw new Error('User not found');
        }

        await tx.subscription.create({
          data: {
            userId,
            email: user.email,
            tier: plan.newTier,
            price: plan.newPrice,
            billingCycle: 'monthly',
            status: 'active',
            startDate: new Date(),
          },
        });
      }

      // Log migration for audit purposes
      await tx.user.update({
        where: { id: userId },
        data: {
          updatedAt: new Date(),
        },
      });
    });
  }

  /**
   * Execute migration for all users
   */
  static async executeFullMigration(): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const stats = await this.analyzeCustomerMigration();
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const plan of stats.migrationPlans) {
      try {
        await this.migrateUser(plan.userId, plan);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to migrate user ${plan.userId}: ${error}`);
        console.error(`Migration failed for user ${plan.userId}:`, error);
      }
    }

    return results;
  }

  /**
   * Generate migration report for stakeholders
   */
  static async generateMigrationReport(): Promise<string> {
    const stats = await this.analyzeCustomerMigration();

    const report = `
# Customer Migration Report - Pricing Schema Simplification

## Overview
- **Total Users to Migrate**: ${stats.totalUsers}
- **Current Monthly Revenue**: $${stats.revenueImpact.currentMonthlyRevenue.toFixed(2)}
- **Projected Monthly Revenue**: $${stats.revenueImpact.projectedMonthlyRevenue.toFixed(2)}
- **Revenue Impact**: ${stats.revenueImpact.difference >= 0 ? '+' : ''}$${stats.revenueImpact.difference.toFixed(2)} (${stats.revenueImpact.percentageChange.toFixed(1)}%)

## New Tier Distribution
- **Starter**: ${stats.tierDistribution.starter} users
- **Professional**: ${stats.tierDistribution.professional} users  
- **Enterprise**: ${stats.tierDistribution.enterprise} users
- **Premium (Job Seekers)**: ${stats.tierDistribution.premium} users

## Migration Strategies
${stats.migrationPlans
  .map(
    plan => `
### User ${plan.userId}
- **Current**: ${plan.currentTier} ($${plan.currentPrice}/month)
- **New**: ${plan.newTier} ($${plan.newPrice}/month)
- **Change**: ${plan.priceDifference >= 0 ? '+' : ''}$${plan.priceDifference.toFixed(2)}
- **Reason**: ${plan.migrationReason}
- **Notes**: ${plan.notes}
${plan.grandfatheredUntil ? `- **Grandfathered Until**: ${plan.grandfatheredUntil.toLocaleDateString()}` : ''}
`
  )
  .join('\n')}

## Recommendations
1. **Communication**: Send personalized emails to affected customers explaining the changes
2. **Grandfathering**: Honor current pricing for 6 months for users facing price increases
3. **Support**: Provide dedicated support during the transition period
4. **Timeline**: Execute migration in phases over 2-4 weeks
5. **Monitoring**: Track customer satisfaction and churn during migration

## Risk Mitigation
- Grandfather pricing for users facing increases
- Provide clear communication about new features and benefits
- Offer migration support and assistance
- Monitor churn rates closely during transition
`;

    return report;
  }

  /**
   * Send migration notification to a user
   */
  static async sendMigrationNotification(
    userId: string,
    plan: MigrationPlan
  ): Promise<void> {
    // In a real implementation, this would send an email
    // For now, we'll log the notification
    console.log(`Migration notification for user ${userId}:`, {
      currentTier: plan.currentTier,
      newTier: plan.newTier,
      priceChange: plan.priceDifference,
      grandfathered: !!plan.grandfatheredUntil,
      notes: plan.notes,
    });

    // TODO: Integrate with email service to send actual notifications
    // await emailService.sendMigrationNotification(user, plan);
  }

  /**
   * Get migration status for admin dashboard
   */
  static async getMigrationStatus(): Promise<{
    totalUsers: number;
    migrated: number;
    pending: number;
    failed: number;
    completionPercentage: number;
  }> {
    const totalUsers = await prisma.user.count({
      where: {
        subscriptions: {
          status: 'active',
        },
      },
    });

    const migratedUsers = await prisma.user.count({
      where: {
        currentTier: {
          in: ['starter', 'professional', 'enterprise', 'premium'],
        },
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Updated in last 7 days
      },
    });

    const pending = totalUsers - migratedUsers;
    const failed = 0; // Would track from migration logs in real implementation

    return {
      totalUsers,
      migrated: migratedUsers,
      pending,
      failed,
      completionPercentage:
        totalUsers > 0 ? (migratedUsers / totalUsers) * 100 : 0,
    };
  }
}

export default CustomerMigrationService;
