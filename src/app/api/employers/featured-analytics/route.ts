import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/components/ui/card';
import { createSuccessResponse, createErrorResponse } from '@/components/ui/card';
import { FeaturedJobAnalyticsService } from '@/lib/services/featured-job-analytics';


export const GET = withAPIMiddleware(
  async (req, context) => {
    const { user } = context;
    const employerId = user!.id;

    try {
      // Get summary analytics for this employer
      const summary = await FeaturedJobAnalyticsService.getFeaturedJobsSummary(employerId);
      
      // Get detailed analytics for all featured jobs
      const detailedAnalytics = await FeaturedJobAnalyticsService.getEmployerFeaturedAnalytics(employerId);
      
      // Get top performing jobs
      const topByImpressions = await FeaturedJobAnalyticsService.getTopPerformingFeaturedJobs(
        employerId, 
        5, 
        'impressions'
      );
      
      const topByClicks = await FeaturedJobAnalyticsService.getTopPerformingFeaturedJobs(
        employerId, 
        5, 
        'clicks'
      );
      
      const topByConversion = await FeaturedJobAnalyticsService.getTopPerformingFeaturedJobs(
        employerId, 
        5, 
        'conversionRate'
      );

      return createSuccessResponse({
        summary,
        analytics: detailedAnalytics,
        topPerforming: {
          byImpressions: topByImpressions,
          byClicks: topByClicks,
          byConversionRate: topByConversion.filter(job => job.conversionRate && job.conversionRate.toNumber() > 0)
        },
        insights: {
          totalFeaturedJobs: summary.totalJobs,
          averageImpressionsPerJob: summary.totalJobs > 0 ? 
            Math.round(summary.totalImpressions / summary.totalJobs) : 0,
          averageClicksPerJob: summary.totalJobs > 0 ? 
            Math.round(summary.totalClicks / summary.totalJobs) : 0,
          performanceGrade: summary.avgConversionRate >= 10 ? 'Excellent' :
                          summary.avgConversionRate >= 5 ? 'Good' :
                          summary.avgConversionRate >= 2 ? 'Fair' : 'Needs Improvement'
        }
      });
    } catch (error) {
      console.error('Failed to get employer featured analytics:', error);
      return createErrorResponse(error);
    }
  },
  {
    requiredRoles: ['employer', 'admin'],
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true },
  }
);