import { NextRequest } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api-middleware';
import { adQuerySchema, createAdSchema } from '@/lib/validations/ads';
import { prisma } from '@/lib/database/prisma';
import {
  createSuccessResponse,
  AuthorizationError,
} from '@/lib/utils/api-response';
import {
  generateCacheKey,
  CACHE_PREFIXES,
  DEFAULT_TTL,
  getCacheOrExecute,
  invalidateCacheByTags,
} from '@/lib/cache/redis';
import {
  calculateOffsetPagination,
  createPaginatedResponse,
} from '@/lib/cache/pagination';

// GET /api/ads - List advertisements (admins see all, employers see their own)
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { user, query, performance } = context;

    // Extract query parameters
    const {
      advertiserId,
      status,
      type,
      isActive,
      page,
      limit,
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
    } = query!;

    // Build where condition based on user role
    const whereCondition: any = {};

    // Role-based access control
    if (user!.role === 'admin') {
      // Admins can see all ads, optionally filtered by employer
      if (advertiserId) {
        whereCondition.employerId = advertiserId;
      }
    } else if (user!.role === 'employer') {
      // Employers can only see their own ads
      whereCondition.employerId = user!.id;
    } else {
      throw new AuthorizationError('Only employers and admins can access ads');
    }

    // Apply filters
    if (status) {
      whereCondition.status = status;
    }

    if (type) {
      whereCondition.type = type;
    }

    if (isActive !== undefined) {
      const now = new Date();
      if (isActive === 'true') {
        whereCondition.status = 'active';
        whereCondition.schedule = {
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        };
      } else {
        whereCondition.OR = [
          { status: { not: 'active' } },
          { schedule: { startDate: { gt: now } } },
          { schedule: { endDate: { lt: now } } },
        ];
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereCondition.createdAt = {};
      if (dateFrom) {
        whereCondition.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereCondition.createdAt.lte = new Date(dateTo);
      }
    }

    // Generate cache key
    const cacheKey = generateCacheKey(
      CACHE_PREFIXES.ads,
      user!.role === 'admin' ? 'all' : user!.id,
      JSON.stringify(whereCondition),
      `${page}-${limit}-${sortBy}-${sortOrder}`
    );

    const result = await getCacheOrExecute(
      cacheKey,
      async () => {
        // Count total ads
        performance.trackDatabaseQuery();
        const totalCount = await prisma.advertisement.count({
          where: whereCondition,
        });

        // Get paginated ads
        performance.trackDatabaseQuery();
        const ads = await prisma.advertisement.findMany({
          where: whereCondition,
          orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
          skip: ((page || 1) - 1) * (limit || 10),
          take: limit || 10,
          select: {
            id: true,
            name: true,
            type: true,
            content: true,
            status: true,
            bidding: true,
            schedule: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
            employerId: true,
            // Use direct fields instead of _count
            impressions: true,
            clicks: true,
            conversions: true,
          },
        });

        // Add performance metrics for each ad
        const adsWithMetrics = await Promise.all(
          ads.map(async ad => {
            // Calculate basic metrics
            const impressions = ad.impressions;
            const clicks = ad.clicks;
            const conversions = ad.conversions;

            const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
            const conversionRate =
              clicks > 0 ? (conversions / clicks) * 100 : 0;

            // Estimate spend based on bidding type (simplified)
            let estimatedSpend = 0;
            const bidding = ad.bidding as any;
            if (bidding?.type === 'cpc') {
              estimatedSpend = clicks * (bidding.bidAmount || 0);
            } else if (bidding?.type === 'cpm') {
              estimatedSpend = (impressions / 1000) * (bidding.bidAmount || 0);
            }

            return {
              ...ad,
              metrics: {
                impressions,
                clicks,
                conversions,
                ctr: Math.round(ctr * 100) / 100,
                conversionRate: Math.round(conversionRate * 100) / 100,
                estimatedSpend: Math.round(estimatedSpend * 100) / 100,
                costPerClick: clicks > 0 ? estimatedSpend / clicks : 0,
              },
              isCurrentlyActive: isAdCurrentlyActive(ad.status, ad.schedule),
            };
          })
        );

        const { meta } = calculateOffsetPagination(
          page || 1,
          limit || 10,
          totalCount
        );

        return createPaginatedResponse(adsWithMetrics, meta, {
          queryTime: Date.now(),
          cached: false,
        });
      },
      {
        ttl: DEFAULT_TTL.short,
        tags: [
          'ads',
          user!.role === 'admin' ? 'admin' : `advertiser:${user!.id}`,
        ],
      }
    );

    return createSuccessResponse(result);
  },
  {
    requiredRoles: ['admin', 'employer'],
    querySchema: adQuerySchema,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

// POST /api/ads - Create new advertisement
export const POST = withAPIMiddleware(
  async (req, context) => {
    const { user, body, performance } = context;

    // Only employers can create ads (admins can help via other means)
    if (user!.role !== 'employer') {
      throw new AuthorizationError('Only employers can create advertisements');
    }

    // Check if user has reached their ad limit
    performance.trackDatabaseQuery();
    const existingAdsCount = await prisma.advertisement.count({
      where: { employerId: user!.id },
    });

    const maxAdsPerEmployer = 50; // Configurable limit
    if (existingAdsCount >= maxAdsPerEmployer) {
      throw new AuthorizationError(
        `Maximum ${maxAdsPerEmployer} advertisements allowed per account`
      );
    }

    // Validate schedule dates
    if (!body) {
      throw new Error('Request body is required');
    }

    const startDate = new Date(body.schedule.startDate);
    const endDate = body.schedule.endDate
      ? new Date(body.schedule.endDate)
      : null;

    if (endDate && endDate <= startDate) {
      throw new AuthorizationError('End date must be after start date');
    }

    // Set initial status based on validation needs
    const initialStatus = determineInitialStatus(body, user!);

    // Create the advertisement
    performance.trackDatabaseQuery();
    const ad = await prisma.advertisement.create({
      data: {
        ...body,
        employerId: user!.id,
        status: initialStatus,
        title: body.name || 'Untitled Ad',
        businessName: body.content?.companyLogo || 'Unknown Business',
        imageUrl: body.content?.imageUrl || '',
        targetUrl: body.content?.ctaUrl || '',
        zipCodes: (body.targeting?.cities || []).join(','),
        startDate: new Date(body.schedule?.startDate || Date.now()),
        endDate: body.schedule?.endDate
          ? new Date(body.schedule.endDate)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        impressions: 0,
        clicks: 0,
        conversions: 0,
        createdAt: new Date(),
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
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate relevant caches
    await invalidateCacheByTags(['ads', `advertiser:${user!.id}`]);

    // Estimate potential reach (simplified calculation)
    const estimatedReach = calculateEstimatedReach({});

    return createSuccessResponse({
      ...ad,
      estimatedReach,
      message: `Advertisement created successfully. Status: ${initialStatus}`,
      nextSteps: getNextSteps(initialStatus),
    });
  },
  {
    requiredRoles: ['employer'],
    bodySchema: createAdSchema,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

// Helper function to check if ad is currently active
function isAdCurrentlyActive(status: string, schedule: any): boolean {
  if (status !== 'active') return false;

  if (!schedule?.startDate) return true; // If no schedule, consider active if status is active

  const now = new Date();
  const startDate = new Date(schedule.startDate);
  const endDate = schedule.endDate ? new Date(schedule.endDate) : null;

  if (now < startDate) return false;
  if (endDate && now > endDate) return false;

  return true;
}

// Determine initial status for new ads
function determineInitialStatus(adData: any, user: any): string {
  // Simple approval logic - in production this would be more sophisticated
  const needsReview =
    adData.bidding.bidAmount > 10 || // High bid amounts need review
    adData.content.description.length < 50 || // Short descriptions need review
    !adData.content.imageUrl; // Ads without images need review

  return needsReview ? 'pending' : 'active';
}

// Calculate estimated reach based on targeting
function calculateEstimatedReach(targeting: any): number {
  // Simplified reach calculation
  let baseReach = 100000; // Base potential audience

  // Apply targeting multipliers
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

// Get next steps based on ad status
function getNextSteps(status: string): string[] {
  switch (status) {
    case 'pending':
      return [
        'Your ad is pending review',
        "You will be notified once it's approved",
        'Review typically takes 1-2 business days',
      ];
    case 'active':
      return [
        'Your ad is now live!',
        'Monitor performance in the dashboard',
        'Adjust targeting or bidding as needed',
      ];
    case 'draft':
      return [
        'Complete all required fields',
        'Set up targeting and scheduling',
        'Submit for review',
      ];
    default:
      return ['Contact support for assistance'];
  }
}
