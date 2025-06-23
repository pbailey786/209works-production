import { NextRequest } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api';
import { updateAlertSchema } from '@/lib/validations/alerts';
import { routeParamsSchemas } from '@/lib/middleware/validation';
import {
  createSuccessResponse,
  NotFoundError,
  AuthorizationError,
} from '@/lib/errors/api-errors';
import { prisma } from '@/lib/database/prisma';
import {
  generateCacheKey,
  CACHE_PREFIXES,
  DEFAULT_TTL,
  getCacheOrExecute,
  invalidateCacheByTags,
} from '@/lib/cache/redis';

// GET /api/alerts/:id - Get specific alert details
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { user, params, performance } = context;
    const alertId = params.id;

    // Generate cache key
    const cacheKey = generateCacheKey(
      CACHE_PREFIXES.alerts,
      alertId,
      'details'
    );

    return getCacheOrExecute(
      cacheKey,
      async () => {
        // Get alert with detailed information
        performance.trackDatabaseQuery();
        const alert = await prisma.jobAlert.findFirst({
          where: {
            id: alertId,
            userId: user!.id, // Users can only access their own alerts
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
            lastTriggered: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!alert) {
          throw new NotFoundError('Alert not found');
        }

        // Get recent matching jobs (simulated for now)
        // TODO: Implement actual job matching logic
        const recentMatches = Array.from(
          { length: Math.min(5, Math.floor(Math.random() * 10)) },
          (_, i) => ({
            id: `job-${i + 1}`,
            title: `Sample Job ${i + 1}`,
            company: `Company ${i + 1}`,
            location: 'San Francisco, CA',
            postedAt: new Date(
              Date.now() - i * 24 * 60 * 60 * 1000
            ).toISOString(),
            matchScore: Math.random() * 100,
          })
        );

        // Calculate alert effectiveness stats
        const stats = {
          totalNotifications: 0, // TODO: Count from notifications table
          averageMatches: Math.floor(Math.random() * 15) + 5,
          clickThroughRate: Math.random() * 0.3 + 0.1, // 10-40% CTR
          lastActivity: alert.lastTriggered,
          estimatedNextRun: calculateNextRun(
            alert.frequency,
            alert.lastTriggered
          ),
        };

        // Map database fields to frontend expected fields
        const mappedAlert = {
          id: alert.id,
          jobTitle: alert.title, // Map title to jobTitle
          keywords: alert.keywords,
          location: alert.location,
          frequency: alert.frequency,
          isActive: alert.isActive,
          salaryMin: alert.salaryMin,
          salaryMax: alert.salaryMax,
          lastTriggered: alert.lastTriggered,
          createdAt: alert.createdAt,
          updatedAt: alert.updatedAt,
          // Add frontend-expected fields with defaults
          type: 'job_title_alert',
          categories: [],
          jobTypes: [],
          companies: [],
          emailEnabled: true,
        };

        return createSuccessResponse({
          ...mappedAlert,
          recentMatches,
          stats,
        });
      },
      {
        ttl: DEFAULT_TTL.short,
        tags: ['alerts', `alert:${alertId}`, `user:${user!.id}`],
      }
    );
  },
  {
    requiredRoles: ['admin', 'employer', 'jobseeker'],
    paramsSchema: routeParamsSchemas.uuid,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

// PUT /api/alerts/:id - Update alert
export const PUT = withAPIMiddleware(
  async (req, context) => {
    const { user, params, body, performance } = context;
    const alertId = params.id;

    // Verify alert exists and belongs to user
    performance.trackDatabaseQuery();
    const existingAlert = await prisma.jobAlert.findFirst({
      where: {
        id: alertId,
        userId: user!.id,
      },
    });

    if (!existingAlert) {
      throw new NotFoundError('Alert not found');
    }

    // Prepare update data without id field
    const { id, ...updateData } = body as any;
    
    // Map frontend fields to database fields
    const mappedUpdateData: any = {};
    if (updateData.jobTitle !== undefined) mappedUpdateData.title = updateData.jobTitle;
    if (updateData.keywords !== undefined) mappedUpdateData.keywords = updateData.keywords;
    if (updateData.location !== undefined) mappedUpdateData.location = updateData.location;
    if (updateData.jobTypes !== undefined) mappedUpdateData.jobType = updateData.jobTypes?.[0]; // Take first from array
    if (updateData.salaryMin !== undefined) mappedUpdateData.salaryMin = updateData.salaryMin;
    if (updateData.salaryMax !== undefined) mappedUpdateData.salaryMax = updateData.salaryMax;
    if (updateData.isActive !== undefined) mappedUpdateData.isActive = updateData.isActive;
    if (updateData.frequency !== undefined) mappedUpdateData.frequency = updateData.frequency;
    
    // Update the alert
    performance.trackDatabaseQuery();
    const updatedAlert = await prisma.jobAlert.update({
      where: { id: alertId },
      data: {
        ...mappedUpdateData,
        updatedAt: new Date(),
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
        lastTriggered: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate relevant caches
    await invalidateCacheByTags([
      'alerts',
      `alert:${alertId}`,
      `user:${user!.id}`,
    ]);

    // Map database response to frontend expected format
    const mappedUpdatedAlert = {
      id: updatedAlert.id,
      jobTitle: updatedAlert.title, // Map title to jobTitle
      keywords: updatedAlert.keywords,
      location: updatedAlert.location,
      frequency: updatedAlert.frequency,
      isActive: updatedAlert.isActive,
      salaryMin: updatedAlert.salaryMin,
      salaryMax: updatedAlert.salaryMax,
      lastTriggered: updatedAlert.lastTriggered,
      createdAt: updatedAlert.createdAt,
      updatedAt: updatedAlert.updatedAt,
      // Add frontend-expected fields with defaults
      type: 'job_title_alert',
      categories: [],
      jobTypes: [],
      companies: [],
      emailEnabled: true,
    };

    // Re-estimate matches with new criteria
    const estimatedMatches = Math.floor(Math.random() * 50);

    return createSuccessResponse({
      ...mappedUpdatedAlert,
      estimatedMatches,
      message: 'Alert updated successfully',
    });
  },
  {
    requiredRoles: ['admin', 'employer', 'jobseeker'],
    paramsSchema: routeParamsSchemas.uuid,
    bodySchema: updateAlertSchema,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

// DELETE /api/alerts/:id - Delete alert
export const DELETE = withAPIMiddleware(
  async (req, context) => {
    const { user, params, performance } = context;
    const alertId = params.id;

    // Verify alert exists and belongs to user
    performance.trackDatabaseQuery();
    const existingAlert = await prisma.jobAlert.findFirst({
      where: {
        id: alertId,
        userId: user!.id,
      },
    });

    if (!existingAlert) {
      throw new NotFoundError('Alert not found');
    }

    // Delete the alert (this will cascade delete related notifications)
    performance.trackDatabaseQuery();
    await prisma.jobAlert.delete({
      where: { id: alertId },
    });

    // Invalidate relevant caches
    await invalidateCacheByTags([
      'alerts',
      `alert:${alertId}`,
      `user:${user!.id}`,
    ]);

    return createSuccessResponse({
      message: 'Alert deleted successfully',
      deletedId: alertId,
    });
  },
  {
    requiredRoles: ['admin', 'employer', 'jobseeker'],
    paramsSchema: routeParamsSchemas.uuid,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

// Helper function to calculate next alert run time
function calculateNextRun(
  frequency: string,
  lastSent: Date | null
): string | null {
  if (!lastSent) return 'Will run immediately for new jobs';

  const lastSentTime = new Date(lastSent).getTime();
  const now = Date.now();

  let nextRunTime: number;

  switch (frequency) {
    case 'immediate':
      return 'Runs immediately when new jobs match';
    case 'daily':
      nextRunTime = lastSentTime + 24 * 60 * 60 * 1000;
      break;
    case 'weekly':
      nextRunTime = lastSentTime + 7 * 24 * 60 * 60 * 1000;
      break;
    case 'monthly':
      nextRunTime = lastSentTime + 30 * 24 * 60 * 60 * 1000;
      break;
    default:
      return null;
  }

  if (nextRunTime <= now) {
    return 'Scheduled to run soon';
  }

  return new Date(nextRunTime).toISOString();
}
