import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api';
import { createSuccessResponse, createErrorResponse } from '@/lib/errors/api-errors';
import { FeaturedJobAnalyticsService } from '@/lib/services/featured-job-analytics';
import { prisma } from '@/app/api/auth/prisma';

// POST /api/jobs/[id]/analytics/impression - Track job impression
export const POST = withAPIMiddleware(
  async (req, context) => {
    const { params } = context;
    const jobId = params?.id as string;

    if (!jobId) {
      return createErrorResponse('Job ID is required', 400);
    }

    try {
      // Check if job exists and is featured
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, featured: true }
      });

      if (!job) {
        return createErrorResponse('Job not found', 404);
      }

      // Only track analytics for featured jobs
      if (!job.featured) {
        return createSuccessResponse({ tracked: false, reason: 'Job is not featured' });
      }

      // Check if analytics record exists, create if not
      const hasAnalytics = await FeaturedJobAnalyticsService.hasAnalytics(jobId);
      if (!hasAnalytics) {
        await FeaturedJobAnalyticsService.createFeaturedJobAnalytics(jobId);
      }

      // Track the impression
      await FeaturedJobAnalyticsService.trackImpression(jobId);

      return createSuccessResponse({ 
        tracked: true, 
        jobId, 
        message: 'Impression tracked successfully' 
      });
    } catch (error) {
      console.error('Failed to track impression:', error);
      return createErrorResponse('Failed to track impression', 500);
    }
  },
  {
    requiredRoles: [], // Public endpoint
    rateLimit: { enabled: true, type: 'public' },
    logging: { enabled: false }, // Don't log these frequent requests
  }
);