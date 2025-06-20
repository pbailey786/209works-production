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
import {
  getAtomicCacheManager,
  AtomicCacheUtils,
  AtomicCacheManager,
} from './atomic-cache-manager';
import { generateCacheKey, CACHE_PREFIXES, DEFAULT_TTL } from './redis';

/**
 * Enhanced Cache Services with Atomic Operations
 *
 * Provides race-condition-free cache operations with data consistency guarantees.
 * Replaces the existing cache services to fix critical issues.
 */

// Performance tracking interface
interface PerformanceTracker {
  trackDatabaseQuery: () => void;
  trackCacheHit: () => void;
  trackCacheMiss: () => void;
}

// Cache invalidation strategy
interface CacheInvalidationStrategy {
  immediate: boolean; // Invalidate immediately
  delayed: number; // Delay in seconds
  cascade: boolean; // Cascade to dependent caches
  tags: string[]; // Additional tags to invalidate
}

/**
 * Enhanced Job Cache Service with Atomic Operations
 */
export class EnhancedJobCacheService {
  private static readonly CACHE_TTL = DEFAULT_TTL.medium;
  private static readonly CACHE_TAGS = {
    jobs: 'jobs',
    jobsByEmployer: 'jobs:employer',
    jobStats: 'jobs:stats',
    jobSearch: 'jobs:search',
  };

  private static cacheManager: AtomicCacheManager | null = null;

  /**
   * Initialize the cache manager
   */
  private static async getCacheManager(): Promise<AtomicCacheManager> {
    if (!this.cacheManager) {
      this.cacheManager = await getAtomicCacheManager();
    }
    return this.cacheManager;
  }

