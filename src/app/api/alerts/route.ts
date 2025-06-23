import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { ensureUserExists } from '@/lib/auth/user-sync';
import { z } from 'zod';
import { withAPIMiddleware } from '@/lib/middleware/api';
import {
  alertQuerySchema,
  createAlertSchema as createAlertValidationSchema,
} from '@/lib/validations/alerts';
import {
  createSuccessResponse,
  NotFoundError,
  AuthorizationError,
} from '@/lib/errors/api-errors';
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
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

// Use the validation schema from the validations file
const createAlertSchema = createAlertValidationSchema;

// GET /api/alerts - List user's alerts
export async function GET(req: NextRequest) {
  try {
    // Ensure user exists in database (auto-sync with Clerk)
    const user = await ensureUserExists();

    const alerts = await prisma.jobAlert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        keywords: true,
        location: true,
        jobType: true,
        salaryMin: true,
        salaryMax: true,
        isActive: true,
        frequency: true,
        lastTriggered: true,
        totalJobsSent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Map JobAlert fields to match frontend expectations
    const mappedAlerts = alerts.map(alert => ({
      id: alert.id,
      type: 'job_title_alert',
      frequency: alert.frequency,
      isActive: alert.isActive,
      jobTitle: alert.title, // Map title to jobTitle for frontend
      keywords: alert.keywords,
      location: alert.location,
      categories: [], // JobAlert doesn't have categories, default to empty
      jobTypes: alert.jobType ? [alert.jobType] : [], // Convert singular to array
      companies: [], // JobAlert doesn't have companies, default to empty
      salaryMin: alert.salaryMin,
      salaryMax: alert.salaryMax,
      emailEnabled: true, // Default value
      totalJobsSent: alert.totalJobsSent,
      lastTriggered: alert.lastTriggered?.toISOString(),
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    }));

    return NextResponse.json({ alerts: mappedAlerts });
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
    // Ensure user exists in database (auto-sync with Clerk)
    const user = await ensureUserExists();

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
        userId: user!.id,
        title: body!.jobTitle || 'Untitled Alert',
        keywords: body!.keywords || [],
        location: body!.location,
        jobType: body!.jobTypes?.[0], // JobAlert model uses singular jobType, take first from array
        salaryMin: body!.salaryMin,
        salaryMax: body!.salaryMax,
        isActive: body!.isActive ?? true,
        frequency: body!.frequency || 'immediate',
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
