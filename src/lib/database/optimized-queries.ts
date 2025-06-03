/**
 * Optimized Database Queries Service
 * Task 45.13: Fix Database Performance Issues and N+1 Query Problems
 *
 * This service provides optimized database operations that:
 * 1. Prevent N+1 query problems
 * 2. Use composite indexes efficiently
 * 3. Implement batch operations
 * 4. Leverage full-text search
 * 5. Optimize vector similarity searches
 */

import { prisma } from '@/lib/database/prisma';
import { Prisma } from '@prisma/client';
import { setCache, getCache, invalidateCache } from '@/lib/cache/redis';
import { DEFAULT_TTL } from '@/lib/cache/config';

// Types for optimized queries
export interface OptimizedJobQuery {
  query?: string;
  location?: string;
  jobType?: string;
  categories?: string[];
  salaryMin?: number;
  salaryMax?: number;
  companyIds?: string[];
  isRemote?: boolean;
  datePosted?: '24h' | '7d' | '30d';
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'salary';
  sortOrder?: 'asc' | 'desc';
}

export interface JobWithCompanyStats {
  id: string;
  title: string;
  company: string;
  companyId: string | null;
  description: string;
  location: string;
  jobType: string;
  categories: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  postedAt: Date;
  createdAt: Date;
  // Company stats (from materialized view)
  companyStats?: {
    totalJobs: number;
    recentJobs: number;
    avgSalaryMin?: number;
    avgSalaryMax?: number;
    jobTypes?: string[];
    locations?: string[];
  };
}

export interface BatchCompanyStats {
  [companyName: string]: {
    totalJobs: number;
    recentJobs: number;
    avgSalaryMin?: number;
    avgSalaryMax?: number;
  };
}

/**
 * Optimized Job Search Service
 * Prevents N+1 queries and uses efficient indexing
 */
export class OptimizedJobSearchService {
  private static readonly CACHE_TTL = DEFAULT_TTL.short;
  private static readonly CACHE_PREFIX = 'optimized_search';

  /**
   * Search jobs with optimized queries and batch company lookups
   * Prevents N+1 queries by fetching company stats in batch
   */
  static async searchJobsOptimized(params: OptimizedJobQuery): Promise<{
    jobs: JobWithCompanyStats[];
    totalCount: number;
    queryTime: number;
    cacheHit: boolean;
  }> {
    const startTime = Date.now();
    const cacheKey = `${this.CACHE_PREFIX}:${JSON.stringify(params)}`;

    // Check cache first
    const cached = await getCache<{
      jobs: JobWithCompanyStats[];
      totalCount: number;
      queryTime: number;
      cacheHit: boolean;
    }>(cacheKey);
    if (cached) {
      return {
        ...cached,
        cacheHit: true,
        queryTime: Date.now() - startTime,
      };
    }

    try {
      // Build optimized where condition using indexes
      const whereCondition = this.buildOptimizedWhereCondition(params);

      // Build optimized order by using indexes
      const orderBy = this.buildOptimizedOrderBy(
        params.sortBy,
        params.sortOrder
      );

      // Execute optimized queries in parallel
      const [jobs, totalCount] = await Promise.all([
        // Main job query with minimal data
        prisma.job.findMany({
          where: whereCondition,
          orderBy,
          take: params.limit || 20,
          skip: params.offset || 0,
          select: {
            id: true,
            title: true,
            company: true,
            companyId: true,
            description: true,
            location: true,
            jobType: true,
            categories: true,
            salaryMin: true,
            salaryMax: true,
            postedAt: true,
            createdAt: true,
          },
        }),
        // Count query using same optimized condition
        prisma.job.count({ where: whereCondition }),
      ]);

      // Batch fetch company stats to prevent N+1 queries
      const companyNames = [
        ...new Set(jobs.map(job => job.company).filter(Boolean)),
      ];
      const companyStats = await this.batchGetCompanyStats(companyNames);

      // Combine job data with company stats
      const jobsWithStats: JobWithCompanyStats[] = jobs.map(job => ({
        ...job,
        companyStats: companyStats[job.company] || undefined,
      }));

      const result = {
        jobs: jobsWithStats,
        totalCount,
        queryTime: Date.now() - startTime,
        cacheHit: false,
      };

      // Cache the result
      await setCache(cacheKey, result, { ttl: this.CACHE_TTL });

      return result;
    } catch (error) {
      console.error('Optimized job search error:', error);
      throw error;
    }
  }

