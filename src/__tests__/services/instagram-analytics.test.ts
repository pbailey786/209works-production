/**
 * Instagram Analytics Service Tests
 * Tests for the Instagram analytics functionality
 */

import { InstagramAnalyticsService } from '@/lib/services/instagram-analytics';
import { InstagramAPI } from '@/lib/services/instagram-api';
import { prisma } from '@/lib/database/prisma';

// Mock dependencies
jest.mock('@/lib/database/prisma', () => ({
  prisma: {
    instagramAnalytics: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    instagramAccountMetrics: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    instagramEngagementAlert: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/services/instagram-api');

describe('InstagramAnalyticsService', () => {
  let service: InstagramAnalyticsService;
  let mockInstagramAPI: jest.Mocked<InstagramAPI>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstagramAnalyticsService();
    mockInstagramAPI = new InstagramAPI() as jest.Mocked<InstagramAPI>;
    (service as any).instagramAPI = mockInstagramAPI;
  });

  describe('fetchPostAnalytics', () => {
    it('should fetch and store post analytics successfully', async () => {
      const mockInsights = {
        data: [
          {
            name: 'impressions',
            period: 'lifetime',
            values: [{ value: 1000, end_time: '2024-01-01T00:00:00Z' }],
            title: 'Impressions',
            description: 'Total impressions',
            id: 'impressions_metric',
          },
          {
            name: 'reach',
            period: 'lifetime',
            values: [{ value: 800, end_time: '2024-01-01T00:00:00Z' }],
            title: 'Reach',
            description: 'Total reach',
            id: 'reach_metric',
          },
          {
            name: 'likes',
            period: 'lifetime',
            values: [{ value: 50, end_time: '2024-01-01T00:00:00Z' }],
            title: 'Likes',
            description: 'Total likes',
            id: 'likes_metric',
          },
          {
            name: 'comments',
            period: 'lifetime',
            values: [{ value: 10, end_time: '2024-01-01T00:00:00Z' }],
            title: 'Comments',
            description: 'Total comments',
            id: 'comments_metric',
          },
          {
            name: 'shares',
            period: 'lifetime',
            values: [{ value: 5, end_time: '2024-01-01T00:00:00Z' }],
            title: 'Shares',
            description: 'Total shares',
            id: 'shares_metric',
          },
          {
            name: 'saves',
            period: 'lifetime',
            values: [{ value: 15, end_time: '2024-01-01T00:00:00Z' }],
            title: 'Saves',
            description: 'Total saves',
            id: 'saves_metric',
          },
          {
            name: 'profile_visits',
            period: 'lifetime',
            values: [{ value: 25, end_time: '2024-01-01T00:00:00Z' }],
            title: 'Profile Visits',
            description: 'Total profile visits',
            id: 'profile_visits_metric',
          },
          {
            name: 'website_clicks',
            period: 'lifetime',
            values: [{ value: 8, end_time: '2024-01-01T00:00:00Z' }],
            title: 'Website Clicks',
            description: 'Total website clicks',
            id: 'website_clicks_metric',
          },
        ],
      };

      mockInstagramAPI.getMediaInsights.mockResolvedValue(mockInsights);
      (prisma.instagramAnalytics.create as jest.Mock).mockResolvedValue({});

      const result = await service.fetchPostAnalytics(
        'post123',
        'media456',
        'token789'
      );

      expect(mockInstagramAPI.getMediaInsights).toHaveBeenCalledWith(
        'media456',
        'token789',
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

      expect(result).toEqual({
        impressions: 1000,
        reach: 800,
        likes: 50,
        comments: 10,
        shares: 5,
        saves: 15,
        profileVisits: 25,
        websiteClicks: 8,
        engagementRate: 8, // (50+10+5+15)/1000 * 100
        clickThroughRate: 0.8, // 8/1000 * 100
      });

      expect(prisma.instagramAnalytics.create).toHaveBeenCalledWith({
        data: {
          postId: 'post123',
          impressions: 1000,
          reach: 800,
          likes: 50,
          comments: 10,
          shares: 5,
          saves: 15,
          profileVisits: 25,
          websiteClicks: 8,
          engagementRate: 8,
          clickThroughRate: 0.8,
        },
      });
    });

    it('should handle API errors gracefully', async () => {
      mockInstagramAPI.getMediaInsights.mockRejectedValue(
        new Error('API Error')
      );

      await expect(
        service.fetchPostAnalytics('post123', 'media456', 'token789')
      ).rejects.toThrow(
        'Failed to fetch analytics for post post123: Error: API Error'
      );
    });

    it('should handle missing metrics gracefully', async () => {
      const mockInsights = {
        data: [
          {
            name: 'impressions',
            period: 'lifetime',
            values: [{ value: 1000, end_time: '2024-01-01T00:00:00Z' }],
            title: 'Impressions',
            description: 'Total impressions',
            id: 'impressions_metric',
          },
          // Missing other metrics
        ],
      };

      mockInstagramAPI.getMediaInsights.mockResolvedValue(mockInsights);
      (prisma.instagramAnalytics.create as jest.Mock).mockResolvedValue({});

      const result = await service.fetchPostAnalytics(
        'post123',
        'media456',
        'token789'
      );

      expect(result).toEqual({
        impressions: 1000,
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        profileVisits: 0,
        websiteClicks: 0,
        engagementRate: 0,
        clickThroughRate: 0,
      });
    });
  });

  describe('fetchAccountMetrics', () => {
    it('should fetch and store account metrics successfully', async () => {
      const mockAccountInfo = {
        id: 'account123',
        username: 'test_account',
        name: 'Test Account',
        followers_count: 5000,
        follows_count: 1000,
        media_count: 250,
      };

      const mockInsights = {
        data: [
          {
            name: 'impressions',
            period: 'day',
            values: [{ value: 10000, end_time: '2024-01-01T00:00:00Z' }],
            title: 'Impressions',
            description: 'Daily impressions',
            id: 'impressions_metric',
          },
          {
            name: 'reach',
            period: 'day',
            values: [{ value: 8000, end_time: '2024-01-01T00:00:00Z' }],
            title: 'Reach',
            description: 'Daily reach',
            id: 'reach_metric',
          },
          {
            name: 'profile_views',
            period: 'day',
            values: [{ value: 500, end_time: '2024-01-01T00:00:00Z' }],
            title: 'Profile Views',
            description: 'Daily profile views',
            id: 'profile_views_metric',
          },
          {
            name: 'website_clicks',
            period: 'day',
            values: [{ value: 100, end_time: '2024-01-01T00:00:00Z' }],
            title: 'Website Clicks',
            description: 'Daily website clicks',
            id: 'website_clicks_metric',
          },
        ],
      };

      mockInstagramAPI.getAccountInfo.mockResolvedValue(mockAccountInfo);
      mockInstagramAPI.getAccountInsights.mockResolvedValue(mockInsights);
      (prisma.instagramAccountMetrics.upsert as jest.Mock).mockResolvedValue(
        {}
      );

      const result = await service.fetchAccountMetrics(
        'account123',
        'token789'
      );

      expect(result).toEqual({
        followersCount: 5000,
        followingCount: 1000,
        mediaCount: 250,
        impressions: 10000,
        reach: 8000,
        profileViews: 500,
        websiteClicks: 100,
      });
    });
  });

  describe('getPostsAnalytics', () => {
    it('should retrieve analytics with filters', async () => {
      const mockAnalytics = [
        {
          id: '1',
          postId: 'post1',
          impressions: 1000,
          reach: 800,
          likes: 50,
          comments: 10,
          shares: 5,
          saves: 15,
          profileVisits: 25,
          websiteClicks: 8,
          engagementRate: 8,
          clickThroughRate: 0.8,
          recordedAt: new Date(),
          post: {
            id: 'post1',
            caption: 'Test post',
            type: 'job_listing',
            publishedAt: new Date(),
            hashtags: ['#jobs', '#hiring'],
            job: {
              id: 'job1',
              title: 'Software Engineer',
              company: 'Tech Corp',
            },
          },
        },
      ];

      (prisma.instagramAnalytics.findMany as jest.Mock).mockResolvedValue(
        mockAnalytics
      );

      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        postType: 'job_listing',
      };

      const result = await service.getPostsAnalytics(filters);

      expect(prisma.instagramAnalytics.findMany).toHaveBeenCalledWith({
        where: {
          recordedAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
          post: {
            type: 'job_listing',
          },
        },
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

      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('getPerformanceInsights', () => {
    it('should calculate performance insights correctly', async () => {
      const mockAnalytics = [
        {
          postId: 'post1',
          impressions: 1000,
          reach: 800,
          likes: 50,
          comments: 10,
          shares: 5,
          saves: 15,
          engagementRate: 8,
          post: {
            caption: 'Great job opportunity at Tech Corp!',
            hashtags: ['#jobs', '#tech'],
          },
        },
        {
          postId: 'post2',
          impressions: 500,
          reach: 400,
          likes: 20,
          comments: 5,
          shares: 2,
          saves: 8,
          engagementRate: 7,
          post: {
            caption: 'Another amazing opportunity!',
            hashtags: ['#jobs', '#remote'],
          },
        },
      ];

      jest
        .spyOn(service, 'getPostsAnalytics')
        .mockResolvedValue(mockAnalytics as any);

      const result = await service.getPerformanceInsights();

      expect(result).toEqual({
        totalPosts: 2,
        totalImpressions: 1500,
        totalReach: 1200,
        totalEngagements: 115, // (50+10+5+15) + (20+5+2+8)
        averageEngagementRate: 7.5, // (8+7)/2
        bestPerformingPost: {
          id: 'post1',
          caption: 'Great job opportunity at Tech Corp!...',
          engagementRate: 8,
          impressions: 1000,
        },
        worstPerformingPost: {
          id: 'post2',
          caption: 'Another amazing opportunity!...',
          engagementRate: 7,
          impressions: 500,
        },
        engagementTrend: 'stable',
        topHashtags: [
          { hashtag: '#jobs', count: 2, avgEngagementRate: 7.5 },
          { hashtag: '#tech', count: 1, avgEngagementRate: 8 },
          { hashtag: '#remote', count: 1, avgEngagementRate: 7 },
        ],
      });
    });

    it('should handle empty analytics gracefully', async () => {
      jest.spyOn(service, 'getPostsAnalytics').mockResolvedValue([]);

      const result = await service.getPerformanceInsights();

      expect(result).toEqual({
        totalPosts: 0,
        totalImpressions: 0,
        totalReach: 0,
        totalEngagements: 0,
        averageEngagementRate: 0,
        bestPerformingPost: null,
        worstPerformingPost: null,
        engagementTrend: 'stable',
        topHashtags: [],
      });
    });
  });

  describe('checkEngagementAlerts', () => {
    it('should check and trigger alerts when thresholds are met', async () => {
      const mockAnalytics = {
        postId: 'post1',
        engagementRate: 15,
        post: {
          caption: 'High performing post',
          job: { title: 'Software Engineer' },
        },
      };

      const mockAlerts = [
        {
          id: 'alert1',
          userId: 'user1',
          alertType: 'HIGH_ENGAGEMENT',
          threshold: 10,
          isActive: true,
          triggerCount: 0,
          user: { email: 'user@example.com' },
        },
      ];

      (prisma.instagramAnalytics.findFirst as jest.Mock).mockResolvedValue(
        mockAnalytics
      );
      (prisma.instagramEngagementAlert.findMany as jest.Mock).mockResolvedValue(
        mockAlerts
      );
      (prisma.instagramEngagementAlert.update as jest.Mock).mockResolvedValue(
        {}
      );

      jest.spyOn(service as any, 'shouldTriggerAlert').mockReturnValue(true);
      jest.spyOn(service as any, 'triggerAlert').mockResolvedValue(undefined);

      await service.checkEngagementAlerts('post1');

      expect(prisma.instagramAnalytics.findFirst).toHaveBeenCalledWith({
        where: { postId: 'post1' },
        include: {
          post: {
            include: {
              job: true,
            },
          },
        },
        orderBy: { recordedAt: 'desc' },
      });

      expect(prisma.instagramEngagementAlert.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: { user: true },
      });
    });
  });

  describe('getAccountMetricsHistory', () => {
    it('should retrieve account metrics history', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockMetrics = [
        {
          accountId: 'account1',
          date: new Date('2024-01-01'),
          followersCount: 5000,
          impressions: 10000,
        },
      ];

      (prisma.instagramAccountMetrics.findMany as jest.Mock).mockResolvedValue(
        mockMetrics
      );

      const result = await service.getAccountMetricsHistory(
        'account1',
        startDate,
        endDate
      );

      expect(prisma.instagramAccountMetrics.findMany).toHaveBeenCalledWith({
        where: {
          accountId: 'account1',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      expect(result).toEqual(mockMetrics);
    });
  });
});
