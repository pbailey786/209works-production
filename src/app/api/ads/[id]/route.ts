import { NextRequest } from '@/components/ui/card';
import { withAPIMiddleware } from '@/components/ui/card';
import { updateAdSchema } from '@/components/ui/card';
import { routeParamsSchemas } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

  createSuccessResponse,
  NotFoundError,
  AuthorizationError,
} from '@/components/ui/card';
import {
  import {
  generateCacheKey,
  CACHE_PREFIXES,
  DEFAULT_TTL,
  getCacheOrExecute,
  invalidateCacheByTags
} from '@/lib/cache/redis';

// GET /api/ads/:id - Get specific advertisement details
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { user, params, performance } = context;
    const adId = params.id;

    // Build where condition based on user role
    const whereCondition: any = { id: adId };

    if (user!.role === 'employer') {
      // Employers can only access their own ads
      whereCondition.advertiserId = user!.id;
    }
    // Admins can access any ad (no additional filter)

    // Generate cache key
    const cacheKey = generateCacheKey(
      CACHE_PREFIXES.ads,
      adId,
      'details',
      user!.role === 'admin' ? 'admin' : user!.id
    );

    const result = await getCacheOrExecute(
      cacheKey,
      async () => {
        // Get ad with detailed information
        performance.trackDatabaseQuery();
        const ad = await prisma.advertisement.findFirst({
          where: whereCondition,
          select: {
            id: true,
            name: true,
            type: true,
            content: true,
            bidding: true,
            schedule: true,
            status: true,
            priority: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
            // Use direct fields instead of _count
            impressions: true,
            clicks: true,
            conversions: true,
          },
        });

        if (!ad) {
          throw new NotFoundError('Advertisement not found');
        }

        // Get recent performance data (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        performance.trackDatabaseQuery();
        const [recentImpressions, recentClicks, recentConversions] =
          await Promise.all([
            prisma.adImpression.count({
              where: {
                adId,
                timestamp: { gte: thirtyDaysAgo },
              },
            }),
            prisma.adClick.count({
              where: {
                adId,
                timestamp: { gte: thirtyDaysAgo },
              },
            }),
            prisma.adConversion.count({
              where: {
                adId,
                createdAt: { gte: thirtyDaysAgo },
              },
            }),
          ]);

        // Calculate performance metrics
        const totalImpressions = ad.impressions;
        const totalClicks = ad.clicks;
        const totalConversions = ad.conversions;

        const ctr =
          totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const conversionRate =
          totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

        // Calculate estimated spend
        let estimatedSpend = 0;
        const bidding = ad.bidding as any;
        const schedule = ad.schedule as any;

        if (bidding?.type === 'cpc') {
          estimatedSpend = totalClicks * (bidding.bidAmount || 0);
        } else if (bidding?.type === 'cpm') {
          estimatedSpend = (totalImpressions / 1000) * (bidding.bidAmount || 0);
        } else if (bidding?.type === 'flat_rate') {
          // Calculate days since start
          const startDate = new Date(schedule?.startDate || ad.createdAt);
          const now = new Date();
          const daysRunning = Math.max(
            1,
            Math.ceil(
              (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          );
          estimatedSpend = (bidding.bidAmount || 0) * daysRunning;
        }

        // Get budget utilization
        const budgetUtilization = calculateBudgetUtilization(
          bidding,
          estimatedSpend
        );

        // Get targeting effectiveness (targeting field not available in current schema)
        const targetingEffectiveness = calculateTargetingEffectiveness(
          {},
          {
            impressions: totalImpressions,
            clicks: totalClicks,
            conversions: totalConversions,
          }
        );

        return {
          ...ad,
          performance: {
            allTime: {
              impressions: totalImpressions,
              clicks: totalClicks,
              conversions: totalConversions,
              ctr: Math.round(ctr * 100) / 100,
              conversionRate: Math.round(conversionRate * 100) / 100,
              estimatedSpend: Math.round(estimatedSpend * 100) / 100,
              costPerClick: totalClicks > 0 ? estimatedSpend / totalClicks : 0,
              costPerConversion:
                totalConversions > 0 ? estimatedSpend / totalConversions : 0,
            },
            recent: {
              impressions: recentImpressions,
              clicks: recentClicks,
              conversions: recentConversions,
              period: '30 days',
            },
          },
          budgetUtilization,
          targetingEffectiveness,
          isCurrentlyActive: isAdCurrentlyActive(ad.status, schedule),
          recommendations: generateOptimizationRecommendations(ad, {
            totalImpressions,
            totalClicks,
            totalConversions,
            ctr,
            conversionRate,
          }),
        };
      },
      {
        ttl: DEFAULT_TTL.short,
        tags: [
          'ads',
          `ad:${adId}`,
          user!.role === 'admin' ? 'admin' : `advertiser:${user!.id}`,
        ],
      }
    );

    return createSuccessResponse(result);
  },
  {
    requiredRoles: ['admin', 'employer'],
    paramsSchema: routeParamsSchemas.uuid,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

// PATCH /api/ads/:id - Update advertisement status (activate/pause)
export const PATCH = withAPIMiddleware(
  async (req, context) => {
    const { user, params, body, performance } = context;
    const adId = params.id;
    const { action } = body;

    if (!action || !['activate', 'pause'].includes(action)) {
      throw new Error('Invalid action. Must be "activate" or "pause"');
    }

    // Verify ad exists and user has permission
    performance.trackDatabaseQuery();
    const existingAd = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        ...(user!.role === 'employer' ? { advertiserId: user!.id } : {}),
      },
    });

    if (!existingAd) {
      throw new NotFoundError('Advertisement not found');
    }

    // Determine new status based on action
    const newStatus = action === 'activate' ? 'active' : 'paused';

    // Update the advertisement status
    performance.trackDatabaseQuery();
    const updatedAd = await prisma.advertisement.update({
      where: { id: adId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    // Invalidate cache
    await invalidateCacheByTags(['ads', `ad:${adId}`]);

    return createSuccessResponse({
      message: `Advertisement ${action}d successfully`,
      ad: updatedAd,
    });
  },
  {
    requiredRoles: ['admin', 'employer'],
    paramsSchema: routeParamsSchemas.uuid,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

// PUT /api/ads/:id - Update advertisement
export const PUT = withAPIMiddleware(
  async (req, context) => {
    const { user, params, body, performance } = context;
    const adId = params.id;

    // Verify ad exists and user has permission
    performance.trackDatabaseQuery();
    const existingAd = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        ...(user!.role === 'employer' ? { advertiserId: user!.id } : {}),
      },
    });

    if (!existingAd) {
      throw new NotFoundError('Advertisement not found');
    }

    // Validate status transitions
    if (
      body?.status &&
      !isValidStatusTransition(existingAd.status, body.status)
    ) {
      throw new AuthorizationError(
        `Cannot change status from ${existingAd.status} to ${body.status}`
      );
    }

    // Validate schedule changes
    if (body?.schedule) {
      const startDate = new Date(body.schedule.startDate);
      const endDate = body.schedule.endDate
        ? new Date(body.schedule.endDate)
        : null;

      if (endDate && endDate <= startDate) {
        throw new AuthorizationError('End date must be after start date');
      }

      // If ad is already running, don't allow changing start date to the past
      const existingSchedule = existingAd.schedule as any;
      if (
        existingAd.status === 'active' &&
        startDate < new Date() &&
        existingSchedule?.startDate
      ) {
        body.schedule.startDate = existingSchedule.startDate;
      }
    }

    // Update the advertisement
    performance.trackDatabaseQuery();
    const updatedAd = await prisma.advertisement.update({
      where: { id: adId },
      data: {
        ...(body || {}),
        id: undefined, // Remove id from update data
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        type: true,
        content: true,

        bidding: true,
        schedule: true,
        status: true,
        priority: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate relevant caches
    await invalidateCacheByTags([
      'ads',
      `ad:${adId}`,
      user!.role === 'admin' ? 'admin' : `advertiser:${user!.id}`,
    ]);

    return createSuccessResponse({
      ...updatedAd,
      message: 'Advertisement updated successfully',
      estimatedReach: calculateEstimatedReach({}), // targeting field not available in current schema
    });
  },
  {
    requiredRoles: ['admin', 'employer'],
    paramsSchema: routeParamsSchemas.uuid,
    bodySchema: updateAdSchema,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

// DELETE /api/ads/:id - Delete advertisement
export const DELETE = withAPIMiddleware(
  async (req, context) => {
    const { user, params, performance } = context;
    const adId = params.id;

    // Verify ad exists and user has permission
    performance.trackDatabaseQuery();
    const existingAd = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        ...(user!.role === 'employer' ? { advertiserId: user!.id } : {}),
      },
    });

    if (!existingAd) {
      throw new NotFoundError('Advertisement not found');
    }

    // Don't allow deletion of active ads with spend
    if (existingAd.status === 'active') {
      performance.trackDatabaseQuery();
      const hasSpend =
        (await prisma.adClick.count({
          where: { adId },
        })) > 0;

      if (hasSpend) {
        throw new AuthorizationError(
          'Cannot delete active advertisements with recorded activity. Please pause the ad first.'
        );
      }
    }

    // Delete the advertisement (this will cascade delete related tracking data)
    performance.trackDatabaseQuery();
    await prisma.advertisement.delete({
      where: { id: adId },
    });

    // Invalidate relevant caches
    await invalidateCacheByTags([
      'ads',
      `ad:${adId}`,
      user!.role === 'admin' ? 'admin' : `advertiser:${user!.id}`,
    ]);

    return createSuccessResponse({
      message: 'Advertisement deleted successfully',
      deletedId: adId,
    });
  },
  {
    requiredRoles: ['admin', 'employer'],
    paramsSchema: routeParamsSchemas.uuid,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

// Helper functions
function isAdCurrentlyActive(status: string, schedule: any): boolean {
  if (status !== 'active') return false;

  if (!schedule?.startDate) return true; // If no schedule, consider active if status is active

  const now = new Date();
  const startDate = new Date(schedule.startDate);
  const endDate = schedule.endDate ? new Date(schedule.endDate) : null;

  return now >= startDate && (!endDate || now <= endDate);
}

function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const validTransitions: Record<string, string[]> = {
    draft: ['pending', 'cancelled'],
    pending: ['active', 'rejected', 'cancelled'],
    active: ['paused', 'cancelled', 'expired'],
    paused: ['active', 'cancelled', 'expired'],
    rejected: ['pending'], // Allow resubmission after fixes
    expired: ['cancelled'], // Only allow final cancellation
    cancelled: [], // No transitions from cancelled
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

function calculateBudgetUtilization(bidding: any, estimatedSpend: number): any {
  const dailyBudget = bidding.dailyBudget;
  const totalBudget = bidding.totalBudget;

  const utilization: any = {
    estimatedSpend,
  };

  if (dailyBudget) {
    utilization.dailyUtilization = (estimatedSpend / dailyBudget) * 100;
    utilization.dailyBudgetRemaining = Math.max(
      0,
      dailyBudget - estimatedSpend
    );
  }

  if (totalBudget) {
    utilization.totalUtilization = (estimatedSpend / totalBudget) * 100;
    utilization.totalBudgetRemaining = Math.max(
      0,
      totalBudget - estimatedSpend
    );
  }

  return utilization;
}

function calculateTargetingEffectiveness(
  targeting: any,
  performance: any
): any {
  // Simplified targeting effectiveness calculation
  const { impressions, clicks, conversions } = performance;

  let score = 50; // Base score

  // Reward good performance
  if (impressions > 1000) score += 10;
  if (clicks > 50) score += 10;
  if (conversions > 5) score += 15;

  // Analyze targeting specificity
  const targetingFactors = [
    targeting?.countries?.length || 0,
    targeting?.jobTitles?.length || 0,
    targeting?.skills?.length || 0,
    targeting?.experienceLevels?.length || 0,
  ];

  const avgTargeting =
    targetingFactors.reduce((a, b) => a + b, 0) / targetingFactors.length;

  if (avgTargeting > 5) score += 10; // Well-targeted
  if (avgTargeting < 2) score -= 10; // Too broad

  return {
    score: Math.min(100, Math.max(0, score)),
    level:
      score >= 80
        ? 'excellent'
        : score >= 60
          ? 'good'
          : score >= 40
            ? 'fair'
            : 'poor',
    recommendations: generateTargetingRecommendations(targeting, performance),
  };
}

function generateTargetingRecommendations(
  targeting: any,
  performance: any
): string[] {
  const recommendations: string[] = [];

  if (performance.impressions < 100) {
    recommendations.push('Consider broadening targeting to increase reach');
  }

  if (performance.clicks / performance.impressions < 0.01) {
    recommendations.push(
      'Low click-through rate - review ad creative and targeting'
    );
  }

  if (!targeting?.skills || targeting.skills.length === 0) {
    recommendations.push(
      'Add skills targeting to reach more relevant candidates'
    );
  }

  if (!targeting?.experienceLevels || targeting.experienceLevels.length === 0) {
    recommendations.push('Specify experience levels for better targeting');
  }

  return recommendations;
}

function generateOptimizationRecommendations(
  ad: any,
  performance: any
): string[] {
  const recommendations: string[] = [];

  // Performance-based recommendations
  if (performance.ctr < 1) {
    recommendations.push(
      'Consider improving ad creative to increase click-through rate'
    );
  }

  if (performance.conversionRate < 5) {
    recommendations.push('Optimize landing page to improve conversion rate');
  }

  // Bidding recommendations
  const bidding = ad.bidding as any;
  if (bidding?.type === 'cpc' && performance.totalClicks < 10) {
    recommendations.push(
      'Consider increasing bid amount to improve ad visibility'
    );
  }

  // Schedule recommendations
  const now = new Date();
  const schedule = ad.schedule as any;
  const endDate = schedule?.endDate ? new Date(schedule.endDate) : null;

  if (endDate && endDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
    recommendations.push(
      'Ad campaign ending soon - consider extending or creating a new campaign'
    );
  }

  return recommendations;
}

function calculateEstimatedReach(targeting: any): number {
  // Reuse the function from the main ads route
  let baseReach = 100000;

  if (targeting?.countries && targeting.countries.length > 0) {
    baseReach *= Math.min(targeting.countries.length / 10, 1);
  }

  if (targeting?.jobTitles && targeting.jobTitles.length > 0) {
    baseReach *= Math.min(targeting.jobTitles.length / 20, 0.5);
  }

  if (targeting?.experienceLevels && targeting.experienceLevels.length > 0) {
    baseReach *= Math.min(targeting.experienceLevels.length / 4, 0.7);
  }

  return Math.floor(baseReach);
}
