import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAPIMiddleware } from '@/lib/middleware/api';
import { paginatedQuerySchema } from '@/lib/cache/pagination';
import {
  getCache,
  setCache,
  generateCacheKey,
  CACHE_PREFIXES,
  DEFAULT_TTL,
} from '@/lib/cache/redis';
import { createSuccessResponse } from '@/lib/errors/api-errors';

// Mock data for testing
const generateMockData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    title: `Test Item ${i + 1}`,
    description: `This is test item number ${i + 1}`,
    createdAt: new Date(Date.now() - i * 60000).toISOString(), // Each item 1 minute apart
    score: Math.floor(Math.random() * 100),
  }));
};

// GET /api/test/caching - Test caching and pagination functionality
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { query, performance } = context;

    // Get useCache from raw URL since it's not in our validated schema
    const { searchParams } = new URL(req.url);
    const useCache = searchParams.get('useCache') !== 'false';

    const {
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ...paginationParams
    } = query!;

    const cursor = (paginationParams as any).cursor;
    const page = (paginationParams as any).page;

    const startTime = Date.now();

    // Generate cache key
    const cacheKey = generateCacheKey(
      CACHE_PREFIXES.stats,
      'test-data',
      `limit:${limit}`,
      cursor ? `cursor:${cursor}` : page ? `page:${page}` : 'page:1',
      `sort:${sortBy}:${sortOrder}`
    );

    let data: any;
    let cached = false;

    if (useCache) {
      // Try to get from cache first
      data = await getCache(cacheKey);
      if (data) {
        performance.trackCacheHit();
        cached = true;
      } else {
        performance.trackCacheMiss();
      }
    }

    if (!data) {
      // Simulate database operation
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate slow DB query
      performance.trackDatabaseQuery();

      const mockData = generateMockData(100); // Generate 100 mock items

      // Sort data
      mockData.sort((a, b) => {
        const aVal = a[sortBy as keyof typeof a];
        const bVal = b[sortBy as keyof typeof b];

        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      let paginatedData: any[];
      let pagination: any;

      if (cursor) {
        // Cursor-based pagination simulation
        const decodedCursor = cursor
          ? JSON.parse(Buffer.from(cursor, 'base64').toString())
          : null;
        const startIndex = decodedCursor
          ? mockData.findIndex(item => item.id === decodedCursor.id) + 1
          : 0;

        paginatedData = mockData.slice(startIndex, startIndex + limit);
        const hasMore = startIndex + limit < mockData.length;

        pagination = {
          hasNextPage: hasMore,
          hasPrevPage: !!cursor,
          nextCursor: hasMore
            ? Buffer.from(
                JSON.stringify({
                  id: paginatedData[paginatedData.length - 1].id,
                  createdAt: paginatedData[paginatedData.length - 1].createdAt,
                })
              ).toString('base64')
            : undefined,
          prevCursor: cursor,
        };
      } else {
        // Offset-based pagination
        const pageNum = page || 1;
        const offset = (pageNum - 1) * limit;
        paginatedData = mockData.slice(offset, offset + limit);

        pagination = {
          currentPage: pageNum,
          totalPages: Math.ceil(mockData.length / limit),
          totalCount: mockData.length,
          hasNextPage: offset + limit < mockData.length,
          hasPrevPage: pageNum > 1,
          limit,
        };
      }

      data = {
        data: paginatedData,
        pagination,
        metadata: {
          queryTime: Date.now() - startTime,
          cached: false,
          sortBy,
          sortOrder,
          totalItems: mockData.length,
        },
      };

      // Cache the result
      if (useCache) {
        await setCache(cacheKey, data, {
          ttl: DEFAULT_TTL.short,
          tags: ['test', 'pagination'],
        });
      }
    }

    // Update metadata
    data.metadata.cached = cached;
    data.metadata.finalQueryTime = Date.now() - startTime;

    // Add performance information
    data.performance = {
      databaseQueries: cached ? 0 : 1,
      cacheHit: cached,
      responseTime: Date.now() - startTime,
    };

    return createSuccessResponse(data);
  },
  {
    querySchema: paginatedQuerySchema,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true, includeQuery: true },
    cors: { enabled: true },
  }
);
