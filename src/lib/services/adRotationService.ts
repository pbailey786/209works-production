import { prisma } from '../../app/api/auth/prisma';

interface AdRotationOptions {
  placement: string;
  location?: string;
  limit: number;
  userId?: string;
  sessionId?: string;
}

interface AdPerformanceMetrics {
  id: string;
  impressions: number;
  clicks: number;
  conversions: number;
  bidAmount: number;
  ctr: number;
  conversionRate: number;
  weight: number;
}

export class AdRotationService {
  /**
   * Get ads for display with intelligent rotation
   */
  static async getAdsForDisplay(options: AdRotationOptions) {
    const { placement, location, limit, userId, sessionId } = options;

    try {
      // Build query for active ads
      const now = new Date();
      const whereClause: any = {
        status: 'active',
        schedule: {
          path: ['startDate'],
          lte: now.toISOString(),
        },
        AND: [
          {
            schedule: {
              path: ['endDate'],
              gte: now.toISOString(),
            },
          },
        ],
      };

      // Add placement filter
      if (placement !== 'all') {
        whereClause.type = placement;
      }

      // Add geographic targeting
      if (location) {
        whereClause.OR = [
          {
            targeting: {
              path: ['zipCodes'],
              array_contains: location,
            },
          },
          {
            targeting: {
              path: ['zipCodes'],
              equals: null,
            },
          },
        ];
      }

      // Fetch candidate ads
      const ads = await prisma.advertisement.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit * 5, // Get more ads for better rotation
      });

      if (ads.length === 0) {
        return [];
      }

      // Apply rotation algorithm
      const selectedAds = this.applyRotationAlgorithm(ads, limit);

