import { prisma } from '../../app/api/auth/prisma';
import {
  CursorPaginationParams,
  OffsetPaginationParams,
  PaginatedResponse,
  createPaginatedResponse,
  buildSortCondition,
  buildCursorCondition,
  calculateOffsetPagination,
  generateCursorFromRecord,
  generatePaginationCacheKey,
} from '../cache/pagination';
import {
  getCache,
  setCache,
  generateCacheKey,
  CACHE_PREFIXES,
  DEFAULT_TTL,
  getCacheOrExecute,
} from '../cache/redis';
import {
  EnhancedSearchFilters,
  SearchResult,
  TextProcessor,
  RelevanceScorer,
  GeolocationUtils,
  FacetedSearch,
  SEARCH_CONFIG,
} from './algorithms';

// Enhanced search service for jobs
export class EnhancedJobSearchService {
  private static readonly CACHE_TTL = DEFAULT_TTL.short; // Search results change frequently
  private static readonly CACHE_TAGS = ['search', 'jobs'];

  // Enhanced job search with relevance scoring and geolocation
  static async searchJobsEnhanced(
    query: string,
    filters: EnhancedSearchFilters,
    pagination: CursorPaginationParams | OffsetPaginationParams,
    trackPerformance?: {
      trackDatabaseQuery: () => void;
      trackCacheHit: () => void;
      trackCacheMiss: () => void;
    }
  ): Promise<PaginatedResponse<SearchResult<any>>> {
    const startTime = Date.now();

    // Generate cache key
    const cacheKey = generatePaginationCacheKey(
      generateCacheKey(CACHE_PREFIXES.search, 'jobs-enhanced', query),
      {
        ...pagination,
        filters,
      }
    );

    // Try cache first
    const cached =
      await getCache<PaginatedResponse<SearchResult<any>>>(cacheKey);
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

    // Build database query conditions
    const whereCondition = await this.buildEnhancedWhereCondition(
      query,
      filters
    );

    // Execute database queries
    let jobs: any[];
    let totalCount: number;
    let paginationMeta: any;

    if ('cursor' in pagination) {
      // Cursor-based pagination
      const { cursor, limit } = pagination;

      let cursorCondition = {};
      if (cursor) {
        cursorCondition = buildCursorCondition(
          cursor,
          'createdAt',
          'forward',
          'desc'
        );
      }

      trackPerformance?.trackDatabaseQuery();
      // Get total count for cursor pagination
      totalCount = await prisma.job.count({ where: whereCondition });

      // Use optimized query with proper includes to prevent N+1
      jobs = await prisma.job.findMany({
        where: {
          ...whereCondition,
          ...cursorCondition,
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // Get one extra to check if there's a next page
        include: {
          // Use companyRef relation instead of employer
          companyRef: {
            select: {
              id: true,
              name: true,
              website: true,
              logo: true,
              subscriptionTier: true,
            },
          },
          // Limit job applications to prevent large data loads
          jobApplications: {
            select: {
              id: true,
              userId: true,
              status: true,
            },
            take: 3,
          },
        },
      });

      const hasNextPage = jobs.length > limit;
      if (hasNextPage) {
        jobs.pop(); // Remove the extra record
      }

      const nextCursor =
        hasNextPage && jobs.length > 0
          ? generateCursorFromRecord(jobs[jobs.length - 1], 'createdAt')
          : undefined;

      const prevCursor =
        cursor && jobs.length > 0
          ? generateCursorFromRecord(jobs[0], 'createdAt')
          : undefined;

      paginationMeta = {
        hasNextPage,
        hasPrevPage: !!cursor,
        nextCursor,
        prevCursor,
        totalCount,
      };
    } else {
      // Offset-based pagination
      const { page, limit } = pagination as OffsetPaginationParams;
      const { skip, take } = calculateOffsetPagination(page, limit, 0); // We'll get real totalCount below

      trackPerformance?.trackDatabaseQuery();
      // Use optimized parallel queries with proper includes and skip/take
      [jobs, totalCount] = await Promise.all([
        prisma.job.findMany({
          where: whereCondition,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: {
            // Use companyRef relation instead of employer
            companyRef: {
              select: {
                id: true,
                name: true,
                website: true,
                logo: true,
                subscriptionTier: true,
              },
            },
            // Limit job applications to prevent large data loads
            jobApplications: {
              select: {
                id: true,
                userId: true,
                status: true,
              },
              take: 3,
            },
          },
        }),
        prisma.job.count({ where: whereCondition }),
      ]);

      const { meta } = calculateOffsetPagination(page, limit, totalCount);
      paginationMeta = meta;
    }

    // Apply relevance scoring and filtering to the paginated results
    const scoredResults = this.scoreAndFilterResults(jobs, query, filters);

    // Generate facets (optional feature)
    const facets = (filters as any).includeFacets
      ? FacetedSearch.generateFacets(jobs, 'jobs')
      : undefined;

    const queryTime = Date.now() - startTime;
    const response = createPaginatedResponse(scoredResults, paginationMeta, {
      queryTime,
      cached: false,
      sortBy: 'relevance',
      sortOrder: 'desc',
      ...(facets && { facets }),
    });

    // Cache the result
    await setCache(cacheKey, response, {
      ttl: this.CACHE_TTL,
      tags: this.CACHE_TAGS,
    });

    return response;
  }

  // Build enhanced database where condition
  private static async buildEnhancedWhereCondition(
    query: string,
    filters: EnhancedSearchFilters
  ): Promise<any> {
    const where: any = {};
    const conditions: any[] = [];

    // Basic text search conditions
    if (query && query.length >= SEARCH_CONFIG.fullText.minQueryLength) {
      const searchTerms = TextProcessor.generateSearchTerms(query);

      const textSearchConditions = {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          ...searchTerms.map(term => ({
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
              { company: { contains: term, mode: 'insensitive' } },
            ],
          })),
        ],
      };

      conditions.push(textSearchConditions);
    }

