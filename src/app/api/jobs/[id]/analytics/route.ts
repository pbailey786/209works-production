import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api-middleware';
import { z } from 'zod';
import { FeaturedJobAnalyticsService } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';
// GET /api/jobs/[id]/analytics - Get analytics for a specific job
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { params, user } = context;
    const jobId = params?.id as string;

    if (!jobId) {
      return createErrorResponse(new ValidationError('Job ID is required'));
    }

    try {
      // Check if job exists and verify ownership (unless admin)
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { 
          id: true, 
          title: true,
          featured: true, 
          employerId: true,
          employer: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!job) {
        return createErrorResponse(new NotFoundError('Job'));
      }

      // Check permissions - must be job owner or admin
      if (user!.role !== 'admin' && job.employerId !== user!.id) {
        return createErrorResponse(new AuthorizationError('You can only view analytics for your own jobs'));
      }

      if (!job.featured) {
        return createSuccessResponse({ 
          message: 'Job is not featured, no analytics available',
          job: {
            id: job.id,
            title: job.title,
            featured: false
          },
          analytics: null
        });
      }

      // Get analytics data
      const analytics = await FeaturedJobAnalyticsService.getJobAnalytics(jobId);

      if (!analytics) {
        return createSuccessResponse({
          message: 'No analytics data found for this job',
          job: {
            id: job.id,
            title: job.title,
            featured: true
          },
          analytics: null
        });
      }

      return createSuccessResponse({
        job: {
          id: job.id,
          title: job.title,
          featured: true,
          employer: job.employer
        },
        analytics: {
          impressions: analytics.impressions,
          clicks: analytics.clicks,
          conversionRate: analytics.conversionRate,
          emailAlerts: analytics.emailAlerts,
          emailClicks: analytics.emailClicks,
          featuredAt: analytics.featuredAt,
          emailClickRate: analytics.emailAlerts > 0 ? 
            ((analytics.emailClicks / analytics.emailAlerts) * 100).toFixed(2) : 0
        }
      });
    } catch (error) {
      console.error('Failed to get job analytics:', error);
      return createErrorResponse(error);
    }
  },
  {
    requiredRoles: ['employer', 'admin'],
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true },
  }
);