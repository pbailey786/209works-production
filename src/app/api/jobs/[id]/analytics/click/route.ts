import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/components/ui/card';
import { createSuccessResponse, createErrorResponse, ValidationError, NotFoundError } from '@/components/ui/card';
import { FeaturedJobAnalyticsService } from '@/components/ui/card';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';

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
      return createErrorResponse(error);
    }
  },
  {
    requiredRoles: [], // Public endpoint
    bodySchema: clickTrackingSchema,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: false }, // Don't log these frequent requests
  }
);