    // Location-based filtering
    if (filters.location && !filters.lat && !filters.lng) {
      // Try to geocode the location for geospatial search
      const coords = await GeolocationUtils.geocodeLocation(filters.location);
      if (coords) {
        filters.lat = coords.lat;
        filters.lng = coords.lng;
        filters.radius =
          filters.radius || SEARCH_CONFIG.geolocation.defaultRadius;
      } else {
        // Fall back to text-based location search
        conditions.push({
          location: { contains: filters.location, mode: 'insensitive' },
        });
      }
    }

    // Geolocation search
    if (filters.lat && filters.lng && filters.radius) {
      const boundingBox = GeolocationUtils.getBoundingBox(
        filters.lat,
        filters.lng,
        Math.min(filters.radius, SEARCH_CONFIG.geolocation.maxRadius)
      );

      // Note: For production, you'd want to add lat/lng columns to the job table
      // For now, we'll filter by location text as a fallback
      if (boundingBox) {
        conditions.push({
          OR: [
            { latitude: { gte: boundingBox.minLat, lte: boundingBox.maxLat } },
            { longitude: { gte: boundingBox.minLng, lte: boundingBox.maxLng } },
            // Fallback to text search if no coordinates
            {
              location: {
                contains: filters.location || '',
                mode: 'insensitive',
              },
            },
          ],
        });
      } else {
        // Fallback to text search if bounding box calculation failed
        conditions.push({
          location: { contains: filters.location || '', mode: 'insensitive' },
        });
      }
    }

    // Standard filters
    if (filters.jobType) {
      conditions.push({ jobType: filters.jobType });
    }

    if (filters.company) {
      conditions.push({
        company: { contains: filters.company, mode: 'insensitive' },
      });
    }

    if (filters.remote === 'true') {
      conditions.push({ isRemote: true });
    } else if (filters.remote === 'false') {
      conditions.push({ isRemote: false });
    }

    // Salary filters
    if (filters.salaryMin || filters.salaryMax) {
      const salaryCondition: any = {};
      if (filters.salaryMin) {
        salaryCondition.salaryMin = { gte: filters.salaryMin };
      }
      if (filters.salaryMax) {
        salaryCondition.salaryMax = { lte: filters.salaryMax };
      }
      conditions.push(salaryCondition);
    }

    // Date posted filter with safe date handling
    if (filters.datePosted && typeof filters.datePosted === 'string') {
      try {
        const now = new Date();

        // Validate current date
        if (isNaN(now.getTime())) {
          console.error('Invalid current date in date filter');
          // Skip date filter if current date is invalid
        } else {
          let dateThreshold: Date | null = null;

          switch (filters.datePosted) {
            case '24h':
              const oneDayMs = 24 * 60 * 60 * 1000;
              if (oneDayMs > 0) {
                dateThreshold = new Date(now.getTime() - oneDayMs);
              }
              break;
            case '7d':
              const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
              if (sevenDaysMs > 0) {
                dateThreshold = new Date(now.getTime() - sevenDaysMs);
              }
              break;
            case '30d':
              const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
              if (thirtyDaysMs > 0) {
                dateThreshold = new Date(now.getTime() - thirtyDaysMs);
              }
              break;
            default:
              // Use epoch time for "all time"
              dateThreshold = new Date(0);
          }

          // Validate the calculated threshold date
          if (
            dateThreshold &&
            !isNaN(dateThreshold.getTime()) &&
            isFinite(dateThreshold.getTime())
          ) {
            conditions.push({ createdAt: { gte: dateThreshold } });
          } else {
            console.warn(
              'Invalid date threshold calculated for filter:',
              filters.datePosted
            );
          }
        }
      } catch (error) {
        console.error('Error processing date filter:', error);
        // Continue without date filter if there's an error
      }
    }

    // Skills filter (if job has skills/categories)
    if (filters.skills && filters.skills.length > 0) {
      conditions.push({
        OR: [
          { categories: { hasSome: filters.skills } },
          // Fallback for text-based skills search
          ...filters.skills.map(skill => ({
            description: { contains: skill, mode: 'insensitive' },
          })),
        ],
      });
    }

