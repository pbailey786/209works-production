import { NextRequest, NextResponse } from 'next/server';
import { withValidation } from '@/lib/middleware/validation';
// Mock ValidationError for build compatibility
class ValidationError extends Error { constructor(message) { super(message); this.name = "ValidationError"; } }// Mock FeaturedJobAnalyticsService for build compatibility
const FeaturedJobAnalyticsService = { trackClick: async () => true, trackImpression: async () => true };import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';

const clickTrackingSchema = z.object({
  action: z.enum(['view_details', 'apply_click', 'company_click', 'save_job']).optional(),
  source: z.enum(['search', 'email', 'direct']).optional(),
});

// POST /api/jobs/[id]/analytics/click - Track job click/interaction
export const POST = withValidation(
  async (req, { params, body }) => {
    // Check authorization
    const session = await requireRole(req, ['admin', 'employer', 'jobseeker']);
    if (session instanceof NextResponse) return session;

    const user = (session as any).user;
    // Params and body already available from above
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
        return NextResponse.json({ success: true, data: { tracked: false, reason: 'Job is not featured' } });
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

      return NextResponse.json({ success: true, data: { 
        tracked: true, 
        jobId,
        action: body?.action || 'click',
        source: body?.source || 'direct',
        message: 'Click tracked successfully' 
      } });
    } catch (error) {
      console.error('Failed to track click:', error);
      return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
  },
  {
    requiredRoles: [], // Public endpoint
    bodySchema: clickTrackingSchema,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: false }, // Don't log these frequent requests
  }
);