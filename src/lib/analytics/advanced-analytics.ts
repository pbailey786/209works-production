/**
 * Advanced Analytics Service for 209 Works
 * Provides comprehensive analytics, reporting, and business intelligence
 */

import { prisma } from '@/lib/database/prisma';
import { cache } from 'react';

export interface AnalyticsTimeRange {
  startDate: Date;
  endDate: Date;
  period: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface UserBehaviorMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
  pageViews: number;
  uniquePageViews: number;
  conversionRate: number;
  userRetentionRate: number;
}

export interface JobPerformanceMetrics {
  totalJobs: number;
  activeJobs: number;
  jobsPostedToday: number;
  averageTimeToFill: number;
  applicationRate: number;
  viewToApplicationRate: number;
  topPerformingJobs: Array<{
    id: string;
    title: string;
    company: string;
    views: number;
    applications: number;
    conversionRate: number;
  }>;
  jobsByCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  jobsByLocation: Array<{
    location: string;
    count: number;
    percentage: number;
  }>;
}

export interface BusinessIntelligence {
  revenue: {
    total: number;
    recurring: number;
    oneTime: number;
    growth: number;
    arpu: number; // Average Revenue Per User
    ltv: number; // Customer Lifetime Value
  };
  employers: {
    total: number;
    active: number;
    new: number;
    churnRate: number;
    averageJobsPerEmployer: number;
    topSpenders: Array<{
      id: string;
      companyName: string;
      totalSpent: number;
      jobsPosted: number;
    }>;
  };
  jobSeekers: {
    total: number;
    active: number;
    new: number;
    averageApplicationsPerUser: number;
    profileCompletionRate: number;
    topSkills: Array<{
      skill: string;
      count: number;
      percentage: number;
    }>;
  };
}

export interface RegionalAnalytics {
  regions: Array<{
    region: string;
    domain: string;
    users: number;
    jobs: number;
    applications: number;
    revenue: number;
    growth: number;
  }>;
  crossRegionalActivity: {
    usersViewingMultipleRegions: number;
    crossRegionalApplications: number;
    mostPopularRegionPairs: Array<{
      from: string;
      to: string;
      count: number;
    }>;
  };
}

export interface AIAnalytics {
  jobsGPT: {
    totalSessions: number;
    totalQuestions: number;
    averageResponseTime: number;
    successRate: number;
    topIntents: Array<{
      intent: string;
      count: number;
      percentage: number;
    }>;
    userSatisfactionScore: number;
  };
  shouldIApply: {
    totalUsage: number;
    averageMatchScore: number;
    applicationConversionRate: number;
    topRecommendationReasons: Array<{
      reason: string;
      count: number;
    }>;
  };
  resumeAnalysis: {
    totalAnalyses: number;
    averageScore: number;
    topImprovementSuggestions: Array<{
      suggestion: string;
      frequency: number;
    }>;
  };
}

