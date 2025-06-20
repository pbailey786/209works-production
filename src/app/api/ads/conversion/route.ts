import { NextRequest } from '@/components/ui/card';
import { withAPIMiddleware } from '@/components/ui/card';
import { adConversionSchema } from '@/components/ui/card';
import { createSuccessResponse, NotFoundError } from '@/components/ui/card';
import { headers } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

// POST /api/ads/conversion - Track ad conversion
export const POST = withAPIMiddleware(
  async (req, context) => {
    const { body, performance } = context;

    if (!body) {
      throw new Error('Request body is required');
    }

    // Verify the ad exists
    performance.trackDatabaseQuery();
    const ad = await prisma.advertisement.findFirst({
      where: {
        id: body.adId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        bidding: true,
        // Note: advertiser relation not available in current schema
        employerId: true,
      },
    });

    if (!ad) {
      throw new NotFoundError('Advertisement not found');
    }

    // Verify click exists if clickId provided
    let click = null;
    if (body.clickId) {
      performance.trackDatabaseQuery();
      click = await prisma.adClick.findFirst({
        where: {
          id: body.clickId,
          adId: body.adId,
        },
        select: {
          id: true,
          userId: true,
          sessionId: true,
          timestamp: true,
        },
      });

      if (!click) {
        throw new NotFoundError('Related click not found');
      }

      // Check if conversion happened within reasonable timeframe (24 hours)
      const clickTime = new Date(click.timestamp);
      const conversionTime = new Date(body.timestamp || Date.now());
      const timeDiff = conversionTime.getTime() - clickTime.getTime();
      const maxConversionWindow = 24 * 60 * 60 * 1000; // 24 hours

      if (timeDiff > maxConversionWindow) {
        // Still track but mark as late conversion
        body.customEvent = 'late_conversion';
      }
    }

    // Prevent duplicate conversions from the same user/session
    const duplicateWindow = 60 * 1000; // 1 minute
    const now = new Date();

    const recentConversion = await prisma.adConversion.findFirst({
      where: {
        adId: body.adId,
        conversionType: body.type,
        ...(body.userId
          ? { userId: body.userId }
          : {
              // If no userId, use a longer window for anonymous users
              createdAt: { gte: new Date(now.getTime() - 5 * 60 * 1000) }, // 5 minutes for anonymous
            }),
        createdAt: {
          gte: new Date(now.getTime() - duplicateWindow),
        },
      },
    });

    if (recentConversion) {
      return createSuccessResponse({
        message: 'Conversion already recorded recently',
        duplicate: true,
        conversionId: recentConversion.id,
      });
    }

    // Create the conversion record
    performance.trackDatabaseQuery();
    const conversion = await prisma.adConversion.create({
      data: {
        adId: body.adId,
        userId: body.userId || click?.userId || null,
        sessionId: click?.sessionId || 'anonymous',
        conversionType: body.type,
        conversionValue: body.value || 0,
        metadata: body.customEvent
          ? { customEvent: body.customEvent }
          : undefined,
      },
      select: {
        id: true,
        conversionType: true,
        conversionValue: true,
        createdAt: true,
      },
    });

    // Update ad conversion count
    await prisma.advertisement.update({
      where: { id: body.adId },
      data: {
        updatedAt: new Date(),
      },
    });

    // Calculate conversion metrics
    const [totalImpressions, totalClicks, totalConversions] = await Promise.all(
      [
        prisma.adImpression.count({ where: { adId: body.adId } }),
        prisma.adClick.count({ where: { adId: body.adId } }),
        prisma.adConversion.count({ where: { adId: body.adId } }),
      ]
    );

    const ctr =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate =
      totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    // Calculate ROI if value provided
    let roi = null;
    if (body.value && body.value > 0) {
      // Estimate total spend
      let estimatedSpend = 0;
      const bidding = ad.bidding as any;
      if (bidding?.type === 'cpc') {
        estimatedSpend = totalClicks * (bidding.bidAmount || 0);
      } else if (bidding?.type === 'cpm') {
        estimatedSpend = (totalImpressions / 1000) * (bidding.bidAmount || 0);
      }

      if (estimatedSpend > 0) {
        roi = ((body.value - estimatedSpend) / estimatedSpend) * 100;
      }
    }

    // Get conversion funnel data
    const funnelData = await calculateConversionFunnel(body.adId, performance);

    return createSuccessResponse({
      conversionId: conversion.id,
      type: conversion.conversionType,
      value: conversion.conversionValue,
      timestamp: conversion.createdAt,
      ad: {
        id: ad.id,
        name: ad.name,
        type: ad.type,
        employerId: ad.employerId,
      },
      metrics: {
        ctr: Math.round(ctr * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalImpressions,
        totalClicks,
        totalConversions,
        roi: roi ? Math.round(roi * 100) / 100 : null,
      },
      funnel: funnelData,
      message: 'Conversion tracked successfully',
    });
  },
  {
    bodySchema: adConversionSchema,
    rateLimit: {
      enabled: true,
      type: 'general',
    },
    logging: { enabled: true },
    cors: { enabled: true },
    // No auth required for conversion tracking
  }
);

// Helper function to calculate conversion funnel
async function calculateConversionFunnel(adId: string, performance: any) {
  // Get conversion breakdown by type
  performance.trackDatabaseQuery();
  const conversionsByType = await prisma.adConversion.groupBy({
    by: ['conversionType'],
    where: { adId },
    _count: {
      conversionType: true,
    },
    _sum: {
      conversionValue: true,
    },
  });

  // Get time-based conversion data (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  performance.trackDatabaseQuery();
  const recentConversions = await prisma.adConversion.findMany({
    where: {
      adId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      conversionType: true,
      conversionValue: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50, // Limit recent conversions
  });

  return {
    byType: conversionsByType.map(item => ({
      type: item.conversionType,
      count: item._count.conversionType,
      totalValue: Number(item._sum.conversionValue || 0),
      averageValue:
        item._count.conversionType > 0
          ? Number(item._sum.conversionValue || 0) / item._count.conversionType
          : 0,
    })),
    recent: recentConversions,
    timeline: generateConversionTimeline(recentConversions),
  };
}

// Generate conversion timeline for analytics
function generateConversionTimeline(conversions: any[]) {
  const timeline: Record<string, { count: number; value: number }> = {};

  conversions.forEach(conversion => {
    const date = new Date(conversion.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD

    if (!timeline[date]) {
      timeline[date] = { count: 0, value: 0 };
    }

    timeline[date].count++;
    timeline[date].value += Number(conversion.conversionValue || 0);
  });

  // Convert to array and sort by date
  return Object.entries(timeline)
    .map(([date, data]) => ({
      date,
      count: data.count,
      value: data.value,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
