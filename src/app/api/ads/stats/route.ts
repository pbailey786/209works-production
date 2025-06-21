import { NextRequest } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api-middleware';
import { adAnalyticsSchema } from '@/lib/validations/ads';
import { prisma } from '@/lib/database/prisma';
import path from "path";
import {
  generateCacheKey,
  CACHE_PREFIXES,
  DEFAULT_TTL,
  getCacheOrExecute
} from '@/lib/cache/redis';

// GET /api/ads/stats - Get comprehensive ad analytics
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { user, query, performance } = context;

    // Extract query parameters
    const { adIds, advertiserId, dateFrom, dateTo, groupBy, metrics } = query!;

    // Build where condition based on user role
    const whereCondition: any = {};

    if (user!.role === 'admin') {
      // Admins can see all analytics, optionally filtered by advertiser
      if (advertiserId) {
        whereCondition.advertiserId = advertiserId;
      }
    } else if (user!.role === 'employer') {
      // Employers can only see their own analytics
      whereCondition.advertiserId = user!.id;
    } else {
      throw new AuthorizationError(
        'Only employers and admins can access ad analytics'
      );
    }

    // Add specific ad filter if provided
    if (adIds && adIds.length > 0) {
      whereCondition.id = { in: adIds };
    }

    // Add date range filter
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }

    // Generate cache key
    const cacheKey = generateCacheKey(
      CACHE_PREFIXES.analytics,
      'ads',
      JSON.stringify(whereCondition),
      `${dateFrom || 'all'}-${dateTo || 'all'}`,
      groupBy || 'all',
      (metrics || []).path.join(',')
    );

    return getCacheOrExecute(
      cacheKey,
      async () => {
        // Get ads matching criteria
        performance.trackDatabaseQuery();
        const ads = await prisma.advertisement.findMany({
          where: whereCondition,
          select: {
            id: true,
            name: true,
            type: true,
            bidding: true,
            createdAt: true,
            // Note: employer relation might not exist, using employerId instead
          }
        });

        if (ads.length === 0) {
          return createSuccessResponse({
            summary: {},
            breakdown: [],
            insights: [],
            message: 'No ads found matching criteria'
          });
        }

        const adIds = ads.map(ad => ad.id);

        // Get analytics data based on requested metrics
        const analyticsData = await generateAnalyticsData(
          adIds,
          dateFilter,
          groupBy || 'day',
          metrics || ['impressions', 'clicks', 'conversions'],
          performance
        );

        // Generate insights and recommendations
        const insights = generateInsights(ads, analyticsData);

        // Calculate summary metrics
        const summary = calculateSummaryMetrics(analyticsData, ads);

        return createSuccessResponse({
          summary,
          breakdown: analyticsData.breakdown,
          trends: analyticsData.trends,
          insights,
          period: {
            from: dateFrom || 'All time',
            to: dateTo || 'Present',
            groupBy
          },
          queryTime: Date.now()
        });
      },
      {
        ttl: DEFAULT_TTL.medium,
        tags: [
          'analytics',
          'ads',
          user!.role === 'admin' ? 'admin' : `advertiser:${user!.id}`,
        ]
      }
    );
  },
  {
    requiredRoles: ['admin', 'employer'],
    querySchema: adAnalyticsSchema,
    rateLimit: { enabled: true, type: 'premium' },
    logging: { enabled: true },
    cors: { enabled: true }
  }
);

// Generate comprehensive analytics data
async function generateAnalyticsData(
  adIds: string[],
  dateFilter: any,
  groupBy: string,
  requestedMetrics: string[],
  performance: any
) {
  const whereCondition = {
    adId: { in: adIds },
    ...(Object.keys(dateFilter).length > 0 ? { timestamp: dateFilter } : {})
  };

  // Get raw data
  performance.trackDatabaseQuery();
  const [impressions, clicks, conversions] = await Promise.all([
    prisma.adImpression.findMany({
      where: whereCondition,
      select: {
        adId: true,
        timestamp: true,
        userId: true,
        sessionId: true,
        page: true
      }
    }),
    prisma.adClick.findMany({
      where: whereCondition,
      select: {
        adId: true,
        timestamp: true,
        userId: true,
        sessionId: true
      }
    }),
    prisma.adConversion.findMany({
      where: whereCondition,
      select: {
        adId: true,
        conversionType: true,
        createdAt: true,
        userId: true
      }
    }),
  ]);

  // Group data based on groupBy parameter
  const breakdown = groupAnalyticsData(
    { impressions, clicks, conversions },
    groupBy,
    requestedMetrics
  );

  // Generate trend data
  const trends = generateTrendData(
    { impressions, clicks, conversions },
    groupBy
  );

  return { breakdown, trends };
}

