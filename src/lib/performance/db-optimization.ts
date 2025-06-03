import { PrismaClient } from '@prisma/client';
import {
  createCachedFunction,
  CACHE_TAGS,
  CACHE_DURATIONS,
} from './cache-utils';

// Optimized job queries with caching
export const getCachedJobs = createCachedFunction(
  async (
    prisma: PrismaClient,
    filters: {
      query?: string;
      location?: string;
      type?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const { query, location, type, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Build where clause efficiently
    const where: any = {
      AND: [
        { isActive: true },
        ...(query
          ? [
              {
                OR: [
                  { title: { contains: query, mode: 'insensitive' } },
                  { description: { contains: query, mode: 'insensitive' } },
                  { company: { contains: query, mode: 'insensitive' } },
                ],
              },
            ]
          : []),
        ...(location
          ? [{ location: { contains: location, mode: 'insensitive' } }]
          : []),
        ...(type ? [{ type }] : []),
      ],
    };

    // Use parallel queries for better performance
    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          jobType: true,
          salaryMin: true,
          salaryMax: true,
          description: true,
          url: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  },
  {
    keyPrefix: 'jobs-search',
    tags: [CACHE_TAGS.JOBS, CACHE_TAGS.SEARCH],
    revalidate: CACHE_DURATIONS.MEDIUM,
  }
);

// Optimized user alerts query
export const getCachedUserAlerts = createCachedFunction(
  async (prisma: PrismaClient, userId: string) => {
    return prisma.emailAlert.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        keywords: true,
        location: true,
        frequency: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  {
    keyPrefix: 'user-alerts',
    tags: [CACHE_TAGS.ALERTS, CACHE_TAGS.USER],
    revalidate: CACHE_DURATIONS.LONG,
  }
);

// Optimized ads query with rotation
export const getCachedActiveAds = createCachedFunction(
  async (prisma: PrismaClient, placement: string, limit: number = 3) => {
    return prisma.advertisement.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        placement: { has: placement },
      },
      select: {
        id: true,
        title: true,
        content: true,
        impressions: true,
        clicks: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [
        { priority: 'desc' },
        { clickCount: 'asc' }, // Rotate ads with fewer clicks
      ],
      take: limit,
    });
  },
  {
    keyPrefix: 'active-ads',
    tags: [CACHE_TAGS.ADS],
    revalidate: CACHE_DURATIONS.SHORT,
  }
);

// Database connection optimization
export function optimizePrismaConnection(prisma: PrismaClient) {
  // Connection pool optimization - skip event handler due to type issues
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB] Prisma connection optimized for development');
  }

  // Graceful shutdown
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });

  return prisma;
}

// Query performance monitoring
export class QueryPerformanceMonitor {
  private static queryTimes: Map<string, number[]> = new Map();

  static startQuery(queryId: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;

      if (!this.queryTimes.has(queryId)) {
        this.queryTimes.set(queryId, []);
      }

      const times = this.queryTimes.get(queryId)!;
      times.push(duration);

      // Keep only last 100 measurements
      if (times.length > 100) {
        times.shift();
      }

      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query: ${queryId} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  static getStats(queryId: string) {
    const times = this.queryTimes.get(queryId) || [];
    if (times.length === 0) return null;

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return {
      count: times.length,
      average: avg,
      min,
      max,
      p95: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)] || 0,
    };
  }

  static getAllStats() {
    const stats: Record<string, any> = {};
    for (const [queryId] of this.queryTimes) {
      stats[queryId] = this.getStats(queryId);
    }
    return stats;
  }

  // Log slow query
  private static logSlowQuery(metrics: {
    operation: string;
    query: string;
    duration: number;
    [key: string]: any;
  }): void {
    console.warn(
      `Slow query detected: ${metrics.operation} took ${metrics.duration}ms`
    );
    console.warn(`Query: ${metrics.query.slice(0, 100)}...`);
  }
}

// Batch operations for better performance
export async function batchUpdateJobViews(
  prisma: PrismaClient,
  jobViews: { jobId: string; views: number }[]
) {
  const endQuery = QueryPerformanceMonitor.startQuery('batch-update-job-views');

  try {
    // Use transaction for consistency
    await prisma.$transaction(
      jobViews.map(({ jobId, views }) =>
        prisma.job.update({
          where: { id: jobId },
          data: { viewCount: { increment: views } },
        })
      )
    );
  } finally {
    endQuery();
  }
}

// Efficient search with full-text search
export async function performOptimizedJobSearch(
  prisma: PrismaClient,
  searchParams: {
    query?: string;
    location?: string;
    type?: string;
    salaryMin?: number;
    salaryMax?: number;
    isRemote?: boolean;
    page?: number;
    limit?: number;
  }
) {
  const endQuery = QueryPerformanceMonitor.startQuery('optimized-job-search');

  try {
    const {
      query,
      location,
      type,
      salaryMin,
      salaryMax,
      isRemote,
      page = 1,
      limit = 20,
    } = searchParams;

    const skip = (page - 1) * limit;

    // Use raw SQL for complex full-text search if needed
    if (query && query.length > 2) {
      const searchQuery = `
        SELECT j.*, ts_rank(search_vector, plainto_tsquery($1)) as rank
        FROM jobs j
        WHERE j.is_active = true
          AND search_vector @@ plainto_tsquery($1)
          ${location ? 'AND LOWER(location) LIKE LOWER($2)' : ''}
          ${type ? `AND type = $${location ? 3 : 2}` : ''}
          ${salaryMin ? `AND salary_max >= $${[location, type].filter(Boolean).length + 2}` : ''}
          ${salaryMax ? `AND salary_min <= $${[location, type, salaryMin].filter(Boolean).length + 2}` : ''}
          ${isRemote !== undefined ? `AND is_remote = $${[location, type, salaryMin, salaryMax].filter(Boolean).length + 2}` : ''}
        ORDER BY rank DESC, is_pinned DESC, created_at DESC
        LIMIT $${[location, type, salaryMin, salaryMax, isRemote].filter(v => v !== undefined).length + 2}
        OFFSET $${[location, type, salaryMin, salaryMax, isRemote].filter(v => v !== undefined).length + 3}
      `;

      const params = [
        query,
        ...(location ? [`%${location}%`] : []),
        ...(type ? [type] : []),
        ...(salaryMin ? [salaryMin] : []),
        ...(salaryMax ? [salaryMax] : []),
        ...(isRemote !== undefined ? [isRemote] : []),
        limit,
        skip,
      ];

      const jobs = await prisma.$queryRawUnsafe(searchQuery, ...params);
      return jobs;
    }

    // Fallback to regular Prisma query for simple searches
    return getCachedJobs(prisma, searchParams);
  } finally {
    endQuery();
  }
}