export class AdvancedAnalyticsService {
  /**
   * Get comprehensive user behavior metrics
   */
  static getUserBehaviorMetrics = cache(async (
    timeRange: AnalyticsTimeRange,
    region?: string
  ): Promise<UserBehaviorMetrics> => {
    const { startDate, endDate } = timeRange;
    
    // Build region filter
    const regionFilter = region ? { region } : {};

    const [
      totalUsers,
      activeUsers,
      newUsers,
      sessionData,
      pageViewData,
      conversionData
    ] = await Promise.all([
      // Total users
      prisma.user.count({
        where: {
          createdAt: { lte: endDate },
          ...regionFilter
        }
      }),

      // Active users (users with activity in time range)
      prisma.user.count({
        where: {
          OR: [
            { lastLoginAt: { gte: startDate, lte: endDate } },
            { updatedAt: { gte: startDate, lte: endDate } }
          ],
          ...regionFilter
        }
      }),

      // New users in time range
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          ...regionFilter
        }
      }),

      // Session data from analytics
      prisma.$queryRaw<Array<{ avg_duration: number; total_sessions: number }>>`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (updatedAt - createdAt))) as avg_duration,
          COUNT(*) as total_sessions
        FROM ChatAnalytics 
        WHERE createdAt >= ${startDate} 
        AND createdAt <= ${endDate}
      `,

      // Page view data (mock for now - would come from analytics service)
      Promise.resolve({ pageViews: 0, uniquePageViews: 0, bounceRate: 0 }),

      // Conversion data (applications vs job views)
      prisma.$queryRaw<Array<{ applications: number; job_views: number }>>`
        SELECT 
          COUNT(DISTINCT ja.id) as applications,
          COUNT(DISTINCT jv.id) as job_views
        FROM JobApplication ja
        FULL OUTER JOIN JobView jv ON jv.createdAt >= ${startDate} AND jv.createdAt <= ${endDate}
        WHERE ja.appliedAt >= ${startDate} AND ja.appliedAt <= ${endDate}
      `
    ]);

    const returningUsers = activeUsers - newUsers;
    const averageSessionDuration = sessionData[0]?.avg_duration || 0;
    const conversionRate = conversionData[0] ? 
      (conversionData[0].applications / Math.max(conversionData[0].job_views, 1)) * 100 : 0;

    return {
      totalUsers,
      activeUsers,
      newUsers,
      returningUsers,
      averageSessionDuration,
      bounceRate: pageViewData.bounceRate,
      pageViews: pageViewData.pageViews,
      uniquePageViews: pageViewData.uniquePageViews,
      conversionRate,
      userRetentionRate: totalUsers > 0 ? (returningUsers / totalUsers) * 100 : 0
    };
  });

  /**
   * Get job performance metrics
   */
  static getJobPerformanceMetrics = cache(async (
    timeRange: AnalyticsTimeRange,
    region?: string
  ): Promise<JobPerformanceMetrics> => {
    const { startDate, endDate } = timeRange;
    const regionFilter = region ? { region } : {};

    const [
      totalJobs,
      activeJobs,
      jobsPostedToday,
      topPerformingJobs,
      jobsByCategory,
      jobsByLocation,
      applicationData
    ] = await Promise.all([
      // Total jobs
      prisma.job.count({
        where: {
          createdAt: { lte: endDate },
          ...regionFilter
        }
      }),

      // Active jobs
      prisma.job.count({
        where: {
          status: 'ACTIVE',
          ...regionFilter
        }
      }),

      // Jobs posted today
      prisma.job.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999))
          },
          ...regionFilter
        }
      }),

      // Top performing jobs
      prisma.$queryRaw<Array<{
        id: string;
        title: string;
        company: string;
        views: number;
        applications: number;
      }>>`
        SELECT
          j.id,
          j.title,
          j.company,
          COALESCE(jv.view_count, 0) as views,
          COALESCE(ja.app_count, 0) as applications
        FROM Job j
        LEFT JOIN (
          SELECT jobId, COUNT(*) as view_count
          FROM JobView
          WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
          GROUP BY jobId
        ) jv ON j.id = jv.jobId
        LEFT JOIN (
          SELECT jobId, COUNT(*) as app_count
          FROM JobApplication
          WHERE appliedAt >= ${startDate} AND appliedAt <= ${endDate}
          GROUP BY jobId
        ) ja ON j.id = ja.jobId
        WHERE j.createdAt >= ${startDate} AND j.createdAt <= ${endDate}
        ORDER BY (COALESCE(ja.app_count, 0) + COALESCE(jv.view_count, 0)) DESC
        LIMIT 10
      `,

      // Jobs by category
      prisma.job.groupBy({
        by: ['category'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
          ...regionFilter
        },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } }
      }),

      // Jobs by location
      prisma.job.groupBy({
        by: ['location'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
          ...regionFilter
        },
        _count: { location: true },
        orderBy: { _count: { location: 'desc' } },
        take: 10
      }),

      // Application rate data
      prisma.$queryRaw<Array<{ total_views: number; total_applications: number }>>`
        SELECT
          COUNT(DISTINCT jv.id) as total_views,
          COUNT(DISTINCT ja.id) as total_applications
        FROM JobView jv
        FULL OUTER JOIN JobApplication ja ON ja.appliedAt >= ${startDate} AND ja.appliedAt <= ${endDate}
        WHERE jv.createdAt >= ${startDate} AND jv.createdAt <= ${endDate}
      `
    ]);

    const totalJobsInPeriod = jobsByCategory.reduce((sum, cat) => sum + cat._count.category, 0);
    const applicationRate = applicationData[0] ?
      (applicationData[0].total_applications / Math.max(applicationData[0].total_views, 1)) * 100 : 0;

    return {
      totalJobs,
      activeJobs,
      jobsPostedToday,
      averageTimeToFill: 0, // Would need to calculate based on job status changes
      applicationRate,
      viewToApplicationRate: applicationRate,
      topPerformingJobs: topPerformingJobs.map(job => ({
        ...job,
        conversionRate: job.views > 0 ? (job.applications / job.views) * 100 : 0
      })),
      jobsByCategory: jobsByCategory.map(cat => ({
        category: cat.category || 'Uncategorized',
        count: cat._count.category,
        percentage: totalJobsInPeriod > 0 ? (cat._count.category / totalJobsInPeriod) * 100 : 0
      })),
      jobsByLocation: jobsByLocation.map(loc => ({
        location: loc.location || 'Remote',
        count: loc._count.location,
        percentage: totalJobsInPeriod > 0 ? (loc._count.location / totalJobsInPeriod) * 100 : 0
      }))
    };
  });

  /**
   * Get business intelligence metrics
   */
  static getBusinessIntelligence = cache(async (
    timeRange: AnalyticsTimeRange,
    region?: string
  ): Promise<BusinessIntelligence> => {
    const { startDate, endDate } = timeRange;
    const regionFilter = region ? { region } : {};

    const [
      revenueData,
      employerData,
      jobSeekerData,
      topSpenders
    ] = await Promise.all([
      // Revenue calculations (mock for now - would integrate with Stripe)
      Promise.resolve({
        total: Math.floor(Math.random() * 100000) + 50000,
        recurring: Math.floor(Math.random() * 80000) + 40000,
        oneTime: Math.floor(Math.random() * 20000) + 10000,
        growth: Math.floor(Math.random() * 20) + 5
      }),

      // Employer metrics
      prisma.$queryRaw<Array<{
        total_employers: number;
        active_employers: number;
        new_employers: number;
        avg_jobs_per_employer: number;
      }>>`
        SELECT
          COUNT(DISTINCT u.id) as total_employers,
          COUNT(DISTINCT CASE WHEN j.createdAt >= ${startDate} THEN u.id END) as active_employers,
          COUNT(DISTINCT CASE WHEN u.createdAt >= ${startDate} THEN u.id END) as new_employers,
          COALESCE(AVG(job_counts.job_count), 0) as avg_jobs_per_employer
        FROM User u
        LEFT JOIN Job j ON j.employerId = u.id
        LEFT JOIN (
          SELECT employerId, COUNT(*) as job_count
          FROM Job
          WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
          GROUP BY employerId
        ) job_counts ON job_counts.employerId = u.id
        WHERE u.role = 'employer'
      `,

      // Job seeker metrics
      prisma.$queryRaw<Array<{
        total_job_seekers: number;
        active_job_seekers: number;
        new_job_seekers: number;
        avg_applications_per_user: number;
        profile_completion_rate: number;
      }>>`
        SELECT
          COUNT(DISTINCT u.id) as total_job_seekers,
          COUNT(DISTINCT CASE WHEN ja.appliedAt >= ${startDate} THEN u.id END) as active_job_seekers,
          COUNT(DISTINCT CASE WHEN u.createdAt >= ${startDate} THEN u.id END) as new_job_seekers,
          COALESCE(AVG(app_counts.app_count), 0) as avg_applications_per_user,
          COALESCE(AVG(CASE WHEN jsp.id IS NOT NULL THEN 1.0 ELSE 0.0 END), 0) * 100 as profile_completion_rate
        FROM User u
        LEFT JOIN JobApplication ja ON ja.userId = u.id
        LEFT JOIN JobSeekerProfile jsp ON jsp.userId = u.id
        LEFT JOIN (
          SELECT userId, COUNT(*) as app_count
          FROM JobApplication
          WHERE appliedAt >= ${startDate} AND appliedAt <= ${endDate}
          GROUP BY userId
        ) app_counts ON app_counts.userId = u.id
        WHERE u.role = 'jobseeker'
      `,

      // Top spending employers
      prisma.$queryRaw<Array<{
        id: string;
        companyName: string;
        totalSpent: number;
        jobsPosted: number;
      }>>`
        SELECT
          u.id,
          COALESCE(ep.companyName, 'Unknown Company') as companyName,
          COALESCE(SUM(credits.amount * 50), 0) as totalSpent,
          COUNT(j.id) as jobsPosted
        FROM User u
        LEFT JOIN EmployerProfile ep ON ep.userId = u.id
        LEFT JOIN Job j ON j.employerId = u.id AND j.createdAt >= ${startDate} AND j.createdAt <= ${endDate}
        LEFT JOIN (
          SELECT userId, SUM(amount) as amount
          FROM CreditTransaction
          WHERE type = 'purchase' AND createdAt >= ${startDate} AND createdAt <= ${endDate}
          GROUP BY userId
        ) credits ON credits.userId = u.id
        WHERE u.role = 'employer'
        GROUP BY u.id, ep.companyName
        ORDER BY totalSpent DESC
        LIMIT 10
      `
    ]);

    const employerMetrics = employerData[0];
    const jobSeekerMetrics = jobSeekerData[0];
    const revenue = revenueData;

    return {
      revenue: {
        total: revenue.total,
        recurring: revenue.recurring,
        oneTime: revenue.oneTime,
        growth: revenue.growth,
        arpu: employerMetrics ? revenue.total / Math.max(employerMetrics.total_employers, 1) : 0,
        ltv: revenue.total * 2.5 // Estimated LTV multiplier
      },
      employers: {
        total: employerMetrics?.total_employers || 0,
        active: employerMetrics?.active_employers || 0,
        new: employerMetrics?.new_employers || 0,
        churnRate: 5, // Mock churn rate
        averageJobsPerEmployer: employerMetrics?.avg_jobs_per_employer || 0,
        topSpenders: topSpenders.map(spender => ({
          id: spender.id,
          companyName: spender.companyName,
          totalSpent: Number(spender.totalSpent),
          jobsPosted: Number(spender.jobsPosted)
        }))
      },
      jobSeekers: {
        total: jobSeekerMetrics?.total_job_seekers || 0,
        active: jobSeekerMetrics?.active_job_seekers || 0,
        new: jobSeekerMetrics?.new_job_seekers || 0,
        averageApplicationsPerUser: jobSeekerMetrics?.avg_applications_per_user || 0,
        profileCompletionRate: jobSeekerMetrics?.profile_completion_rate || 0,
        topSkills: [] // Would need to implement skills tracking
      }
    };
  });

  /**
   * Get regional analytics
   */
  static getRegionalAnalytics = cache(async (
    timeRange: AnalyticsTimeRange
  ): Promise<RegionalAnalytics> => {
    const { startDate, endDate } = timeRange;

    const [
      regionalData,
      crossRegionalData
    ] = await Promise.all([
      // Regional breakdown
      prisma.$queryRaw<Array<{
        region: string;
        users: number;
        jobs: number;
        applications: number;
        revenue: number;
      }>>`
        SELECT
          COALESCE(u.region, '209') as region,
          COUNT(DISTINCT u.id) as users,
          COUNT(DISTINCT j.id) as jobs,
          COUNT(DISTINCT ja.id) as applications,
          COALESCE(SUM(ct.amount * 50), 0) as revenue
        FROM User u
        LEFT JOIN Job j ON j.employerId = u.id AND j.createdAt >= ${startDate} AND j.createdAt <= ${endDate}
        LEFT JOIN JobApplication ja ON ja.userId = u.id AND ja.appliedAt >= ${startDate} AND ja.appliedAt <= ${endDate}
        LEFT JOIN CreditTransaction ct ON ct.userId = u.id AND ct.type = 'purchase' AND ct.createdAt >= ${startDate} AND ct.createdAt <= ${endDate}
        WHERE u.createdAt <= ${endDate}
        GROUP BY u.region
        ORDER BY users DESC
      `,

      // Cross-regional activity (mock for now)
      Promise.resolve({
        usersViewingMultipleRegions: Math.floor(Math.random() * 500) + 100,
        crossRegionalApplications: Math.floor(Math.random() * 200) + 50,
        mostPopularRegionPairs: [
          { from: '209', to: '916', count: 45 },
          { from: '916', to: '510', count: 38 },
          { from: '510', to: '209', count: 32 }
        ]
      })
    ]);

    const domainMap: Record<string, string> = {
      '209': '209.works',
      '916': '916.works',
      '510': '510.works',
      '925': '925.works',
      '559': '559.works',
      'norcal': 'norcal.works'
    };

    return {
      regions: regionalData.map(region => ({
        region: region.region,
        domain: domainMap[region.region] || `${region.region}.works`,
        users: Number(region.users),
        jobs: Number(region.jobs),
        applications: Number(region.applications),
        revenue: Number(region.revenue),
        growth: Math.floor(Math.random() * 20) + 5 // Mock growth rate
      })),
      crossRegionalActivity: crossRegionalData
    };
  });

  /**
   * Get AI analytics
   */
  static getAIAnalytics = cache(async (
    timeRange: AnalyticsTimeRange,
    region?: string
  ): Promise<AIAnalytics> => {
    const { startDate, endDate } = timeRange;

    const [
      jobsGPTData,
      shouldIApplyData,
      resumeAnalysisData
    ] = await Promise.all([
      // JobsGPT analytics
      prisma.$queryRaw<Array<{
        total_sessions: number;
        total_questions: number;
        avg_response_time: number;
        success_rate: number;
      }>>`
        SELECT
          COUNT(DISTINCT sessionId) as total_sessions,
          COUNT(*) as total_questions,
          AVG(responseTime) as avg_response_time,
          AVG(CASE WHEN jobsFound > 0 THEN 1.0 ELSE 0.0 END) * 100 as success_rate
        FROM ChatAnalytics
        WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
      `,

      // Should I Apply analytics (mock for now)
      Promise.resolve({
        totalUsage: Math.floor(Math.random() * 1000) + 500,
        averageMatchScore: Math.floor(Math.random() * 30) + 70,
        applicationConversionRate: Math.floor(Math.random() * 20) + 15,
        topRecommendationReasons: [
          { reason: 'Strong skill match', count: 245 },
          { reason: 'Location preference', count: 189 },
          { reason: 'Salary range fit', count: 156 }
        ]
      }),

      // Resume analysis analytics (mock for now)
      Promise.resolve({
        totalAnalyses: Math.floor(Math.random() * 500) + 200,
        averageScore: Math.floor(Math.random() * 20) + 75,
        topImprovementSuggestions: [
          { suggestion: 'Add more quantified achievements', frequency: 89 },
          { suggestion: 'Include relevant keywords', frequency: 76 },
          { suggestion: 'Improve formatting consistency', frequency: 64 }
        ]
      })
    ]);

    const jobsGPT = jobsGPTData[0];

    return {
      jobsGPT: {
        totalSessions: Number(jobsGPT?.total_sessions || 0),
        totalQuestions: Number(jobsGPT?.total_questions || 0),
        averageResponseTime: Number(jobsGPT?.avg_response_time || 0),
        successRate: Number(jobsGPT?.success_rate || 0),
        topIntents: [
          { intent: 'job_search', count: 456, percentage: 45.6 },
          { intent: 'career_advice', count: 234, percentage: 23.4 },
          { intent: 'salary_inquiry', count: 189, percentage: 18.9 }
        ],
        userSatisfactionScore: 4.2
      },
      shouldIApply: shouldIApplyData,
      resumeAnalysis: resumeAnalysisData
    };
  });

  /**
   * Generate comprehensive analytics report
   */
  static generateComprehensiveReport = cache(async (
    timeRange: AnalyticsTimeRange,
    region?: string
  ) => {
    const [
      userBehavior,
      jobPerformance,
      businessIntelligence,
      regionalAnalytics,
      aiAnalytics
    ] = await Promise.all([
      this.getUserBehaviorMetrics(timeRange, region),
      this.getJobPerformanceMetrics(timeRange, region),
      this.getBusinessIntelligence(timeRange, region),
      this.getRegionalAnalytics(timeRange),
      this.getAIAnalytics(timeRange, region)
    ]);

    return {
      timeRange,
      region,
      userBehavior,
      jobPerformance,
      businessIntelligence,
      regionalAnalytics,
      aiAnalytics,
      generatedAt: new Date().toISOString()
    };
  });
}
