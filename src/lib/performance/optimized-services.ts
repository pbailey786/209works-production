/**
 * Optimized Services with Enhanced Caching
 * High-performance service layer with regional caching and sub-2-second response times
 */

import { prisma } from './enhanced-cache-manager';
import { getDomainConfig } from '@/lib/domain/config';

/**
 * Optimized Job Service with regional caching
 */
export class OptimizedJobService {
  /**
   * Get jobs with regional filtering and caching
   */
  @Cached({
    keyPrefix: 'jobs.getRegionalJobs',
    ttl: CACHE_DURATIONS.MEDIUM,
    tags: [CACHE_TAGS.JOBS],
    regional: true
  })
  static async getRegionalJobs(params: {
    region: string;
    limit?: number;
    offset?: number;
    filters?: {
      query?: string;
      jobType?: string;
      experienceLevel?: string;
      salaryMin?: number;
      salaryMax?: number;
    };
  }) {
    const { region, limit = 20, offset = 0, filters = {} } = params;
    const domainConfig = getDomainConfig(`${region}.works`);

    // Build optimized where clause
    const whereClause: any = {
      status: 'ACTIVE',
      OR: [
        { region: region },
        { location: { contains: domainConfig.region, mode: 'insensitive' } },
        { 
          location: { 
            in: domainConfig.cities.map(city => city.toLowerCase())
          }
        }
      ]
    };

    // Add filters
    if (filters.query) {
      whereClause.AND = [
        {
          OR: [
            { title: { contains: filters.query, mode: 'insensitive' } },
            { description: { contains: filters.query, mode: 'insensitive' } },
            { company: { contains: filters.query, mode: 'insensitive' } },
          ]
        }
      ];
    }

    if (filters.jobType) {
      whereClause.jobType = filters.jobType;
    }

    if (filters.experienceLevel) {
      whereClause.experienceLevel = filters.experienceLevel;
    }

    if (filters.salaryMin) {
      whereClause.salaryMin = { gte: filters.salaryMin };
    }

    if (filters.salaryMax) {
      whereClause.salaryMax = { lte: filters.salaryMax };
    }

    // Execute optimized query
    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          jobType: true,
          experienceLevel: true,
          salaryMin: true,
          salaryMax: true,
          description: true,
          createdAt: true,
          viewCount: true,
          applicationCount: true,
          categories: true,
          remote: true,
          featured: true
        }
      }),
      prisma.job.count({ where: whereClause }),
    ]);

    return {
      jobs,
      totalCount,
      hasMore: offset + limit < totalCount,
      region: domainConfig.region
    };
  }

  /**
   * Get featured jobs with caching
   */
  @Cached({
    keyPrefix: 'jobs.getFeaturedJobs',
    ttl: CACHE_DURATIONS.LONG,
    tags: [CACHE_TAGS.JOBS],
    regional: true
  })
  static async getFeaturedJobs(region: string, limit: number = 6) {
    const domainConfig = getDomainConfig(`${region}.works`);

    return prisma.job.findMany({
      where: {
        status: 'ACTIVE',
        featured: true,
        OR: [
          { region: region },
          { location: { contains: domainConfig.region, mode: 'insensitive' } },
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
        jobType: true,
        createdAt: true,
        viewCount: true,
        applicationCount: true
      }
    });
  }

  /**
   * Get job statistics with caching
   */
  @Cached({
    keyPrefix: 'jobs.getJobStats',
    ttl: CACHE_DURATIONS.LONG,
    tags: [CACHE_TAGS.JOBS, CACHE_TAGS.ANALYTICS],
    regional: true
  })
  static async getJobStats(region: string) {
    const domainConfig = getDomainConfig(`${region}.works`);

    const [
      totalJobs,
      activeJobs,
      jobsThisWeek,
      topCategories,
      topLocations
    ] = await Promise.all([
      // Total jobs
      prisma.job.count({
        where: {
          OR: [
            { region: region },
            { location: { contains: domainConfig.region, mode: 'insensitive' } },
          ]
        }
      }),

      // Active jobs
      prisma.job.count({
        where: {
          status: 'ACTIVE',
          OR: [
            { region: region },
            { location: { contains: domainConfig.region, mode: 'insensitive' } },
          ]
        }
      }),

      // Jobs this week
      prisma.job.count({
        where: {
          status: 'ACTIVE',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          OR: [
            { region: region },
            { location: { contains: domainConfig.region, mode: 'insensitive' } },
          ]
        }
      }),

      // Top categories
      prisma.job.groupBy({
        by: ['categories'],
        where: {
          status: 'ACTIVE',
          OR: [
            { region: region },
            { location: { contains: domainConfig.region, mode: 'insensitive' } },
          ]
        },
        _count: { categories: true },
        orderBy: { _count: { categories: 'desc' } },
        take: 5
      }),

      // Top locations
      prisma.job.groupBy({
        by: ['location'],
        where: {
          status: 'ACTIVE',
          OR: [
            { region: region },
            { location: { contains: domainConfig.region, mode: 'insensitive' } },
          ]
        },
        _count: { location: true },
        orderBy: { _count: { location: 'desc' } },
        take: 5
      }),
    ]);

    return {
      totalJobs,
      activeJobs,
      jobsThisWeek,
      topCategories: topCategories.map(cat => ({
        category: cat.categories?.[0] || 'Other',
        count: cat._count.categories
      })),
      topLocations: topLocations.map(loc => ({
        location: loc.location,
        count: loc._count.location
      })),
      region: domainConfig.region
    };
  }
}