// Group analytics data by specified dimension
function groupAnalyticsData(
  data: { impressions: any[]; clicks: any[]; conversions: any[] },
  groupBy: string,
  requestedMetrics: string[]
) {
  const groups: Record<string, any> = {};

  // Initialize groups
  const getGroupKey = (item: any) => {
    switch (groupBy) {
      case 'day':
        return new Date(item.timestamp).toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(item.timestamp);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return new Date(item.timestamp).toISOString().substring(0, 7); // YYYY-MM
      case 'ad':
        return item.adId;
      case 'type':
        return item.type || 'unknown';
      default:
        return 'all';
    }
  };

  // Process impressions
  data.impressions.forEach(impression => {
    const key = getGroupKey(impression);
    if (!groups[key]) {
      groups[key] = {
        group: key,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        cost: 0,
        revenue: 0,
        uniqueUsers: new Set(),
        uniqueSessions: new Set()
      };
    }

    groups[key].impressions++;
    if (impression.userId) groups[key].uniqueUsers.add(impression.userId);
    if (impression.sessionId)
      groups[key].uniqueSessions.add(impression.sessionId);
  });

  // Process clicks
  data.clicks.forEach(click => {
    const key = getGroupKey(click);
    if (groups[key]) {
      groups[key].clicks++;
      if (click.userId) groups[key].uniqueUsers.add(click.userId);
      if (click.sessionId) groups[key].uniqueSessions.add(click.sessionId);
    }
  });

  // Process conversions
  data.conversions.forEach(conversion => {
    const key = getGroupKey(conversion);
    if (groups[key]) {
      groups[key].conversions++;
      groups[key].revenue += conversion.value || 0;
      if (conversion.userId) groups[key].uniqueUsers.add(conversion.userId);
    }
  });

  // Calculate derived metrics
  return Object.values(groups)
    .map((group: any) => {
      const uniqueUsers = group.uniqueUsers.size;
      const uniqueSessions = group.uniqueSessions.size;

      const ctr =
        group.impressions > 0 ? (group.clicks / group.impressions) * 100 : 0;
      const conversionRate =
        group.clicks > 0 ? (group.conversions / group.clicks) * 100 : 0;
      const cpc = group.clicks > 0 ? group.cost / group.clicks : 0;
      const cpm =
        group.impressions > 0 ? (group.cost / group.impressions) * 1000 : 0;
      const roas = group.cost > 0 ? (group.revenue / group.cost) * 100 : 0;

      // Filter metrics based on request
      const result: any = { group: group.group };

      if (requestedMetrics.includes('impressions'))
        result.impressions = group.impressions;
      if (requestedMetrics.includes('clicks')) result.clicks = group.clicks;
      if (requestedMetrics.includes('conversions'))
        result.conversions = group.conversions;
      if (requestedMetrics.includes('ctr'))
        result.ctr = Math.round(ctr * 100) / 100;
      if (requestedMetrics.includes('conversion_rate'))
        result.conversionRate = Math.round(conversionRate * 100) / 100;
      if (requestedMetrics.includes('cost'))
        result.cost = Math.round(group.cost * 100) / 100;
      if (requestedMetrics.includes('cpc'))
        result.cpc = Math.round(cpc * 100) / 100;
      if (requestedMetrics.includes('cpm'))
        result.cpm = Math.round(cpm * 100) / 100;
      if (requestedMetrics.includes('revenue'))
        result.revenue = Math.round(group.revenue * 100) / 100;
      if (requestedMetrics.includes('roas'))
        result.roas = Math.round(roas * 100) / 100;

      // Always include reach metrics
      result.uniqueUsers = uniqueUsers;
      result.uniqueSessions = uniqueSessions;

      return result;
    })
    .sort((a, b) => a.group.localeCompare(b.group));
}

// Generate trend data for visualization
function generateTrendData(
  data: { impressions: any[]; clicks: any[]; conversions: any[] },
  groupBy: string
) {
  // For trend data, always group by time periods
  const timeGroupBy = ['day', 'week', 'month'].includes(groupBy)
    ? groupBy
    : 'day';

  const trends = groupAnalyticsData(data, timeGroupBy, [
    'impressions',
    'clicks',
    'conversions',
    'ctr',
    'conversion_rate',
  ]);

  return trends.map(trend => ({
    period: trend.group,
    impressions: trend.impressions || 0,
    clicks: trend.clicks || 0,
    conversions: trend.conversions || 0,
    ctr: trend.ctr || 0,
    conversionRate: trend.conversionRate || 0
  }));
}