    // Combine all conditions
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    return where;
  }

  // Score and filter results based on relevance
  private static scoreAndFilterResults(
    jobs: any[],
    query: string,
    filters: EnhancedSearchFilters
  ): SearchResult<any>[] {
    const useRelevanceScoring = filters.useRelevanceScoring !== false;

    const results: SearchResult<any>[] = jobs.map(job => {
      const relevanceScore = useRelevanceScoring
        ? RelevanceScorer.scoreJob(job, query, filters)
        : 1;

      const snippet =
        filters.includeSnippets && job.description
          ? TextProcessor.createSnippet(job.description, query)
          : undefined;

      return {
        item: job,
        relevanceScore,
        matchedFields: (job as any)._matchedFields || [],
        snippet,
      };
    });

    // Sort by relevance if using scoring
    if (useRelevanceScoring && query) {
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    // Filter by geolocation if specified
    if (filters.lat && filters.lng && filters.radius) {
      return results.filter(result => {
        const job = result.item;
        // In production, you'd have lat/lng fields in the database
        // For now, we'll assume all jobs pass the geolocation filter
        // since we already filtered at the database level
        return true;
      });
    }

    return results;
  }
}

// User search service
export class UserSearchService {
  private static readonly CACHE_TTL = DEFAULT_TTL.medium;
  private static readonly CACHE_TAGS = ['search', 'users'];

  // Search users (for employers to find candidates)
  static async searchUsers(
    query: string,
    filters: {
      location?: string;
      skills?: string[];
      experience?: string;
      remote?: string;
      workAuthorization?: string;
      education?: string;
    },
    pagination: CursorPaginationParams | OffsetPaginationParams,
    trackPerformance?: {
      trackDatabaseQuery: () => void;
      trackCacheHit: () => void;
      trackCacheMiss: () => void;
    }
  ): Promise<PaginatedResponse<any>> {
    const startTime = Date.now();

    // Generate cache key
    const cacheKey = generatePaginationCacheKey(
      generateCacheKey(CACHE_PREFIXES.search, 'users', query),
      {
        ...pagination,
        filters,
      }
    );

    return getCacheOrExecute(
      cacheKey,
      async () => {
        // Build where condition
        const whereCondition = this.buildUserWhereCondition(query, filters);

        let users: any[];
        let totalCount: number | undefined;

        if ('cursor' in pagination) {
          trackPerformance?.trackDatabaseQuery();
          users = await prisma.user.findMany({
            where: whereCondition,
            orderBy: { updatedAt: 'desc' },
            take: pagination.limit + 1,
            select: {
              id: true,
              name: true,
              email: false, // Don't expose emails
              skills: true,
              location: true,
              profilePictureUrl: true,
              resumeUrl: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          const hasNextPage = users.length > pagination.limit;
          if (hasNextPage) users.pop();

          const paginationMeta = {
            hasNextPage,
            hasPrevPage: !!pagination.cursor,
            nextCursor: hasNextPage
              ? generateCursorFromRecord(users[users.length - 1], 'updatedAt')
              : undefined,
          };

          return createPaginatedResponse(users, paginationMeta, {
            queryTime: Date.now() - startTime,
            cached: false,
          });
        } else {
          trackPerformance?.trackDatabaseQuery();
          [users, totalCount] = await Promise.all([
            prisma.user.findMany({
              where: whereCondition,
              orderBy: { updatedAt: 'desc' },
              skip:
                ((pagination as OffsetPaginationParams).page - 1) *
                pagination.limit,
              take: pagination.limit,
              select: {
                id: true,
                name: true,
                email: false, // Don't expose emails
                skills: true,
                location: true,
                profilePictureUrl: true,
                resumeUrl: true,
                role: true,
                createdAt: true,
                updatedAt: true,
              },
            }),
            prisma.user.count({ where: whereCondition }),
          ]);

          const { meta } = calculateOffsetPagination(
            (pagination as OffsetPaginationParams).page,
            pagination.limit,
            totalCount
          );

          return createPaginatedResponse(users, meta, {
            queryTime: Date.now() - startTime,
            cached: false,
          });
        }
      },
      {
        ttl: this.CACHE_TTL,
        tags: this.CACHE_TAGS,
      }
    );
  }

  // Build user search where condition
  private static buildUserWhereCondition(query: string, filters: any): any {
    const conditions: any[] = [];

    // Only search jobseekers (not employers/admins)
    conditions.push({ role: 'jobseeker' });

    // Text search
    if (query && query.length >= 2) {
      conditions.push({
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { skills: { hasSome: TextProcessor.extractKeywords(query) } },
        ],
      });
    }

    // Location filter
    if (filters.location) {
      conditions.push({
        location: { contains: filters.location, mode: 'insensitive' },
      });
    }

    // Skills filter
    if (filters.skills && filters.skills.length > 0) {
      conditions.push({
        skills: { hasSome: filters.skills },
      });
    }

    return { AND: conditions };
  }
}
