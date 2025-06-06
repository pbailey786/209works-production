/**
 * Instagram Analytics Service
 * Handles fetching, storing, and analyzing Instagram post performance data
 */

import { prisma } from '@/lib/database/prisma';
import { InstagramAPI, InstagramInsightsResponse } from './instagram-api';
import { InstagramAlertType } from '@prisma/client';

export interface AnalyticsData {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  profileVisits: number;
  websiteClicks: number;
  engagementRate: number;
  clickThroughRate: number;
}

export interface AccountMetricsData {
  followersCount: number;
  followingCount: number;
  mediaCount: number;
  impressions: number;
  reach: number;
  profileViews: number;
  websiteClicks: number;
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  postType?: string;
  jobId?: string;
}

export interface PerformanceInsights {
  totalPosts: number;
  totalImpressions: number;
  totalReach: number;
  totalEngagements: number;
  averageEngagementRate: number;
  bestPerformingPost: {
    id: string;
    caption: string;
    engagementRate: number;
    impressions: number;
  } | null;
  worstPerformingPost: {
    id: string;
    caption: string;
    engagementRate: number;
    impressions: number;
  } | null;
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
  topHashtags: Array<{
    hashtag: string;
    count: number;
    avgEngagementRate: number;
  }>;
}

export class InstagramAnalyticsService {
  private instagramAPI: InstagramAPI;

  constructor() {
    this.instagramAPI = new InstagramAPI();
  }

  /**
   * Fetch and store analytics for a specific post
   */
  async fetchPostAnalytics(
    postId: string,
    mediaId: string,
    accessToken: string
  ): Promise<AnalyticsData> {
    try {
      // Fetch insights from Instagram API
      const insights = await this.instagramAPI.getMediaInsights(
        mediaId,
        accessToken,
        [
          'impressions',
          'reach',
          'likes',
          'comments',
          'shares',
          'saves',
          'profile_visits',
          'website_clicks',
        ]
      );

      // Parse insights data
      const analyticsData = this.parseInsightsData(insights);

      // Store in database
      await this.storePostAnalytics(postId, analyticsData);

      return analyticsData;
    } catch (error) {
      console.error('Error fetching post analytics:', error);
      throw new Error(`Failed to fetch analytics for post ${postId}: ${error}`);
    }
  }

  /**
   * Fetch and store account-level metrics
   */
  async fetchAccountMetrics(
    accountId: string,
    accessToken: string,
    date: Date = new Date()
  ): Promise<AccountMetricsData> {
    try {
      // Fetch account info
      const accountInfo = await this.instagramAPI.getAccountInfo(
        accountId,
        accessToken
      );

      // Fetch account insights
      const insights = await this.instagramAPI.getAccountInsights(
        accountId,
        accessToken,
        'day',
        ['impressions', 'reach', 'profile_views', 'website_clicks']
      );

      const metricsData: AccountMetricsData = {
        followersCount: accountInfo.followers_count || 0,
        followingCount: accountInfo.follows_count || 0,
        mediaCount: accountInfo.media_count || 0,
        impressions: this.extractMetricValue(insights, 'impressions'),
        reach: this.extractMetricValue(insights, 'reach'),
        profileViews: this.extractMetricValue(insights, 'profile_views'),
        websiteClicks: this.extractMetricValue(insights, 'website_clicks'),
      };

      // Store in database
      await this.storeAccountMetrics(accountId, metricsData, date);

      return metricsData;
    } catch (error) {
      console.error('Error fetching account metrics:', error);
      throw new Error(`Failed to fetch account metrics: ${error}`);
    }
  }

  /**
   * Get analytics for multiple posts with filters
   */
  async getPostsAnalytics(filters: AnalyticsFilters = {}) {
    const whereClause: any = {};

    if (filters.startDate || filters.endDate) {
      whereClause.recordedAt = {};
      if (filters.startDate) whereClause.recordedAt.gte = filters.startDate;
      if (filters.endDate) whereClause.recordedAt.lte = filters.endDate;
    }

    if (filters.postType) {
      whereClause.post = {
        type: filters.postType,
      };
    }

    if (filters.jobId) {
      whereClause.post = {
        ...whereClause.post,
        jobId: filters.jobId,
      };
    }

    return await prisma.instagramAnalytics.findMany({
      where: whereClause,
      include: {
        post: {
          include: {
            job: true,
          },
        },
      },
      orderBy: {
        recordedAt: 'desc',
      },
    });
  }

