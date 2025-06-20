import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { z } from '@/components/ui/card';
import { withAPIMiddleware } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

  alertQuerySchema,
  createAlertSchema as createAlertValidationSchema,
} from '@/components/ui/card';
import {
  import {
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
  invalidateCacheByTags,
} from '@/components/ui/card';
import {
  import {
  calculateOffsetPagination,
  createPaginatedResponse,
} from '@/lib/cache/pagination';

// Validation schemas
const createAlertSchema = z.object({
  type: z.enum([
    'job_title_alert',
    'weekly_digest',
    'job_category_alert',
    'location_alert',
    'company_alert',
  ]),
  frequency: z
    .enum(['immediate', 'daily', 'weekly', 'monthly'])
    .default('immediate'),
  jobTitle: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  location: z.string().optional(),
  categories: z.array(z.string()).default([]),
  jobTypes: z
    .array(
      z.enum([
        'full_time',
        'part_time',
        'contract',
        'internship',
        'temporary',
        'volunteer',
        'other',
      ])
    )
    .default([]),
  companies: z.array(z.string()).default([]),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  emailEnabled: z.boolean().default(true),
});

// GET /api/alerts - List user's alerts
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });
    
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const alerts = await prisma.alert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Create new alert
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRecord = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });
    
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRecord = await prisma.user.findUnique({
      where: { email: user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = createAlertSchema.parse(body);

    // Check if user already has maximum alerts (optional business rule)
    const alertCount = await prisma.alert.count({
      where: { userId: user.id, isActive: true },
    });

    if (alertCount >= 10) {
      // Max 10 active alerts per user
      return NextResponse.json(
        { error: 'Maximum number of alerts reached (10)' },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        userId: user.id,
        ...validatedData,
      },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create alert error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Alternative GET handler with middleware (not exported to avoid Next.js conflicts)
const GET_API = withAPIMiddleware(
  async (req, context) => {
    const { user, query, performance } = context;

    // Extract query parameters
    const { isActive, frequency, page, limit, sortBy, sortOrder } = query!;

    // Build where condition
    const whereCondition: any = {
      userId: user!.id, // Users can only see their own alerts
    };

    // Apply filters
    if (isActive !== undefined) {
      whereCondition.isActive = isActive === 'true';
    }

    if (frequency) {
      whereCondition.frequency = frequency;
    }

    // Generate cache key
    const cacheKey = generateCacheKey(
      CACHE_PREFIXES.alerts,
      user!.id,
      'list',
      JSON.stringify(whereCondition),
      `${page || 1}-${limit || 10}-${sortBy || 'createdAt'}-${sortOrder || 'desc'}`
    );

    return getCacheOrExecute(
      cacheKey,
      async () => {
        // Count total alerts
        performance.trackDatabaseQuery();
        const totalCount = await prisma.jobAlert.count({
          where: whereCondition,
        });

        // Get paginated alerts
        performance.trackDatabaseQuery();
        const alerts = await prisma.jobAlert.findMany({
          where: whereCondition,
          orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
          skip: ((page || 1) - 1) * (limit || 10),
          take: limit || 10,
          select: {
            id: true,
            title: true,
            keywords: true,
            location: true,
            frequency: true,
            isActive: true,
            salaryMin: true,
            salaryMax: true,
            lastTriggered: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // Add statistics for each alert (optimized to avoid N+1 queries)
        const alertIds = alerts.map(alert => alert.id);

        // Batch fetch recent matches for all alerts at once
        performance.trackDatabaseQuery();
        const recentMatchesData = await prisma.jobAlertMatch.groupBy({
          by: ['alertId'],
          where: {
            alertId: { in: alertIds },
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
          _count: {
            id: true,
          },
        });

        // Create lookup map for O(1) access
        const recentMatchesMap = new Map(
          recentMatchesData.map(item => [item.alertId, item._count.id])
        );

        // Combine data without additional queries
        const alertsWithStats = alerts.map(alert => ({
          ...alert,
          stats: {
            totalNotifications: 0, // TODO: Count from notifications table
            recentMatches: recentMatchesMap.get(alert.id) || 0,
            lastMatchDate: alert.lastTriggered,
          },
        }));

        const { meta } = calculateOffsetPagination(
          page || 1,
          limit || 10,
          totalCount
        );

        const paginatedResponse = createPaginatedResponse(
          alertsWithStats,
          meta,
          {
            queryTime: Date.now(),
            cached: false,
          }
        );

        return createSuccessResponse(paginatedResponse);
      },
      {
        ttl: DEFAULT_TTL.short,
        tags: ['alerts', `user:${user!.id}`],
      }
    );
  },
  {
    requiredRoles: ['admin', 'employer', 'jobseeker'],
    querySchema: alertQuerySchema,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

// Alternative POST handler with middleware (not exported to avoid Next.js conflicts)
const POST_API = withAPIMiddleware(
  async (req, context) => {
    const { user, body, performance } = context;

    // Check if user already has too many alerts (prevent spam)
    performance.trackDatabaseQuery();
    const existingAlertsCount = await prisma.jobAlert.count({
      where: { userId: user!.id },
    });

    const maxAlertsPerUser = user!.role === 'admin' ? 100 : 20;
    if (existingAlertsCount >= maxAlertsPerUser) {
      throw new AuthorizationError(
        `Maximum ${maxAlertsPerUser} alerts allowed per user`
      );
    }

    // Create the alert
    performance.trackDatabaseQuery();
    const alert = await prisma.jobAlert.create({
      data: {
        ...body!,
        userId: user!.id,
        title: body!.name || 'Untitled Alert',
        lastTriggered: null,
      },
      select: {
        id: true,
        title: true,
        keywords: true,
        location: true,
        frequency: true,
        isActive: true,
        salaryMin: true,
        salaryMax: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate user's alerts cache
    await invalidateCacheByTags([`user:${user!.id}`, 'alerts']);

    // Test the alert immediately to provide feedback
    // TODO: Implement actual job matching logic
    const estimatedMatches = Math.floor(Math.random() * 50);

    return createSuccessResponse({
      ...alert,
      estimatedMatches,
      message: 'Alert created successfully',
    });
  },
  {
    requiredRoles: ['admin', 'employer', 'jobseeker'],
    bodySchema: createAlertValidationSchema,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);