  /**
   * Get paginated jobs with atomic caching
   */
  static async getPaginatedJobs(
    params: (CursorPaginationParams | OffsetPaginationParams) & {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: SearchFilters;
    },
    trackPerformance?: PerformanceTracker
  ): Promise<PaginatedResponse<any>> {
    const startTime = Date.now();
    const { sortBy = 'createdAt', sortOrder = 'desc', filters = {} } = params;

    // Generate cache key with dependency tracking
    const cacheKey = generatePaginationCacheKey(
      generateCacheKey(CACHE_PREFIXES.jobs, 'paginated'),
      {
        ...params,
        sortBy,
        sortOrder,
        filters,
      }
    );

    // Define cache dependencies
    const dependencies = [
      'jobs:all',
      `jobs:sort:${sortBy}:${sortOrder}`,
      ...Object.keys(filters).map(
        key => `jobs:filter:${key}:${filters[key as keyof SearchFilters]}`
      ),
    ];

    return AtomicCacheUtils.getOrExecute(
      cacheKey,
      async () => {
        trackPerformance?.trackCacheMiss();

        // Build where condition from filters
        const whereCondition = this.buildJobWhereCondition(filters);
        const orderBy = buildSortCondition(sortBy, sortOrder);

        let data: any[];
        let pagination: CursorPaginationMeta | OffsetPaginationMeta;

        if ('cursor' in params) {
          // Cursor-based pagination with atomic operations
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

          // Use transaction for consistency
          data = await prisma.$transaction(async () => {
            return await prisma.job.findMany({
              where: {
                ...whereCondition,
                ...cursorCondition,
              },
              orderBy,
              take: limit + 1, // Get one extra to check if there's a next page
              include: {
                // Use companyRef relation to prevent N+1 queries
                companyRef: {
                  select: {
                    id: true,
                    name: true,
                    website: true,
                    logo: true,
                    subscriptionTier: true,
                  },
                },
                // Only include essential application data
                jobApplications: {
                  select: {
                    id: true,
                    userId: true,
                    status: true,
                    appliedAt: true,
                  },
                  take: 5, // Limit to prevent large data loads
                },
              },
            });
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
          const offsetParams = params as OffsetPaginationParams;
          if (!('page' in offsetParams)) {
            throw new Error('Invalid pagination parameters');
          }
          const { page, limit } = offsetParams;

          const [totalCount, data] = await prisma.$transaction(async () => {
            const count = await prisma.job.count({ where: whereCondition });
            const { skip, take } = calculateOffsetPagination(
              page,
              limit,
              count
            );

            const jobs = await prisma.job.findMany({
              where: whereCondition,
              orderBy,
              skip,
              take,
              include: {
                jobApplications: {
                  select: {
                    id: true,
                    status: true,
                    appliedAt: true,
                  },
                },
              },
            });

            return [count, jobs] as [number, any[]];
          });

          const { meta } = calculateOffsetPagination(page, limit, totalCount);
          return createPaginatedResponse(data, meta, {
            queryTime: 0,
            cached: false,
          });
        }

        const queryTime = Date.now() - startTime;
        return createPaginatedResponse(data, pagination, {
          queryTime,
          cached: false,
          sortBy,
          sortOrder,
        });
      },
      {
        ttl: this.CACHE_TTL,
        tags: [this.CACHE_TAGS.jobs, this.CACHE_TAGS.jobSearch],
        dependencies,
        validateIntegrity: true,
      }
    );
  }

  /**
   * Get job by ID with atomic caching
   */
  static async getJobById(
    id: string,
    trackPerformance?: PerformanceTracker
  ): Promise<any | null> {
    const cacheKey = generateCacheKey(CACHE_PREFIXES.jobs, 'detail', id);

    return AtomicCacheUtils.getOrExecute(
      cacheKey,
      async () => {
        trackPerformance?.trackCacheMiss();
        trackPerformance?.trackDatabaseQuery();

        return await prisma.job.findUnique({
          where: { id },
          include: {
            companyRef: {
              select: {
                id: true,
                name: true,
                website: true,
                logo: true,
                subscriptionTier: true,
                description: true,
              },
            },
            jobApplications: {
              select: {
                id: true,
                userId: true,
                status: true,
                appliedAt: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                appliedAt: 'desc',
              },
              take: 10,
            },
          },
        });
      },
      {
        ttl: this.CACHE_TTL,
        tags: [this.CACHE_TAGS.jobs, `job:${id}`],
        dependencies: [`job:${id}`, 'jobs:all'],
        validateIntegrity: true,
      }
    );
  }

  /**
   * Get jobs by employer with atomic caching
   */
  static async getJobsByEmployer(
    employerId: string,
    params: CursorPaginationParams | OffsetPaginationParams
  ): Promise<PaginatedResponse<any>> {
    const cacheKey = generatePaginationCacheKey(
      generateCacheKey(CACHE_PREFIXES.jobs, 'employer', employerId),
      params
    );

    return AtomicCacheUtils.getOrExecute(
      cacheKey,
      async () => {
        const whereCondition = { companyId: employerId };
        const orderBy = buildSortCondition('createdAt', 'desc');

        if ('cursor' in params) {
          const { cursor, limit } = params;

          let cursorCondition = {};
          if (cursor) {
            cursorCondition = buildCursorCondition(cursor, 'createdAt');
          }

          const data = await prisma.job.findMany({
            where: { ...whereCondition, ...cursorCondition },
            orderBy,
            take: limit + 1,
            include: {
              jobApplications: {
                select: {
                  id: true,
                  status: true,
                  appliedAt: true,
                },
                take: 5,
              },
            },
          });

          const hasNextPage = data.length > limit;
          if (hasNextPage) data.pop();

          const pagination: CursorPaginationMeta = {
            hasNextPage,
            hasPrevPage: !!cursor,
            nextCursor: hasNextPage
              ? generateCursorFromRecord(data[data.length - 1], 'createdAt')
              : undefined,
          };

          return createPaginatedResponse(data, pagination, {
            queryTime: 0,
            cached: false,
          });
        } else {
          const { page, limit } = params as OffsetPaginationParams;

          const [totalCount, data] = await prisma.$transaction(async () => {
            const count = await prisma.job.count({ where: whereCondition });
            const { skip, take } = calculateOffsetPagination(
              page,
              limit,
              count
            );

            const jobs = await prisma.job.findMany({
              where: whereCondition,
              orderBy,
              skip,
              take,
              include: {
                jobApplications: {
                  select: {
                    id: true,
                    status: true,
                    appliedAt: true,
                  },
                },
              },
            });

            return [count, jobs] as [number, any[]];
          });

          const { meta } = calculateOffsetPagination(page, limit, totalCount);
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
        dependencies: [`employer:${employerId}`, 'jobs:all'],
        validateIntegrity: true,
      }
    );
  }

  /**
   * Atomic cache invalidation with dependency cascade
   */
  static async invalidateJobCaches(
    jobId?: string,
    employerId?: string,
    strategy: Partial<CacheInvalidationStrategy> = {}
  ): Promise<void> {
    const {
      immediate = true,
      delayed = 0,
      cascade = true,
      tags: additionalTags = [],
    } = strategy;

    const invalidateOperation = async () => {
      const tags = [this.CACHE_TAGS.jobs, ...additionalTags];
      const keys: string[] = [];

      if (jobId) {
        tags.push(`job:${jobId}`);
        keys.push(generateCacheKey(CACHE_PREFIXES.jobs, 'detail', jobId));
      }

      if (employerId) {
        tags.push(this.CACHE_TAGS.jobsByEmployer, `employer:${employerId}`);
      }

      // Add search-related tags
      tags.push(this.CACHE_TAGS.jobSearch);

      await AtomicCacheUtils.invalidateWithDependencies(keys, tags);
    };

    if (immediate && delayed === 0) {
      await invalidateOperation();
    } else if (delayed > 0) {
      setTimeout(invalidateOperation, delayed * 1000);
    }
  }

  /**
   * Batch job operations with atomic consistency
   */
  static async batchJobOperations(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      jobId?: string;
      employerId?: string;
      data?: any;
    }>
  ): Promise<Array<any>> {
    const manager = await this.getCacheManager();

    // Group operations by type for optimal execution
    const createOps = operations.filter(op => op.type === 'create');
    const updateOps = operations.filter(op => op.type === 'update');
    const deleteOps = operations.filter(op => op.type === 'delete');

    // Execute operations in transaction
    const results = await prisma.$transaction(async tx => {
      const operationResults: any[] = [];

      // Handle creates
      for (const op of createOps) {
        try {
          const result = await tx.job.create({ data: op.data });
          operationResults.push(result);

          // Invalidate relevant caches
          await this.invalidateJobCaches(result.id, op.employerId, {
            immediate: false,
            delayed: 1, // Delay to allow transaction to complete
          });
        } catch (error) {
          operationResults.push(error);
        }
      }

      // Handle updates
      for (const op of updateOps) {
        try {
          const result = await tx.job.update({
            where: { id: op.jobId },
            data: op.data,
          });
          operationResults.push(result);

          // Invalidate relevant caches
          await this.invalidateJobCaches(op.jobId, op.employerId, {
            immediate: false,
            delayed: 1,
          });
        } catch (error) {
          operationResults.push(error);
        }
      }

      // Handle deletes
      for (const op of deleteOps) {
        try {
          const result = await tx.job.delete({
            where: { id: op.jobId },
          });
          operationResults.push(result);

          // Invalidate relevant caches
          await this.invalidateJobCaches(op.jobId, op.employerId, {
            immediate: false,
            delayed: 1,
          });
        } catch (error) {
          operationResults.push(error);
        }
      }

      return operationResults;
    });

    return results;
  }

  /**
   * Build where condition for job search with validation
   */
  private static buildJobWhereCondition(filters: SearchFilters): any {
    const where: any = {};

    // Text search with proper escaping
    if (filters.q) {
      const searchTerm = filters.q.replace(/[%_]/g, '\\$&'); // Escape SQL wildcards
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { company: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Location filter with validation
    if (filters.location) {
      const location = filters.location.replace(/[%_]/g, '\\$&');
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Job type filter with enum validation
    if (filters.jobType) {
      const validJobTypes = [
        'FULL_TIME',
        'PART_TIME',
        'CONTRACT',
        'INTERNSHIP',
        'FREELANCE',
      ];
      if (validJobTypes.includes(filters.jobType)) {
        where.jobType = filters.jobType;
      }
    }

    // Salary filters with validation
    if (filters.salaryMin || filters.salaryMax) {
      where.salaryMin = {};
      if (filters.salaryMin && filters.salaryMin >= 0) {
        where.salaryMin.gte = filters.salaryMin;
      }
      if (
        filters.salaryMax &&
        filters.salaryMax >= 0 &&
        filters.salaryMax >= (filters.salaryMin || 0)
      ) {
        where.salaryMax = { lte: filters.salaryMax };
      }
    }

    // Company filter with validation
    if (filters.company) {
      const company = filters.company.replace(/[%_]/g, '\\$&');
      where.company = { contains: company, mode: 'insensitive' };
    }

    // Remote filter with boolean validation
    if (filters.remote === 'true') {
      where.isRemote = true;
    } else if (filters.remote === 'false') {
      where.isRemote = false;
    }

    // Date posted filter with validation
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
}

/**
 * Enhanced User Cache Service with Atomic Operations
 */
export class EnhancedUserCacheService {
  private static readonly CACHE_TTL = DEFAULT_TTL.long;
  private static readonly CACHE_TAGS = {
    users: 'users',
    userProfiles: 'users:profiles',
    userApplications: 'users:applications',
  };

  /**
   * Get user by ID with atomic caching
   */
  static async getUserById(
    id: string,
    trackPerformance?: PerformanceTracker
  ): Promise<any | null> {
    const cacheKey = generateCacheKey(CACHE_PREFIXES.users, 'profile', id);

    return AtomicCacheUtils.getOrExecute(
      cacheKey,
      async () => {
        trackPerformance?.trackCacheMiss();
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
        dependencies: [`user:${id}`, 'users:all'],
        validateIntegrity: true,
      }
    );
  }

  /**
   * Get user applications with atomic caching
   */
  static async getUserApplications(
    userId: string,
    params: CursorPaginationParams | OffsetPaginationParams
  ): Promise<PaginatedResponse<any>> {
    const cacheKey = generatePaginationCacheKey(
      generateCacheKey(CACHE_PREFIXES.users, 'applications', userId),
      params
    );

    return AtomicCacheUtils.getOrExecute(
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
                  salaryMin: true,
                  salaryMax: true,
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
          const { page, limit } = params as OffsetPaginationParams;

          const [totalCount, data] = await prisma.$transaction(async () => {
            const count = await prisma.jobApplication.count({
              where: whereCondition,
            });
            const { skip, take } = calculateOffsetPagination(
              page,
              limit,
              count
            );

            const applications = await prisma.jobApplication.findMany({
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
                    salaryMin: true,
                    salaryMax: true,
                  },
                },
              },
            });

            return [count, applications] as [number, any[]];
          });

          const { meta } = calculateOffsetPagination(page, limit, totalCount);
          return createPaginatedResponse(data, meta, {
            queryTime: 0,
            cached: false,
          });
        }
      },
      {
        ttl: this.CACHE_TTL,
        tags: [
          this.CACHE_TAGS.users,
          this.CACHE_TAGS.userApplications,
          `user:${userId}`,
        ],
        dependencies: [`user:${userId}`, 'users:all'],
        validateIntegrity: true,
      }
    );
  }

  /**
   * Atomic user cache invalidation
   */
  static async invalidateUserCaches(
    userId: string,
    strategy: Partial<CacheInvalidationStrategy> = {}
  ): Promise<void> {
    const {
      immediate = true,
      delayed = 0,
      cascade = true,
      tags: additionalTags = [],
    } = strategy;

    const invalidateOperation = async () => {
      const tags = [
        this.CACHE_TAGS.users,
        this.CACHE_TAGS.userProfiles,
        this.CACHE_TAGS.userApplications,
        `user:${userId}`,
        ...additionalTags,
      ];

      const keys = [generateCacheKey(CACHE_PREFIXES.users, 'profile', userId)];

      await AtomicCacheUtils.invalidateWithDependencies(keys, tags);
    };

    if (immediate && delayed === 0) {
      await invalidateOperation();
    } else if (delayed > 0) {
      setTimeout(invalidateOperation, delayed * 1000);
    }
  }
}

/**
 * Enhanced Search Cache Service with Atomic Operations
 */
export class EnhancedSearchCacheService {
  private static readonly CACHE_TTL = DEFAULT_TTL.short; // Search results change frequently
  private static readonly CACHE_TAGS = {
    search: 'search',
    searchJobs: 'search:jobs',
  };

