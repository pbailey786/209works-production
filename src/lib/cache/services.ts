import { prisma } from '@/lib/database/prisma';
import {
  getCache,
  setCache,
  invalidateCacheByTags,
  generateCacheKey,
  CACHE_PREFIXES,
  DEFAULT_TTL,
  getCacheOrExecute,
} from './redis';
import {
  CursorPaginationParams,
  OffsetPaginationParams,
  SearchFilters,
  PaginatedResponse,
  CursorPaginationMeta,
  OffsetPaginationMeta,
  buildCursorCondition,
  buildSortCondition,
  calculateOffsetPagination,
  generateCursorFromRecord,
  createPaginatedResponse,
  generatePaginationCacheKey,
} from './pagination';

// Job service with caching and pagination
export class JobCacheService {
  private static readonly CACHE_TTL = DEFAULT_TTL.medium;
  private static readonly CACHE_TAGS = {
    jobs: 'jobs',
    jobsByEmployer: 'jobs:employer',
    jobStats: 'jobs:stats',
  };

  // Get paginated jobs with caching
  static async getPaginatedJobs(
    params: (CursorPaginationParams | OffsetPaginationParams) & {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: SearchFilters;
    },
    trackPerformance?: {
      trackDatabaseQuery: () => void;
      trackCacheHit: () => void;
      trackCacheMiss: () => void;
    }
  ): Promise<PaginatedResponse<any>> {
    const startTime = Date.now();
    const { sortBy = 'createdAt', sortOrder = 'desc', filters = {} } = params;

    // Generate cache key
    const cacheKey = generatePaginationCacheKey(
      generateCacheKey(CACHE_PREFIXES.jobs, 'paginated'),
      {
        ...params,
        sortBy,
        sortOrder,
        filters,
      }
    );

    // Try cache first
    const cached = await getCache<PaginatedResponse<any>>(cacheKey);
    if (cached) {
      trackPerformance?.trackCacheHit();
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
        },
      };
    }

    trackPerformance?.trackCacheMiss();

    // Build where condition from filters
    const whereCondition = this.buildJobWhereCondition(filters);
    const orderBy = this.buildJobSortCondition(sortBy, sortOrder);

    let data: any[] = [];
    let pagination: CursorPaginationMeta | OffsetPaginationMeta;

    if ('cursor' in params) {
      // Cursor-based pagination
      const { cursor, limit, direction = 'forward' } = params;

      let cursorCondition = {};
      if (cursor) {
        cursorCondition = buildCursorCondition(
          cursor,
          sortBy,
          direction,
          sortOrder
        );
      }

      trackPerformance?.trackDatabaseQuery();
      data = await prisma.job.findMany({
        where: {
          ...whereCondition,
          ...cursorCondition,
        },
        orderBy,
        take: limit + 1, // Get one extra to check if there's a next page
        include: {
          companyRef: {
            select: {
              id: true,
              name: true,
              website: true,
              logo: true,
              subscriptionTier: true,
            },
          },
          jobApplications: {
            select: {
              id: true,
              userId: true,
              appliedAt: true,
              status: true,
            },
            take: 5, // Limit to prevent large data loads
          },
        },
      });

      const hasNextPage = data.length > limit;
      if (hasNextPage) {
        data.pop(); // Remove the extra record
      }

      const nextCursor =
        hasNextPage && data.length > 0
          ? generateCursorFromRecord(data[data.length - 1], sortBy)
          : undefined;

      const prevCursor =
        cursor && data.length > 0
          ? generateCursorFromRecord(data[0], sortBy)
          : undefined;

      pagination = {
        hasNextPage,
        hasPrevPage: !!cursor,
        nextCursor,
        prevCursor,
      };
    } else {
      // Offset pagination
      const offsetParams = params as OffsetPaginationParams;
      const page = 'page' in offsetParams ? offsetParams.page : 1;
      const limit = offsetParams.limit;
      const totalCount = await prisma.job.count({ where: whereCondition });
      const { skip, take, meta } = calculateOffsetPagination(
        page,
        limit,
        totalCount
      );

      trackPerformance?.trackDatabaseQuery();
      data = await prisma.job.findMany({
        where: whereCondition,
        orderBy,
        skip,
        take,
        include: {
          companyRef: {
            select: {
              id: true,
              name: true,
              website: true,
              logo: true,
              subscriptionTier: true,
            },
          },
          jobApplications: {
            select: {
              id: true,
              userId: true,
              appliedAt: true,
              status: true,
            },
            take: 5, // Limit to prevent large data loads
          },
        },
      });

      pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
        limit,
      };
    }

    const queryTime = Date.now() - startTime;
    const response = createPaginatedResponse(data, pagination, {
      queryTime,
      cached: false,
      sortBy,
      sortOrder,
    });

    // Cache the result
    await setCache(cacheKey, response, {
      ttl: this.CACHE_TTL,
      tags: [this.CACHE_TAGS.jobs],
    });

    return response;
  }

  // Get single job with caching
  static async getJobById(
    id: string,
    trackPerformance?: {
      trackDatabaseQuery: () => void;
      trackCacheHit: () => void;
      trackCacheMiss: () => void;
    }
  ): Promise<any | null> {
    const cacheKey = generateCacheKey(CACHE_PREFIXES.jobs, 'single', id);

    return getCacheOrExecute(
      cacheKey,
      async () => {
        trackPerformance?.trackDatabaseQuery();
        const job = await prisma.job.findUnique({
          where: { id },
          include: {
            companyRef: {
              select: {
                id: true,
                name: true,
                website: true,
                logo: true,
                subscriptionTier: true,
              },
            },
            jobApplications: {
              select: {
                id: true,
                userId: true,
                appliedAt: true,
                status: true,
              },
            },
          },
        });

        if (job) {
          trackPerformance?.trackCacheHit();
        } else {
          trackPerformance?.trackCacheMiss();
        }

        return job;
      },
      {
        ttl: this.CACHE_TTL,
        tags: [this.CACHE_TAGS.jobs, `job:${id}`],
      }
    );
  }

  // Get jobs by employer with caching
  static async getJobsByEmployer(
    employerId: string,
    params: CursorPaginationParams | OffsetPaginationParams
  ): Promise<PaginatedResponse<any>> {
    const cacheKey = generatePaginationCacheKey(
      generateCacheKey(CACHE_PREFIXES.jobs, 'employer', employerId),
      params
    );

    return getCacheOrExecute(
      cacheKey,
      async () => {
        const whereCondition = { companyId: employerId };
        const orderBy = this.buildJobSortCondition('createdAt', 'desc');

        if ('cursor' in params) {
          const { cursor, limit } = params;

          let cursorCondition = {};
          if (cursor) {
            cursorCondition = buildCursorCondition(cursor);
          }

          const data = await prisma.job.findMany({
            where: { ...whereCondition, ...cursorCondition },
            orderBy,
            take: limit + 1,
            include: {
              companyRef: {
                select: {
                  id: true,
                  name: true,
                  website: true,
                  logo: true,
                  subscriptionTier: true,
                },
              },
            },
          });

          const hasNextPage = data.length > limit;
          if (hasNextPage) data.pop();

          const pagination: CursorPaginationMeta = {
            hasNextPage,
            hasPrevPage: !!cursor,
            nextCursor: hasNextPage
              ? generateCursorFromRecord(data[data.length - 1])
              : undefined,
          };

          return createPaginatedResponse(data, pagination, {
            queryTime: 0,
            cached: false,
          });
        } else {
          const offsetParams = params as OffsetPaginationParams;
          const page = 'page' in offsetParams ? offsetParams.page : 1;
          const limit = offsetParams.limit;
          const totalCount = await prisma.job.count({ where: whereCondition });
          const { skip, take, meta } = calculateOffsetPagination(
            page,
            limit,
            totalCount
          );

          const data = await prisma.job.findMany({
            where: whereCondition,
            orderBy,
            skip,
            take,
            include: {
              companyRef: {
                select: {
                  id: true,
                  name: true,
                  website: true,
                  logo: true,
                  subscriptionTier: true,
                },
              },
            },
          });

          return createPaginatedResponse(data, meta, {
            queryTime: 0,
            cached: false,
          });
        }
      },
      {
        ttl: this.CACHE_TTL,
        tags: [
          this.CACHE_TAGS.jobs,
          this.CACHE_TAGS.jobsByEmployer,
          `employer:${employerId}`,
        ],
      }
    );
  }

  // Invalidate job caches
  static async invalidateJobCaches(
    jobId?: string,
    employerId?: string
  ): Promise<void> {
    const tags = [this.CACHE_TAGS.jobs];

    if (jobId) {
      tags.push(`job:${jobId}`);
    }

    if (employerId) {
      tags.push(this.CACHE_TAGS.jobsByEmployer, `employer:${employerId}`);
    }

    await invalidateCacheByTags(tags);
  }

  // Build where condition for job search
  private static buildJobWhereCondition(filters: SearchFilters): any {
    const where: any = {};

    // Text search
    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { company: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    // Location filter
    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    // Job type filter
    if (filters.jobType) {
      where.jobType = filters.jobType;
    }

    // Salary filters
    if (filters.salaryMin || filters.salaryMax) {
      where.salaryMin = {};
      if (filters.salaryMin) {
        where.salaryMin.gte = filters.salaryMin;
      }
      if (filters.salaryMax) {
        where.salaryMax = { lte: filters.salaryMax };
      }
    }

    // Company filter
    if (filters.company) {
      where.company = { contains: filters.company, mode: 'insensitive' };
    }

    // Remote filter
    if (filters.remote === 'true') {
      where.isRemote = true;
    } else if (filters.remote === 'false') {
      where.isRemote = false;
    }

    // Date posted filter
    if (filters.datePosted) {
      const now = new Date();
      let dateThreshold: Date;

      switch (filters.datePosted) {
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
          dateThreshold = new Date(0);
      }

      where.createdAt = { gte: dateThreshold };
    }

    return where;
  }

  // Build sort condition that prioritizes featured jobs
  private static buildJobSortCondition(sortBy: string, sortOrder: 'asc' | 'desc'): any {
    const primarySort = buildSortCondition(sortBy, sortOrder);
    
    // Always prioritize featured jobs first, then apply user sorting
    return [
      { featured: 'desc' }, // Featured jobs first (true = 1, false = 0, so desc puts true first)
      ...Array.isArray(primarySort) ? primarySort : [primarySort]
    ];
  }
}