// Calculate summary metrics across all data
function calculateSummaryMetrics(analyticsData: any, ads: any[]) {
  const { breakdown } = analyticsData;

  const totalImpressions = breakdown.reduce(
    (sum: number, item: any) => sum + (item.impressions || 0),
    0
  );
  const totalClicks = breakdown.reduce(
    (sum: number, item: any) => sum + (item.clicks || 0),
    0
  );
  const totalConversions = breakdown.reduce(
    (sum: number, item: any) => sum + (item.conversions || 0),
    0
  );
  const totalCost = breakdown.reduce(
    (sum: number, item: any) => sum + (item.cost || 0),
    0
  );
  const totalRevenue = breakdown.reduce(
    (sum: number, item: any) => sum + (item.revenue || 0),
    0
  );

  const overallCtr =
    totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const overallConversionRate =
    totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const averageCpc = totalClicks > 0 ? totalCost / totalClicks : 0;
  const overallRoas = totalCost > 0 ? (totalRevenue / totalCost) * 100 : 0;

  // Get unique users/sessions across all groups
  const allUniqueUsers = new Set();
  const allUniqueSessions = new Set();

  breakdown.forEach((item: any) => {
    if (item.uniqueUsers) {
      // Note: This is an approximation since we can't easily dedupe across groups
      for (let i = 0; i < item.uniqueUsers; i++) {
        allUniqueUsers.add(`${item.group}_${i}`);
      }
    }
  });

  return {
    totalAds: ads.length,
    totalImpressions,
    totalClicks,
    totalConversions,
    totalCost: Math.round(totalCost * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    overallCtr: Math.round(overallCtr * 100) / 100,
    overallConversionRate: Math.round(overallConversionRate * 100) / 100,
    averageCpc: Math.round(averageCpc * 100) / 100,
    overallRoas: Math.round(overallRoas * 100) / 100,
    estimatedReach: allUniqueUsers.size
  };
}

// Generate insights and recommendations
function generateInsights(ads: any[], analyticsData: any): string[] {
  const insights: string[] = [];
  const { breakdown } = analyticsData;

  if (breakdown.length === 0) {
    insights.push('No performance data available for the selected period');
    return insights;
  }

  // Performance insights
  const avgCtr =
    breakdown.reduce((sum: number, item: any) => sum + (item.ctr || 0), 0) /
    breakdown.length;
  const avgConversionRate =
    breakdown.reduce(
      (sum: number, item: any) => sum + (item.conversionRate || 0),
      0
    ) / breakdown.length;

  if (avgCtr < 1) {
    insights.push(
      'Low click-through rate detected. Consider improving ad creative or targeting.'
    );
  } else if (avgCtr > 5) {
    insights.push(
      'Excellent click-through rate! Your ads are highly engaging.'
    );
  }

  if (avgConversionRate < 2) {
    insights.push(
      'Low conversion rate suggests landing page optimization opportunities.'
    );
  } else if (avgConversionRate > 10) {
    insights.push(
      'Outstanding conversion rate indicates excellent ad-to-landing page alignment.'
    );
  }

  // Budget insights
  const totalCost = breakdown.reduce(
    (sum: number, item: any) => sum + (item.cost || 0),
    0
  );
  const totalRevenue = breakdown.reduce(
    (sum: number, item: any) => sum + (item.revenue || 0),
    0
  );

  if (totalRevenue > totalCost * 3) {
    insights.push(
      'Excellent ROI! Consider increasing budget to scale successful campaigns.'
    );
  } else if (totalRevenue < totalCost) {
    insights.push(
      'Revenue is below ad spend. Review targeting and landing page performance.'
    );
  }

  // Ad type insights
  const adTypes = ads.reduce((acc: Record<string, number>, ad) => {
    acc[ad.type] = (acc[ad.type] || 0) + 1;
    return acc;
  }, {});

  const bestPerformingType = Object.entries(adTypes).sort(
    ([, a], [, b]) => (b as number) - (a as number)
  )[0];
  if (bestPerformingType) {
    insights.push(
      `${bestPerformingType[0]} ads represent your largest campaign type with ${bestPerformingType[1]} active ads.`
    );
  }

  // Trend insights
  if (breakdown.length >= 7) {
    const recent = breakdown.slice(-3);
    const previous = breakdown.slice(-6, -3);

    const recentAvgCtr =
      recent.reduce((sum: number, item: any) => sum + (item.ctr || 0), 0) /
      recent.length;
    const previousAvgCtr =
      previous.reduce((sum: number, item: any) => sum + (item.ctr || 0), 0) /
      previous.length;

    if (recentAvgCtr > previousAvgCtr * 1.2) {
      insights.push(
        'Click-through rates are trending upward - your recent optimizations are working!'
      );
    } else if (recentAvgCtr < previousAvgCtr * 0.8) {
      insights.push(
        'Click-through rates are declining. Consider refreshing ad creative or adjusting targeting.'
      );
    }
  }

  return insights;
}
