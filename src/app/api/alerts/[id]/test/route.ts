import { NextRequest } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api';
import { testAlertSchema } from '@/lib/validations/alerts';
import { routeParamsSchemas } from '@/lib/middleware/validation';
import { createSuccessResponse, NotFoundError } from '@/lib/errors/api-errors';
import { prisma } from '../../../auth/prisma';
import { EnhancedJobSearchService } from '@/lib/search/services';
import {
  EnhancedJobMatchingService,
  findMatchingJobs,
  calculateMatchQuality,
  generateOptimizationRecommendations,
} from '@/lib/search/job-matching';
import {
  generateCacheKey,
  CACHE_PREFIXES,
  DEFAULT_TTL,
  getCacheOrExecute,
} from '@/lib/cache/redis';

// POST /api/alerts/:id/test - Test alert to see matching jobs
export const POST = withAPIMiddleware(
  async (req, context) => {
    const { user, params, body, performance } = context;
    const alertId = params.id;
    const dryRun = body?.dryRun || false;

    // Verify alert exists and belongs to user
    performance.trackDatabaseQuery();
    const alert = await prisma.jobAlert.findFirst({
      where: {
        id: alertId,
        userId: user!.id,
      },
      select: {
        id: true,
        title: true,
        keywords: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
        frequency: true,
      },
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    // Generate cache key for test results (cache for a short time)
    const cacheKey = generateCacheKey(
      CACHE_PREFIXES.alerts,
      alertId,
      'test',
      JSON.stringify({
        keywords: alert.keywords,
        location: alert.location,
        salaryMin: alert.salaryMin,
        salaryMax: alert.salaryMax,
      })
    );

    return getCacheOrExecute(
      cacheKey,
      async () => {
        // Use enhanced job matching algorithm
        const alertCriteria = {
          keywords: alert.keywords,
          location: alert.location || undefined,
          salaryMin: alert.salaryMin || undefined,
          salaryMax: alert.salaryMax || undefined,
        };
        const matchingJobs = await findMatchingJobs(alertCriteria, 50);

        // Calculate match quality metrics using enhanced algorithm
        const matchQuality = calculateMatchQuality(alertCriteria, matchingJobs);

        // Simulate sending notification if not dry run
        let notificationPreview = null;
        if (!dryRun && matchingJobs.length > 0) {
          notificationPreview = generateNotificationPreview(
            {
              ...alert,
              name: alert.title || 'Unnamed Alert',
            },
            matchingJobs
          );

          // In a real implementation, you would:
          // 1. Update alert.lastSent
          // 2. Create notification record
          // 3. Send actual email/SMS/push notification
        }

        return createSuccessResponse({
          alert: {
            id: alert.id,
            name: alert.title || 'Unnamed Alert',
            frequency: alert.frequency,
          },
          testResults: {
            totalMatches: matchingJobs.length,
            matchingJobs,
            matchQuality,
            recommendations: generateOptimizationRecommendations(
              alertCriteria,
              matchingJobs
            ),
          },
          notificationPreview,
          dryRun: body?.dryRun || false,
        });
      },
      {
        ttl: DEFAULT_TTL.short,
        tags: ['alerts', `alert:${alertId}`],
      }
    );
  },
  {
    requiredRoles: ['admin', 'employer', 'jobseeker'],
    paramsSchema: routeParamsSchemas.uuid,
    bodySchema: testAlertSchema,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

// Note: Alert matching functions moved to @/lib/search/job-matching.ts
// for enhanced algorithm implementation

// Generate notification preview
function generateNotificationPreview(alert: any, jobs: any[]): any {
  const topJobs = jobs.slice(0, 3); // Show top 3 jobs in preview

  return {
    subject: `${jobs.length} new job${jobs.length !== 1 ? 's' : ''} matching "${alert.name}"`,
    preview: `Found ${jobs.length} new opportunities including ${topJobs.map(job => job.title).join(', ')}`,
    emailBody: {
      heading: `New Job Matches for "${alert.name}"`,
      summary: `We found ${jobs.length} new job${jobs.length !== 1 ? 's' : ''} that match your alert criteria.`,
      jobs: topJobs.map(job => ({
        title: job.title,
        company: job.company,
        location: job.location,
        salary:
          job.salaryMin && job.salaryMax
            ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
            : 'Salary not specified',
        snippet: job.snippet || 'No description available',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${job.id}`,
      })),
      footerText:
        jobs.length > 3
          ? `View all ${jobs.length} matches on 209jobs`
          : undefined,
    },
    estimatedDelivery: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
  };
}