      return selectedAds;
    } catch (error) {
      console.error('Error in ad rotation service:', error);
      throw error;
    }
  }

  /**
   * Advanced ad rotation algorithm
   */
  private static applyRotationAlgorithm(ads: any[], limit: number): any[] {
    if (ads.length <= limit) {
      return ads;
    }

    // Calculate performance metrics for each ad
    const adsWithMetrics = ads.map(ad => this.calculateAdMetrics(ad));

    // Apply rotation strategies
    const rotatedAds = this.weightedRandomSelection(adsWithMetrics, limit);

    return rotatedAds;
  }

  /**
   * Calculate performance metrics for an ad
   */
  private static calculateAdMetrics(ad: any): AdPerformanceMetrics {
    const impressions = ad.impressions || 0;
    const clicks = ad.clicks || 0;
    const conversions = ad.conversions || 0;
    const bidAmount = ad.bidding?.bidAmount || 0;

    // Calculate rates
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const conversionRate = clicks > 0 ? conversions / clicks : 0;

    // Calculate weight using multiple factors
    const weight = this.calculateAdWeight({
      bidAmount,
      ctr,
      conversionRate,
      impressions,
      clicks,
      conversions,
      createdAt: ad.createdAt,
    });

    return {
      id: ad.id,
      impressions,
      clicks,
      conversions,
      bidAmount,
      ctr,
      conversionRate,
      weight,
    };
  }

  /**
   * Calculate ad weight for rotation
   */
  private static calculateAdWeight(metrics: {
    bidAmount: number;
    ctr: number;
    conversionRate: number;
    impressions: number;
    clicks: number;
    conversions: number;
    createdAt: Date;
  }): number {
    const {
      bidAmount,
      ctr,
      conversionRate,
      impressions,
      clicks,
      conversions,
      createdAt,
    } = metrics;

    // Base weight from bid amount (normalized to 0-1)
    const bidWeight = Math.min(bidAmount / 100, 1); // Assuming max bid of $100

    // Performance multiplier (CTR + conversion rate)
    const performanceMultiplier = 1 + ctr * 2 + conversionRate * 3;

    // Freshness factor (newer ads get slight boost)
    const daysSinceCreated =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const freshnessFactor = Math.max(0.5, 1 - daysSinceCreated / 30); // Decay over 30 days

    // Impression fatigue (reduce weight for overexposed ads)
    const impressionFatigue = Math.max(0.1, 1 - impressions / 10000); // Reduce after 10k impressions

    // Quality score (based on engagement)
    const qualityScore =
      impressions > 0 ? Math.min(2, 1 + (clicks / impressions) * 5) : 1;

    // Final weight calculation
    const weight =
      bidWeight *
      performanceMultiplier *
      freshnessFactor *
      impressionFatigue *
      qualityScore;

    return Math.max(0.01, weight); // Minimum weight to ensure all ads have a chance
  }

  /**
   * Weighted random selection of ads
   */
  private static weightedRandomSelection(
    adsWithMetrics: AdPerformanceMetrics[],
    limit: number
  ): any[] {
    if (adsWithMetrics.length <= limit) {
      return adsWithMetrics;
    }

    // Sort by weight (descending) and take top performers
    const sortedAds = [...adsWithMetrics].sort((a, b) => b.weight - a.weight);

    // Create a pool of top performers (2x the limit)
    const topPerformers = sortedAds.slice(
      0,
      Math.min(limit * 2, sortedAds.length)
    );

    // Weighted random selection from top performers
    const selectedAds = [];
    const availableAds = [...topPerformers];

    for (let i = 0; i < limit && availableAds.length > 0; i++) {
      const totalWeight = availableAds.reduce((sum, ad) => sum + ad.weight, 0);

      if (totalWeight === 0) {
        // If no weight, select randomly
        const randomIndex = Math.floor(Math.random() * availableAds.length);
        selectedAds.push(availableAds[randomIndex]);
        availableAds.splice(randomIndex, 1);
        continue;
      }

      let random = Math.random() * totalWeight;
      let selectedIndex = 0;

      for (let j = 0; j < availableAds.length; j++) {
        random -= availableAds[j].weight;
        if (random <= 0) {
          selectedIndex = j;
          break;
        }
      }

      selectedAds.push(availableAds[selectedIndex]);
      availableAds.splice(selectedIndex, 1);
    }

    return selectedAds;
  }

  /**
   * Update ad performance metrics after impression
   */
  static async recordImpression(
    adId: string,
    metadata: {
      userId?: string;
      sessionId: string;
      page: string;
      position: string;
      userAgent: string;
      referrer: string;
      ipAddress?: string;
    }
  ) {
    try {
      // Record impression in database
      await prisma.adImpression.create({
        data: {
          adId,
          userId: metadata.userId,
          sessionId: metadata.sessionId,
          page: metadata.page,
          timestamp: new Date(),
          ipAddress: metadata.ipAddress || 'unknown',
          userAgent: metadata.userAgent || 'unknown',
        },
      });

      // Update ad impression count
      await prisma.advertisement.update({
        where: { id: adId },
        data: {
          impressions: {
            increment: 1,
          },
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error recording impression:', error);
      throw error;
    }
  }

  /**
   * Update ad performance metrics after click
   */
  static async recordClick(
    adId: string,
    metadata: {
      userId?: string;
      sessionId: string;
      targetUrl: string;
      userAgent: string;
      referrer: string;
    }
  ) {
    try {
      // Record click in database
      await prisma.adClick.create({
        data: {
          adId,
          userId: metadata.userId,
          sessionId: metadata.sessionId,
          targetUrl: metadata.targetUrl,
          userAgent: metadata.userAgent,
          referrer: metadata.referrer,
          timestamp: new Date(),
        },
      });

      // Update ad click count
      await prisma.advertisement.update({
        where: { id: adId },
        data: {
          clicks: {
            increment: 1,
          },
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error recording click:', error);
      throw error;
    }
  }

  /**
   * Get ad performance analytics
   */
  static async getAdAnalytics(
    adId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    try {
      const whereClause: any = { adId };

      if (dateRange) {
        whereClause.timestamp = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      const [impressions, clicks, conversions] = await Promise.all([
        prisma.adImpression.count({ where: whereClause }),
        prisma.adClick.count({ where: whereClause }),
        prisma.adConversion.count({ where: whereClause }),
      ]);

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

      return {
        impressions,
        clicks,
        conversions,
        ctr: Math.round(ctr * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting ad analytics:', error);
      throw error;
    }
  }
}