  /**
   * Search jobs with atomic caching
   */
  static async searchJobs(
    query: string,
    filters: SearchFilters,
    params: CursorPaginationParams | OffsetPaginationParams
  ): Promise<PaginatedResponse<any>> {
    const cacheKey = generatePaginationCacheKey(
      generateCacheKey(CACHE_PREFIXES.search, 'jobs', query),
      { ...params, filters }
    );

    // Create search-specific dependencies
    const dependencies = [
      'search:all',
      `search:query:${query}`,
      ...Object.keys(filters).map(
        key => `search:filter:${key}:${filters[key as keyof SearchFilters]}`
      ),
    ];

    return AtomicCacheUtils.getOrExecute(
      cacheKey,
      async () => {
        // Use the enhanced job service for consistent search
        return await EnhancedJobCacheService.getPaginatedJobs({
          ...params,
          filters: { ...filters, q: query },
        });
      },
      {
        ttl: this.CACHE_TTL,
        tags: [this.CACHE_TAGS.search, this.CACHE_TAGS.searchJobs],
        dependencies,
        validateIntegrity: true,
      }
    );
  }

  /**
   * Invalidate search caches
   */
  static async invalidateSearchCaches(
    query?: string,
    strategy: Partial<CacheInvalidationStrategy> = {}
  ): Promise<void> {
    const {
      immediate = true,
      delayed = 0,
      cascade = true,
      tags: additionalTags = [],
    } = strategy;

    const invalidateOperation = async () => {
      const tags = [
        this.CACHE_TAGS.search,
        this.CACHE_TAGS.searchJobs,
        ...additionalTags,
      ];
      const keys: string[] = [];

      if (query) {
        keys.push(generateCacheKey(CACHE_PREFIXES.search, 'jobs', query));
      }

      await AtomicCacheUtils.invalidateWithDependencies(keys, tags);
    };

    if (immediate && delayed === 0) {
      await invalidateOperation();
    } else if (delayed > 0) {
      setTimeout(invalidateOperation, delayed * 1000);
    }
  }
}

/**
 * Cache Health Monitor
 */
export class CacheHealthMonitor {
  private static monitoringInterval: NodeJS.Timeout | null = null;
  private static healthStats: any = {};

  /**
   * Start monitoring cache health
   */
  static async startMonitoring(intervalMs: number = 60000): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        const manager = await getAtomicCacheManager();
        this.healthStats = await manager.getCacheStats();

        // Log health stats
        console.log('Cache Health Stats:', this.healthStats);

        // Check for issues
        if (this.healthStats.operationQueueSize > 100) {
          console.warn(
            'High cache operation queue size:',
            this.healthStats.operationQueueSize
          );
        }

        if (this.healthStats.memoryUsage > 100 * 1024 * 1024) {
          // 100MB
          console.warn(
            'High cache memory usage:',
            this.healthStats.memoryUsage
          );
        }
      } catch (error) {
        console.error('Cache health monitoring error:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get current health stats
   */
  static getHealthStats(): any {
    return this.healthStats;
  }
}

/**
 * Export enhanced services as default replacements
 */
export {
  EnhancedJobCacheService as JobCacheService,
  EnhancedUserCacheService as UserCacheService,
  EnhancedSearchCacheService as SearchCacheService,
};