// User service with caching
export class UserCacheService {
  private static readonly CACHE_TTL = DEFAULT_TTL.long;
  private static readonly CACHE_TAGS = {
    users: 'users',
    userProfiles: 'users:profiles',
  };

  // Get user by ID with caching
  static async getUserById(
    id: string,
    trackPerformance?: {
      trackDatabaseQuery: () => void;
      trackCacheHit: () => void;
      trackCacheMiss: () => void;
    }
  ): Promise<any | null> {
    const cacheKey = generateCacheKey(CACHE_PREFIXES.users, 'profile', id);

    return getCacheOrExecute(
      cacheKey,
      async () => {
        trackPerformance?.trackDatabaseQuery();
        return await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            profilePictureUrl: true,
            resumeUrl: true,
            skills: true,
            companyWebsite: true,
            phoneNumber: true,
            location: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      },
      {
        ttl: this.CACHE_TTL,
        tags: [this.CACHE_TAGS.users, `user:${id}`],
      }
    );
  }

  // Get user applications with pagination
  static async getUserApplications(
    userId: string,
    params: CursorPaginationParams | OffsetPaginationParams
  ): Promise<PaginatedResponse<any>> {
    const cacheKey = generatePaginationCacheKey(
      generateCacheKey(CACHE_PREFIXES.users, 'applications', userId),
      params
    );

    return getCacheOrExecute(
      cacheKey,
      async () => {
        const whereCondition = { userId };
        const orderBy = buildSortCondition('appliedAt', 'desc');

        if ('cursor' in params) {
          const { cursor, limit } = params;

          let cursorCondition = {};
          if (cursor) {
            cursorCondition = buildCursorCondition(cursor, 'appliedAt');
          }

          const data = await prisma.jobApplication.findMany({
            where: { ...whereCondition, ...cursorCondition },
            orderBy,
            take: limit + 1,
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                  company: true,
                  location: true,
                  jobType: true,
                },
              },
            },
          });

          const hasNextPage = data.length > limit;
          if (hasNextPage) data.pop();

          const pagination: CursorPaginationMeta = {
            hasNextPage,
            hasPrevPage: !!cursor,
            nextCursor: hasNextPage
              ? generateCursorFromRecord(data[data.length - 1], 'appliedAt')
              : undefined,
          };

          return createPaginatedResponse(data, pagination, {
            queryTime: 0,
            cached: false,
          });
        } else {
          const offsetParams = params as OffsetPaginationParams;
          const page = 'page' in offsetParams ? offsetParams.page : 1;
          const limit = offsetParams.limit;
          const totalCount = await prisma.jobApplication.count({
            where: whereCondition,
          });
          const { skip, take, meta } = calculateOffsetPagination(
            page,
            limit,
            totalCount
          );

          const data = await prisma.jobApplication.findMany({
            where: whereCondition,
            orderBy,
            skip,
            take,
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                  company: true,
                  location: true,
                  jobType: true,
                },
              },
            },
          });

          return createPaginatedResponse(data, meta, {
            queryTime: 0,
            cached: false,
          });
        }
      },
      {
        ttl: DEFAULT_TTL.short, // Applications change frequently
        tags: [this.CACHE_TAGS.users, `user:${userId}:applications`],
      }
    );
  }

  // Invalidate user caches
  static async invalidateUserCaches(userId: string): Promise<void> {
    await invalidateCacheByTags([
      this.CACHE_TAGS.users,
      `user:${userId}`,
      `user:${userId}:applications`,
    ]);
  }
}

// Search service with caching
export class SearchCacheService {
  private static readonly CACHE_TTL = DEFAULT_TTL.short; // Search results change frequently

  // Cached search with pagination
  static async searchJobs(
    query: string,
    filters: SearchFilters,
    params: CursorPaginationParams | OffsetPaginationParams
  ): Promise<PaginatedResponse<any>> {
    const cacheKey = generatePaginationCacheKey(
      generateCacheKey(CACHE_PREFIXES.search, 'jobs', query),
      {
        ...params,
        filters,
      }
    );

    return getCacheOrExecute(
      cacheKey,
      async () => {
        return JobCacheService.getPaginatedJobs({
          ...params,
          filters: { ...filters, q: query },
        });
      },
      {
        ttl: this.CACHE_TTL,
        tags: ['search', 'jobs'],
      }
    );
  }
}
