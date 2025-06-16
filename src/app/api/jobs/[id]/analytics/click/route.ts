import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api';
import { createSuccessResponse, createErrorResponse } from '@/lib/errors/api-errors';
import { FeaturedJobAnalyticsService } from '@/lib/services/featured-job-analytics';
import { prisma } from '@/app/api/auth/prisma';
import { z } from 'zod';

const clickTrackingSchema = z.object({
  action: z.enum(['view_details', 'apply_click', 'company_click', 'save_job']).optional(),
  source: z.enum(['search', 'email', 'direct']).optional(),
});

// POST /api/jobs/[id]/analytics/click - Track job click/interaction
export const POST = withAPIMiddleware(
  async (req, context) => {
    const { params, body } = context;
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

      // Track the click
      await FeaturedJobAnalyticsService.trackClick(jobId);

      // If this is from an email, also track email click
      if (body?.source === 'email') {
        await FeaturedJobAnalyticsService.trackEmailClick(jobId);
      }

      return createSuccessResponse({ 
        tracked: true, 
        jobId,
        action: body?.action || 'click',
        source: body?.source || 'direct',
        message: 'Click tracked successfully' 
      });
    } catch (error) {
      console.error('Failed to track click:', error);
      return createErrorResponse('Failed to track click', 500);
    }
  },
  {
    requiredRoles: [], // Public endpoint
    bodySchema: clickTrackingSchema,
    rateLimit: { enabled: true, type: 'public' },
    logging: { enabled: false }, // Don't log these frequent requests
  }
);