  /**
   * Full-text search using PostgreSQL indexes
   * Uses the full-text search indexes created in migration
   */
  static async fullTextSearch(
    query: string,
    params: Omit<OptimizedJobQuery, 'query'>
  ): Promise<JobWithCompanyStats[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `${this.CACHE_PREFIX}:fulltext:${query}:${JSON.stringify(params)}`;
    const cached = await getCache<JobWithCompanyStats[]>(cacheKey);
    if (cached) return cached;

    try {
      // Use PostgreSQL full-text search with ranking
      const jobs = await prisma.$queryRaw<any[]>`
        SELECT 
          j.id,
          j.title,
          j.company,
          j."companyId",
          j.description,
          j.location,
          j."jobType",
          j.categories,
          j."salaryMin",
          j."salaryMax",
          j."postedAt",
          j."createdAt",
          ts_rank(
            to_tsvector('english', j.title || ' ' || j.description || ' ' || j.company || ' ' || j.location),
            plainto_tsquery('english', ${query})
          ) as relevance_score
        FROM "Job" j
        WHERE to_tsvector('english', j.title || ' ' || j.description || ' ' || j.company || ' ' || j.location) 
              @@ plainto_tsquery('english', ${query})
        ${this.buildAdditionalFilters(params)}
        ORDER BY relevance_score DESC, j."postedAt" DESC
        LIMIT ${params.limit || 20}
        OFFSET ${params.offset || 0}
      `;

      // Batch fetch company stats
      const companyNames = [
        ...new Set(jobs.map(job => job.company).filter(Boolean)),
      ];
      const companyStats = await this.batchGetCompanyStats(companyNames);

      const jobsWithStats: JobWithCompanyStats[] = jobs.map(job => ({
        ...job,
        companyStats: companyStats[job.company] || undefined,
      }));

      await setCache(cacheKey, jobsWithStats, { ttl: this.CACHE_TTL });
      return jobsWithStats;
    } catch (error) {
      console.error('Full-text search error:', error);
      return [];
    }
  }

  /**
   * Vector similarity search using optimized indexes
   * Uses the vector indexes created in migration
   */
  static async vectorSimilaritySearch(
    embedding: number[],
    params: OptimizedJobQuery
  ): Promise<JobWithCompanyStats[]> {
    const cacheKey = `${this.CACHE_PREFIX}:vector:${embedding.slice(0, 5).join(',')}:${JSON.stringify(params)}`;
    const cached = await getCache<JobWithCompanyStats[]>(cacheKey);
    if (cached) return cached;

    try {
      // Use vector similarity search with cosine distance
      const jobs = await prisma.$queryRaw<any[]>`
        SELECT 
          j.id,
          j.title,
          j.company,
          j."companyId",
          j.description,
          j.location,
          j."jobType",
          j.categories,
          j."salaryMin",
          j."salaryMax",
          j."postedAt",
          j."createdAt",
          (j.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity_score
        FROM "Job" j
        WHERE j.embedding IS NOT NULL
        ${this.buildAdditionalFilters(params)}
        ORDER BY j.embedding <=> ${JSON.stringify(embedding)}::vector
        LIMIT ${params.limit || 20}
        OFFSET ${params.offset || 0}
      `;

      // Batch fetch company stats
      const companyNames = [
        ...new Set(jobs.map(job => job.company).filter(Boolean)),
      ];
      const companyStats = await this.batchGetCompanyStats(companyNames);

      const jobsWithStats: JobWithCompanyStats[] = jobs.map(job => ({
        ...job,
        companyStats: companyStats[job.company] || undefined,
      }));

      await setCache(cacheKey, jobsWithStats, { ttl: this.CACHE_TTL });
      return jobsWithStats;
    } catch (error) {
      console.error('Vector similarity search error:', error);
      return [];
    }
  }

