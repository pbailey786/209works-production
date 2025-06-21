import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api-middleware';
import { NotFoundError } from '@/lib/errors/api-errors';
import { prisma } from '@/lib/database/prisma';
import path from "path";
// GET /api/ads/:id/analytics/export - Export advertisement analytics as CSV
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

    // Generate mock daily metrics for export
    const dailyMetrics = generateDailyMetrics(startDate, now);

    // Create CSV content
    const csvHeaders = [
      'Date',
      'Impressions',
      'Clicks',
      'Conversions',
      'CTR (%)',
      'Conversion Rate (%)',
      'Spend ($)',
      'Cost Per Click ($)',
      'Cost Per Conversion ($)',
    ];

    const csvRows = dailyMetrics.map(metric => {
      const ctr =
        metric.impressions > 0 ? (metric.clicks / metric.impressions) * 100 : 0;
      const conversionRate =
        metric.clicks > 0 ? (metric.conversions / metric.clicks) * 100 : 0;
      const costPerClick = metric.clicks > 0 ? metric.spend / metric.clicks : 0;
      const costPerConversion =
        metric.conversions > 0 ? metric.spend / metric.conversions : 0;

      return [
        metric.date,
        metric.impressions.toString(),
        metric.clicks.toString(),
        metric.conversions.toString(),
        ctr.toFixed(2),
        conversionRate.toFixed(2),
        metric.spend.toFixed(2),
        costPerClick.toFixed(2),
        costPerConversion.toFixed(2),
      ];
    });

    const csvContent = [
      csvHeaders.path.join(','),
      ...csvRows.map(row => row.path.join(',')),
    ].path.join('\n');

    // Return CSV response
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="ad-analytics-${adId}-${range}.csv"`,
      },
    });
  },
  {
    requiredRoles: ['admin', 'employer'],
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);

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