  /**
   * Get performance insights and trends
   */
  async getPerformanceInsights(
    filters: AnalyticsFilters = {}
  ): Promise<PerformanceInsights> {
    const analytics = await this.getPostsAnalytics(filters);

    if (analytics.length === 0) {
      return {
        totalPosts: 0,
        totalImpressions: 0,
        totalReach: 0,
        totalEngagements: 0,
        averageEngagementRate: 0,
        bestPerformingPost: null,
        worstPerformingPost: null,
        engagementTrend: 'stable',
        topHashtags: [],
      };
    }

    const totalPosts = analytics.length;
    const totalImpressions = analytics.reduce(
      (sum, a) => sum + a.impressions,
      0
    );
    const totalReach = analytics.reduce((sum, a) => sum + a.reach, 0);
    const totalEngagements = analytics.reduce(
      (sum, a) => sum + a.likes + a.comments + a.shares + a.saves,
      0
    );
    const averageEngagementRate =
      analytics.reduce((sum, a) => sum + a.engagementRate, 0) / totalPosts;

    // Find best and worst performing posts
    const sortedByEngagement = [...analytics].sort(
      (a, b) => b.engagementRate - a.engagementRate
    );
    const bestPerformingPost = sortedByEngagement[0]
      ? {
          id: sortedByEngagement[0].postId,
          caption: sortedByEngagement[0].post.caption.substring(0, 100) + '...',
          engagementRate: sortedByEngagement[0].engagementRate,
          impressions: sortedByEngagement[0].impressions,
        }
      : null;

    const worstPerformingPost = sortedByEngagement[
      sortedByEngagement.length - 1
    ]
      ? {
          id: sortedByEngagement[sortedByEngagement.length - 1].postId,
          caption:
            sortedByEngagement[
              sortedByEngagement.length - 1
            ].post.caption.substring(0, 100) + '...',
          engagementRate:
            sortedByEngagement[sortedByEngagement.length - 1].engagementRate,
          impressions:
            sortedByEngagement[sortedByEngagement.length - 1].impressions,
        }
      : null;

    // Calculate engagement trend
    const engagementTrend = this.calculateEngagementTrend(analytics);

    // Analyze hashtags
    const topHashtags = this.analyzeHashtags(analytics);

    return {
      totalPosts,
      totalImpressions,
      totalReach,
      totalEngagements,
      averageEngagementRate,
      bestPerformingPost,
      worstPerformingPost,
      engagementTrend,
      topHashtags,
    };
  }

  /**
   * Create engagement alert
   */
  async createEngagementAlert(
    userId: string,
    alertType: InstagramAlertType,
    threshold: number,
    comparison: 'above' | 'below' | 'equal' = 'below',
    emailNotification: boolean = true,
    frequency: string = 'immediate'
  ) {
    return await prisma.instagramEngagementAlert.create({
      data: {
        userId,
        alertType,
        threshold,
        comparison,
        emailNotification,
        frequency,
        isActive: true,
      },
    });
  }