  /**
   * Batch get company statistics to prevent N+1 queries
   * Uses the materialized view and batch function from migration
   */
  static async batchGetCompanyStats(
    companyNames: string[]
  ): Promise<BatchCompanyStats> {
    if (companyNames.length === 0) return {};

    const cacheKey = `${this.CACHE_PREFIX}:company_stats:${companyNames.sort().join(',')}`;
    const cached = await getCache<BatchCompanyStats>(cacheKey);
    if (cached) return cached;

    try {
      // Use the batch function created in migration
      const stats = await prisma.$queryRaw<any[]>`
        SELECT * FROM get_companies_batch(${companyNames})
      `;

      const result: BatchCompanyStats = {};
      stats.forEach(stat => {
        result[stat.company] = {
          totalJobs: Number(stat.total_jobs),
          recentJobs: Number(stat.recent_jobs),
          avgSalaryMin: stat.avg_salary_min
            ? Number(stat.avg_salary_min)
            : undefined,
          avgSalaryMax: stat.avg_salary_max
            ? Number(stat.avg_salary_max)
            : undefined,
        };
      });

      await setCache(cacheKey, result, { ttl: DEFAULT_TTL.medium });
      return result;
    } catch (error) {
      console.error('Batch company stats error:', error);
      return {};
    }
  }

