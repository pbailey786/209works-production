import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api';
import { createSuccessResponse, createErrorResponse, ValidationError, NotFoundError } from '@/lib/errors/api-errors';
import { FeaturedJobAnalyticsService } from '@/lib/services/featured-job-analytics';
import { prisma } from '@/lib/database/prisma';
// POST /api/jobs/[id]/analytics/impression - Track job impression
export const POST = withAPIMiddleware(
  async (req, context) => {
    const { params } = context;
    const jobId = params?.id as string;

    if (!jobId) {
      return createErrorResponse(new ValidationError('Job ID is required'));
    }

    try {
      // Check if job exists and is featured
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, featured: true }
      });

      if (!job) {
        return createErrorResponse(new NotFoundError('Job'));
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
      return createErrorResponse(error);
    }
  },
  {
    requiredRoles: [], // Public endpoint
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: false }, // Don't log these frequent requests
  }
);