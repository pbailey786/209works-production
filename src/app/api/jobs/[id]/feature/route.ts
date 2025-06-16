import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api';
import { createSuccessResponse, createErrorResponse, ValidationError, NotFoundError, AuthorizationError } from '@/lib/errors/api-errors';
import { prisma } from '@/app/api/auth/prisma';
import { JobQueueService } from '@/lib/services/job-queue';
import { FeaturedJobAnalyticsService } from '@/lib/services/featured-job-analytics';
import { z } from 'zod';

const featureJobSchema = z.object({
  featured: z.boolean(),
  paymentConfirmed: z.boolean().optional().default(false),
  creditUsed: z.boolean().optional().default(true)
});

// POST /api/jobs/[id]/feature - Feature or unfeature a job post
export const POST = withAPIMiddleware(
  async (req, context) => {
    const { params, body, user } = context;
    const jobId = params?.id as string;

    if (!jobId) {
      return createErrorResponse(new ValidationError('Job ID is required'));
    }

    try {
      // Get the job and verify ownership
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          title: true,
          company: true,
          employerId: true,
          featured: true,
          status: true
        }
      });

      if (!job) {
        return createErrorResponse(new NotFoundError('Job'));
      }

      // Check permissions - must be job owner or admin
      if (user!.role !== 'admin' && job.employerId !== user!.id) {
        return createErrorResponse(new AuthorizationError('You can only feature your own jobs'));
      }

      if (job.status !== 'active') {
        return createErrorResponse(new ValidationError('Only active jobs can be featured'));
      }

      const { featured, paymentConfirmed, creditUsed } = body!;

      // If featuring the job
      if (featured && !job.featured) {
        // Check if user has credits (unless admin)
        if (user!.role !== 'admin' && creditUsed) {
          // TODO: Integrate with credit system
          // const hasCredits = await checkUserCredits(user!.id);
          // if (!hasCredits) {
          //   return createErrorResponse('Insufficient credits to feature this job', 402);
          // }
        }

        // Update job to featured
        await prisma.job.update({
          where: { id: jobId },
          data: { featured: true }
        });

        // Create analytics tracking
        await FeaturedJobAnalyticsService.createFeaturedJobAnalytics(jobId);

        // Queue AI matching process
        await JobQueueService.queueFeaturedJobMatching(jobId, 10);

        console.log(`✨ Job ${jobId} marked as featured, AI matching queued`);

        return createSuccessResponse({
          message: 'Job featured successfully',
          jobId,
          featured: true,
          aiMatchingQueued: true
        });
      }
      
      // If unfeaturing the job
      else if (!featured && job.featured) {
        await prisma.job.update({
          where: { id: jobId },
          data: { featured: false }
        });

        console.log(`📌 Job ${jobId} unfeatured`);

        return createSuccessResponse({
          message: 'Job unfeatured successfully',
          jobId,
          featured: false
        });
      }

      // No change needed
      return createSuccessResponse({
        message: 'No changes made',
        jobId,
        featured: job.featured
      });

    } catch (error) {
      console.error(`Failed to feature/unfeature job ${jobId}:`, error);
      return createErrorResponse(error);
    }
  },
  {
    requiredRoles: ['employer', 'admin'],
    bodySchema: featureJobSchema,
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true, includeBody: true },
  }
);

// GET /api/jobs/[id]/feature - Get featured job status and matching stats
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { params, user } = context;
    const jobId = params?.id as string;

    if (!jobId) {
      return createErrorResponse(new ValidationError('Job ID is required'));
    }

    try {
      // Get the job and verify ownership
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true,
          title: true,
          company: true,
          employerId: true,
          featured: true,
          status: true
        }
      });

      if (!job) {
        return createErrorResponse(new NotFoundError('Job'));
      }

      // Check permissions - must be job owner or admin
      if (user!.role !== 'admin' && job.employerId !== user!.id) {
        return createErrorResponse(new AuthorizationError('You can only view your own job stats'));
      }

      let matchingStats = null;
      let analytics = null;

      if (job.featured) {
        // Get matching statistics
        const { JobMatchingService } = await import('@/lib/services/job-matching');
        matchingStats = await JobMatchingService.getMatchingStats(jobId);

        // Get analytics
        analytics = await FeaturedJobAnalyticsService.getJobAnalytics(jobId);
      }

      return createSuccessResponse({
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          featured: job.featured,
          status: job.status
        },
        matchingStats,
        analytics: analytics ? {
          impressions: analytics.impressions,
          clicks: analytics.clicks,
          conversionRate: analytics.conversionRate,
          emailAlerts: analytics.emailAlerts,
          emailClicks: analytics.emailClicks,
          featuredAt: analytics.featuredAt
        } : null
      });

    } catch (error) {
      console.error(`Failed to get featured job status for ${jobId}:`, error);
      return createErrorResponse(error);
    }
  },
  {
    requiredRoles: ['employer', 'admin'],
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true },
  }
);