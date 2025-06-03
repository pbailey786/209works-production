import { NextRequest } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api';
import { createSuccessResponse, NotFoundError } from '@/lib/errors/api-errors';
import { prisma } from '../../../auth/prisma';

// GET /api/ads/:id/analytics - Get advertisement analytics
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { user, params, query } = context;
    const adId = params.id;
    const range = query?.range || '7d';

    // Verify ad exists and user has permission
    const ad = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        ...(user!.role === 'employer' ? { businessName: user!.name } : {}),
      },
    });

    if (!ad) {
      throw new NotFoundError('Advertisement not found');
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Mock analytics data - replace with real analytics queries
    const mockAnalytics = {
      ad: {
        id: ad.id,
        title: ad.title,
        businessName: ad.businessName,
        imageUrl: ad.imageUrl,
        targetUrl: ad.targetUrl,
        zipCodes: ad.zipCodes,
        startDate: ad.startDate.toISOString(),
        endDate: ad.endDate.toISOString(),
        status: getAdStatus(ad.startDate, ad.endDate),
        budget: 1000, // Mock budget
        spent: 450, // Mock spent amount
      },
      metrics: {
        impressions: Math.floor(Math.random() * 10000) + 1000,
        clicks: Math.floor(Math.random() * 500) + 50,
        conversions: Math.floor(Math.random() * 25) + 5,
        ctr: 0,
        conversionRate: 0,
        costPerClick: 0,
        costPerConversion: 0,
        revenue: Math.floor(Math.random() * 2000) + 500,
        roi: 0,
      },
      dailyMetrics: generateDailyMetrics(startDate, now),
      demographics: {
        ageGroups: [
          { range: '18-24', percentage: 15 },
          { range: '25-34', percentage: 35 },
          { range: '35-44', percentage: 25 },
          { range: '45-54', percentage: 15 },
          { range: '55+', percentage: 10 },
        ],
        locations: [
          { location: 'San Francisco, CA', clicks: 150, percentage: 30 },
          { location: 'Los Angeles, CA', clicks: 100, percentage: 20 },
          { location: 'San Diego, CA', clicks: 75, percentage: 15 },
          { location: 'Sacramento, CA', clicks: 50, percentage: 10 },
          { location: 'Other', clicks: 125, percentage: 25 },
        ],
        devices: [
          { device: 'Desktop', percentage: 45 },
          { device: 'Mobile', percentage: 40 },
          { device: 'Tablet', percentage: 15 },
        ],
      },
      performance: {
        trend: Math.random() > 0.5 ? 'up' : ('down' as 'up' | 'down'),
        changePercent: Math.floor(Math.random() * 20) + 5,
        bestPerformingDay: 'Monday',
        recommendations: [
          'Consider increasing your bid amount to improve ad visibility',
          'Your ad performs best on weekdays - consider adjusting your schedule',
          'Mobile users show higher engagement - optimize for mobile experience',
          'Try A/B testing different ad copy to improve click-through rates',
        ],
      },
    };

    // Calculate derived metrics
    mockAnalytics.metrics.ctr =
      mockAnalytics.metrics.impressions > 0
        ? (mockAnalytics.metrics.clicks / mockAnalytics.metrics.impressions) *
          100
        : 0;

    mockAnalytics.metrics.conversionRate =
      mockAnalytics.metrics.clicks > 0
        ? (mockAnalytics.metrics.conversions / mockAnalytics.metrics.clicks) *
          100
        : 0;

    mockAnalytics.metrics.costPerClick =
      mockAnalytics.metrics.clicks > 0
        ? mockAnalytics.ad.spent / mockAnalytics.metrics.clicks
        : 0;

    mockAnalytics.metrics.costPerConversion =
      mockAnalytics.metrics.conversions > 0
        ? mockAnalytics.ad.spent / mockAnalytics.metrics.conversions
        : 0;

    mockAnalytics.metrics.roi =
      mockAnalytics.ad.spent > 0
        ? ((mockAnalytics.metrics.revenue - mockAnalytics.ad.spent) /
            mockAnalytics.ad.spent) *
          100
        : 0;

    return createSuccessResponse({
      data: mockAnalytics,
      range,
      generatedAt: new Date().toISOString(),
    });
  },
  {
    requiredRoles: ['admin', 'employer'],
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

function getAdStatus(startDate: Date, endDate: Date): string {
  const now = new Date();

  if (startDate > now) {
    return 'scheduled';
  } else if (endDate < now) {
    return 'expired';
  } else {
    return 'active';
  }
}

function generateDailyMetrics(startDate: Date, endDate: Date) {
  const metrics = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const impressions = Math.floor(Math.random() * 500) + 100;
    const clicks = Math.floor(impressions * (Math.random() * 0.1 + 0.02)); // 2-12% CTR
    const conversions = Math.floor(clicks * (Math.random() * 0.15 + 0.05)); // 5-20% conversion rate
    const spend = clicks * (Math.random() * 2 + 0.5); // $0.50-$2.50 per click

    metrics.push({
      date: currentDate.toISOString().split('T')[0],
      impressions,
      clicks,
      conversions,
      spend: Math.round(spend * 100) / 100,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return metrics;
}