/**
 * Optimized Search Service with intelligent caching
 */
export class OptimizedSearchService {
  /**
   * Search jobs with caching and regional filtering
   */
  static async searchJobs(params: {
    query: string;
    region: string;
    filters?: Record<string, any>;
    page?: number;
    limit?: number;
  }) {
    const { query, region, filters = {}, page = 1, limit = 20 } = params;
    
    return CacheUtils.cacheSearchResults(
      async () => {
        return OptimizedJobService.getRegionalJobs({
          region,
          limit,
          offset: (page - 1) * limit,
          filters: { query, ...filters }
        });
      },
      query,
      { region, filters, page, limit }
    );
  }

  /**
   * Get search suggestions with caching
   */
  @Cached({
    keyPrefix: 'search.getSuggestions',
    ttl: CACHE_DURATIONS.VERY_LONG,
    tags: [CACHE_TAGS.SEARCH],
    regional: true
  })
  static async getSearchSuggestions(region: string, limit: number = 10) {
    const domainConfig = getDomainConfig(`${region}.works`);

    // Get popular search terms from job titles and categories
    const [popularTitles, popularCategories] = await Promise.all([
      prisma.job.groupBy({
        by: ['title'],
        where: {
          status: 'ACTIVE',
          OR: [
            { region: region },
            { location: { contains: domainConfig.region, mode: 'insensitive' } },
          ]
        },
        _count: { title: true },
        orderBy: { _count: { title: 'desc' } },
        take: limit / 2
      }),

      prisma.job.groupBy({
        by: ['categories'],
        where: {
          status: 'ACTIVE',
          OR: [
            { region: region },
            { location: { contains: domainConfig.region, mode: 'insensitive' } },
          ]
        },
        _count: { categories: true },
        orderBy: { _count: { categories: 'desc' } },
        take: limit / 2
      }),
    ]);

    const suggestions = [
      ...popularTitles.map(item => ({
        text: item.title,
        type: 'job_title' as const,
        count: item._count.title
      })),
      ...popularCategories.flatMap(item => 
        (item.categories || []).map(category => ({
          text: category,
          type: 'category' as const,
          count: item._count.categories
        }))
      ),
    ];

    return suggestions
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

/**
 * Optimized Analytics Service with performance metrics
 */
export class OptimizedAnalyticsService {
  /**
   * Get real-time metrics with caching
   */
  @Cached({
    keyPrefix: 'analytics.getRealTimeMetrics',
    ttl: CACHE_DURATIONS.SHORT,
    tags: [CACHE_TAGS.ANALYTICS],
    regional: true
  })
  static async getRealTimeMetrics(region: string) {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const domainConfig = getDomainConfig(`${region}.works`);

    const [
      activeJobs,
      applicationsToday,
      aiSessions,
      activeUsers
    ] = await Promise.all([
      // Active jobs in region
      prisma.job.count({
        where: {
          status: 'ACTIVE',
          OR: [
            { region: region },
            { location: { contains: domainConfig.region, mode: 'insensitive' } },
          ]
        }
      }),

      // Applications today
      prisma.jobApplication.count({
        where: {
          appliedAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
        }
      }),

      // AI sessions in last hour
      prisma.chatAnalytics.count({
        where: {
          createdAt: { gte: lastHour }
        },
        distinct: ['sessionId']
      }),

      // Active users (users with activity in last hour)
      prisma.user.count({
        where: {
          OR: [
            { lastLoginAt: { gte: lastHour } },
            { updatedAt: { gte: lastHour } },
          ]
        }
      }),
    ]);

    return {
      activeJobs,
      applicationsToday,
      aiSessions,
      activeUsers,
      region: domainConfig.region,
      lastUpdated: now.toISOString()
    };
  }

  /**
   * Get cache performance metrics
   */
  static getCacheMetrics() {
    return EnhancedCacheManager.getMetrics();
  }
}

export { OptimizedJobService, OptimizedSearchService, OptimizedAnalyticsService };