  /**
   * Get jobs by company with optimized query
   * Uses company index and prevents N+1 queries
   */
  static async getJobsByCompanyOptimized(
    companyName: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<JobWithCompanyStats[]> {
    const cacheKey = `${this.CACHE_PREFIX}:company:${companyName}:${limit}:${offset}`;
    const cached = await getCache<JobWithCompanyStats[]>(cacheKey);
    if (cached) return cached;

    try {
      // Use company index for efficient lookup
      const jobs = await prisma.job.findMany({
        where: {
          company: {
            equals: companyName,
            mode: 'insensitive',
          },
        },
        orderBy: [{ postedAt: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          company: true,
          companyId: true,
          description: true,
          location: true,
          jobType: true,
          categories: true,
          salaryMin: true,
          salaryMax: true,
          postedAt: true,
          createdAt: true,
        },
      });

      // Get company stats for this company
      const companyStats = await this.batchGetCompanyStats([companyName]);

      const jobsWithStats: JobWithCompanyStats[] = jobs.map(job => ({
        ...job,
        companyStats: companyStats[companyName] || undefined,
      }));

      await setCache(cacheKey, jobsWithStats, { ttl: this.CACHE_TTL });
      return jobsWithStats;
    } catch (error) {
      console.error('Get jobs by company error:', error);
      return [];
    }
  }

  /**
   * Build optimized where condition using composite indexes
   */
  private static buildOptimizedWhereCondition(
    params: OptimizedJobQuery
  ): Prisma.JobWhereInput {
    const where: Prisma.JobWhereInput = {};

    // Use composite indexes efficiently
    if (params.location && params.jobType) {
      // Uses Job_location_type_* indexes
      where.AND = [
        { location: { contains: params.location, mode: 'insensitive' } },
        { jobType: params.jobType as any },
      ];
    } else {
      if (params.location) {
        where.location = { contains: params.location, mode: 'insensitive' };
      }
      if (params.jobType) {
        where.jobType = params.jobType as any;
      }
    }

    // Use categories GIN index
    if (params.categories && params.categories.length > 0) {
      where.categories = {
        hasEvery: params.categories,
      };
    }

    // Use salary range index
    if (params.salaryMin || params.salaryMax) {
      const andConditions: Prisma.JobWhereInput[] = where.AND
        ? Array.isArray(where.AND)
          ? where.AND
          : [where.AND]
        : [];

      if (params.salaryMin) {
        andConditions.push({ salaryMin: { gte: params.salaryMin } });
      }
      if (params.salaryMax) {
        andConditions.push({ salaryMax: { lte: params.salaryMax } });
      }

      where.AND = andConditions;
    }

    // Use company index
    if (params.companyIds && params.companyIds.length > 0) {
      where.companyId = { in: params.companyIds };
    }

    // Use remote partial index
    if (params.isRemote !== undefined) {
      if (params.isRemote) {
        where.OR = [
          { location: { contains: 'remote', mode: 'insensitive' } },
          { location: { contains: 'anywhere', mode: 'insensitive' } },
        ];
      } else {
        where.NOT = {
          OR: [
            { location: { contains: 'remote', mode: 'insensitive' } },
            { location: { contains: 'anywhere', mode: 'insensitive' } },
          ],
        };
      }
    }

    // Use date index for recent jobs
    if (params.datePosted) {
      const now = new Date();
      let dateThreshold: Date;

      switch (params.datePosted) {
        case '24h':
          dateThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      where.postedAt = { gte: dateThreshold };
    }

    return where;
  }

  /**
   * Build optimized order by using indexes
   */
  private static buildOptimizedOrderBy(
    sortBy?: string,
    sortOrder?: string
  ): Prisma.JobOrderByWithRelationInput[] {
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    switch (sortBy) {
      case 'date':
        // Uses postedAt index
        return [{ postedAt: order }, { createdAt: order }];
      case 'salary':
        // Uses salary range index
        return [
          { salaryMax: order },
          { salaryMin: order },
          { postedAt: 'desc' },
        ];
      case 'relevance':
      default:
        // Uses createdAt index for default relevance
        return [{ createdAt: order }, { postedAt: order }];
    }
  }

  /**
   * Build additional filters for raw queries
   */
  private static buildAdditionalFilters(params: OptimizedJobQuery): string {
    const filters: string[] = [];

    if (params.jobType) {
      filters.push(`AND j."jobType" = '${params.jobType}'`);
    }

    if (params.location) {
      filters.push(`AND j.location ILIKE '%${params.location}%'`);
    }

    if (params.salaryMin) {
      filters.push(`AND j."salaryMin" >= ${params.salaryMin}`);
    }

    if (params.salaryMax) {
      filters.push(`AND j."salaryMax" <= ${params.salaryMax}`);
    }

    if (params.datePosted) {
      const now = new Date();
      let days: number;
      switch (params.datePosted) {
        case '24h':
          days = 1;
          break;
        case '7d':
          days = 7;
          break;
        case '30d':
          days = 30;
          break;
        default:
          days = 30;
      }
      filters.push(`AND j."postedAt" >= NOW() - INTERVAL '${days} days'`);
    }

    return filters.join(' ');
  }

  /**
   * Refresh materialized view for company stats
   */
  static async refreshCompanyStats(): Promise<void> {
    try {
      await prisma.$executeRaw`SELECT refresh_job_stats()`;

      // Invalidate related caches
      await invalidateCache(`${this.CACHE_PREFIX}:company_stats:*`);

      console.log('Company stats materialized view refreshed successfully');
    } catch (error) {
      console.error('Error refreshing company stats:', error);
      throw error;
    }
  }

  /**
   * Get performance monitoring data
   */
  static async getPerformanceMetrics(): Promise<{
    slowQueries: any[];
    indexUsage: any[];
  }> {
    try {
      const [slowQueries, indexUsage] = await Promise.all([
        prisma.$queryRaw`SELECT * FROM "SlowQueryMonitor" LIMIT 10`,
        prisma.$queryRaw`SELECT * FROM "IndexUsageMonitor" WHERE usage_status = 'UNUSED'`,
      ]);

      return {
        slowQueries: slowQueries as any[],
        indexUsage: indexUsage as any[],
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return { slowQueries: [], indexUsage: [] };
    }
  }
}

/**
 * Optimized User Query Service
 * Prevents N+1 queries for user-related operations
 */
export class OptimizedUserQueryService {
  private static readonly CACHE_TTL = DEFAULT_TTL.medium;
  private static readonly CACHE_PREFIX = 'optimized_user';

  /**
   * Get user with all related data in single query
   * Prevents N+1 queries by using includes
   */
  static async getUserWithRelations(userId: string): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}:relations:${userId}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          jobApplications: {
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                  company: true,
                  location: true,
                  jobType: true,
                  postedAt: true,
                },
              },
            },
            orderBy: { appliedAt: 'desc' },
            take: 10,
          },
          alerts: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
          weeklyDigest: true,
          emailLogs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      await setCache(cacheKey, user, { ttl: this.CACHE_TTL });
      return user;
    } catch (error) {
      console.error('Get user with relations error:', error);
      return null;
    }
  }

  /**
   * Batch get users to prevent N+1 queries
   */
  static async batchGetUsers(userIds: string[]): Promise<any[]> {
    if (userIds.length === 0) return [];

    const cacheKey = `${this.CACHE_PREFIX}:batch:${userIds.sort().join(',')}`;
    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profilePictureUrl: true,
          createdAt: true,
        },
      });

      await setCache(cacheKey, users, { ttl: this.CACHE_TTL });
      return users;
    } catch (error) {
      console.error('Batch get users error:', error);
      return [];
    }
  }
}

export default OptimizedJobSearchService;