  /**
   * Check and trigger engagement alerts
   */
  async checkEngagementAlerts(postId: string) {
    const analytics = await prisma.instagramAnalytics.findFirst({
      where: { postId },
      include: {
        post: {
          include: {
            job: true,
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });

    if (!analytics) return;

    const alerts = await prisma.instagramEngagementAlert.findMany({
      where: { isActive: true },
      include: { user: true },
    });

    for (const alert of alerts) {
      const shouldTrigger = this.shouldTriggerAlert(alert, analytics);

      if (shouldTrigger) {
        await this.triggerAlert(alert, analytics);
      }
    }
  }

  /**
   * Get account metrics history
   */
  async getAccountMetricsHistory(
    accountId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await prisma.instagramAccountMetrics.findMany({
      where: {
        accountId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  /**
   * Parse insights data from Instagram API response
   */
  private parseInsightsData(
    insights: InstagramInsightsResponse
  ): AnalyticsData {
    const data: AnalyticsData = {
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      profileVisits: 0,
      websiteClicks: 0,
      engagementRate: 0,
      clickThroughRate: 0,
    };

    insights.data.forEach(metric => {
      const value = metric.values[0]?.value || 0;

      switch (metric.name) {
        case 'impressions':
          data.impressions = value;
          break;
        case 'reach':
          data.reach = value;
          break;
        case 'likes':
          data.likes = value;
          break;
        case 'comments':
          data.comments = value;
          break;
        case 'shares':
          data.shares = value;
          break;
        case 'saves':
          data.saves = value;
          break;
        case 'profile_visits':
          data.profileVisits = value;
          break;
        case 'website_clicks':
          data.websiteClicks = value;
          break;
      }
    });

    // Calculate engagement rate
    const totalEngagements =
      data.likes + data.comments + data.shares + data.saves;
    data.engagementRate =
      data.impressions > 0 ? (totalEngagements / data.impressions) * 100 : 0;

    // Calculate click-through rate
    data.clickThroughRate =
      data.impressions > 0 ? (data.websiteClicks / data.impressions) * 100 : 0;

    return data;
  }

  /**
   * Extract metric value from insights response
   */
  private extractMetricValue(
    insights: InstagramInsightsResponse,
    metricName: string
  ): number {
    const metric = insights.data.find(m => m.name === metricName);
    return metric?.values[0]?.value || 0;
  }

  /**
   * Store post analytics in database
   */
  private async storePostAnalytics(postId: string, data: AnalyticsData) {
    await prisma.instagramAnalytics.create({
      data: {
        postId,
        ...data,
      },
    });
  }

  /**
   * Store account metrics in database
   */
  private async storeAccountMetrics(
    accountId: string,
    data: AccountMetricsData,
    date: Date
  ) {
    await prisma.instagramAccountMetrics.upsert({
      where: {
        accountId_date: {
          accountId,
          date,
        },
      },
      update: data,
      create: {
        accountId,
        date,
        ...data,
      },
    });
  }

  /**
   * Calculate engagement trend
   */
  private calculateEngagementTrend(
    analytics: any[]
  ): 'increasing' | 'decreasing' | 'stable' {
    if (analytics.length < 2) return 'stable';

    const sortedByDate = analytics.sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    const firstHalf = sortedByDate.slice(
      0,
      Math.floor(sortedByDate.length / 2)
    );
    const secondHalf = sortedByDate.slice(Math.floor(sortedByDate.length / 2));

    const firstHalfAvg =
      firstHalf.reduce((sum, a) => sum + a.engagementRate, 0) /
      firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, a) => sum + a.engagementRate, 0) /
      secondHalf.length;

    const difference = secondHalfAvg - firstHalfAvg;
    const threshold = 0.5; // 0.5% threshold

    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * Analyze hashtags performance
   */
  private analyzeHashtags(analytics: any[]) {
    const hashtagStats: {
      [key: string]: { count: number; totalEngagement: number };
    } = {};

    analytics.forEach(analytic => {
      const hashtags = analytic.post.hashtags || [];
      hashtags.forEach((hashtag: string) => {
        if (!hashtagStats[hashtag]) {
          hashtagStats[hashtag] = { count: 0, totalEngagement: 0 };
        }
        hashtagStats[hashtag].count++;
        hashtagStats[hashtag].totalEngagement += analytic.engagementRate;
      });
    });

    return Object.entries(hashtagStats)
      .map(([hashtag, stats]) => ({
        hashtag,
        count: stats.count,
        avgEngagementRate: stats.totalEngagement / stats.count,
      }))
      .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)
      .slice(0, 10); // Top 10 hashtags
  }

  /**
   * Check if alert should be triggered
   */
  private shouldTriggerAlert(alert: any, analytics: any): boolean {
    let value = 0;

    switch (alert.alertType) {
      case 'engagement_rate_drop':
      case 'engagement_rate_spike':
        value = analytics.engagementRate;
        break;
      case 'post_performance_low':
      case 'post_performance_high':
        value = analytics.impressions;
        break;
      case 'reach_decline':
        value = analytics.reach;
        break;
      case 'impressions_decline':
        value = analytics.impressions;
        break;
      default:
        return false;
    }

    switch (alert.comparison) {
      case 'above':
        return value > alert.threshold;
      case 'below':
        return value < alert.threshold;
      case 'equal':
        return Math.abs(value - alert.threshold) < 0.01;
      default:
        return false;
    }
  }

  /**
   * Trigger alert notification
   */
  private async triggerAlert(alert: any, analytics: any) {
    // Update alert trigger count and last triggered
    await prisma.instagramEngagementAlert.update({
      where: { id: alert.id },
      data: {
        lastTriggered: new Date(),
        triggerCount: alert.triggerCount + 1,
      },
    });

    // TODO: Send email notification if enabled
    if (alert.emailNotification) {
      console.log(
        `Alert triggered for user ${alert.userId}: ${alert.alertType}`
      );
      // Implement email notification logic here
    }
  }
}

export default InstagramAnalyticsService;
