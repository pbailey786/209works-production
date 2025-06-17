# Caching and Pagination System

This document describes the comprehensive caching and pagination system implemented for the 209jobs API.

## Overview

The system provides:

- **Redis Caching** with automatic invalidation
- **Cursor-based Pagination** for efficient large datasets
- **Offset-based Pagination** as fallback
- **Cache-aware Services** for common data operations
- **Performance Tracking** with cache hit/miss metrics
- **Search Result Caching** with filter support

## Quick Start

### Basic Caching

```typescript
import { getCache, setCache, DEFAULT_TTL } from '@/lib/cache/redis';

// Set cache
await setCache('user:123', userData, {
  ttl: DEFAULT_TTL.medium,
  tags: ['users', 'user:123'],
});

// Get cache
const userData = await getCache<User>('user:123');
```

### Using Cache Services

```typescript
import { JobCacheService } from '@/lib/cache/services';

// Get paginated jobs with caching
const results = await JobCacheService.getPaginatedJobs({
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  filters: {
    q: 'developer',
    location: 'San Francisco',
    jobType: 'fulltime',
  },
});
```

### API Endpoint Example

```typescript
import { withAPIMiddleware } from '@/lib/middleware/api';
import { searchQuerySchema } from '@/lib/cache/pagination';
import { JobCacheService } from '@/lib/cache/services';

export const GET = withAPIMiddleware(
  async (req, context) => {
    const { query, performance } = context;

    const results = await JobCacheService.getPaginatedJobs(query!, performance);

    return createSuccessResponse(results);
  },
  {
    querySchema: searchQuerySchema,
    rateLimit: { enabled: true, type: 'search' },
    logging: { enabled: true },
  }
);
```

## Redis Cache System

### Configuration

The Redis client automatically detects and uses:

- **Local Redis**: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- **Upstash Redis**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Cache TTL Settings

```typescript
export const DEFAULT_TTL = {
  short: 60 * 5, // 5 minutes
  medium: 60 * 30, // 30 minutes
  long: 60 * 60 * 2, // 2 hours
  veryLong: 60 * 60 * 24, // 24 hours
};
```

### Cache Prefixes

```typescript
export const CACHE_PREFIXES = {
  jobs: 'jobs',
  users: 'users',
  search: 'search',
  stats: 'stats',
  session: 'session',
};
```

### Cache Operations

#### Set Cache with Tags

```typescript
await setCache('jobs:paginated:page:1', jobsData, {
  ttl: DEFAULT_TTL.medium,
  tags: ['jobs', 'jobs:list'],
});
```

#### Get with Fallback

```typescript
const data = await getCacheOrExecute(
  'jobs:single:123',
  async () => {
    return await prisma.job.findUnique({ where: { id: '123' } });
  },
  { ttl: DEFAULT_TTL.long, tags: ['jobs', 'job:123'] }
);
```

#### Cache Invalidation

```typescript
// Invalidate by tags
await invalidateCacheByTags(['jobs', 'job:123']);

// Direct deletion
await deleteCache('jobs:single:123');
```

### Cache Key Generation

```typescript
import { generateCacheKey, CACHE_PREFIXES } from '@/lib/cache/redis';

const key = generateCacheKey(CACHE_PREFIXES.jobs, 'paginated', userId);
// Result: "jobs:paginated:user123"
```

## Pagination System

### Cursor-based Pagination (Recommended)

Better for:

- Large datasets
- Real-time data
- Consistent ordering
- Performance at scale

```typescript
// Query parameters
{
  cursor?: string,        // Base64 encoded cursor
  limit: number,          // 1-100, default 20
  direction: 'forward' | 'backward',
  sortBy?: string,
  sortOrder: 'asc' | 'desc'
}

// Response format
{
  data: Job[],
  pagination: {
    hasNextPage: boolean,
    hasPrevPage: boolean,
    nextCursor?: string,
    prevCursor?: string
  },
  metadata: {
    queryTime: number,
    cached: boolean,
    sortBy?: string,
    sortOrder?: string
  }
}
```

### Offset-based Pagination

Better for:

- Small datasets
- Random access needed
- Page number display

```typescript
// Query parameters
{
  page: number,          // Page number (1-based)
  limit: number,         // 1-100, default 20
  sortBy?: string,
  sortOrder: 'asc' | 'desc'
}

// Response format
{
  data: Job[],
  pagination: {
    currentPage: number,
    totalPages: number,
    totalCount: number,
    hasNextPage: boolean,
    hasPrevPage: boolean,
    limit: number
  },
  metadata: {
    queryTime: number,
    cached: boolean
  }
}
```

### Pagination in API Requests

#### Cursor Pagination

```
GET /api/jobs?limit=20&sortBy=createdAt&sortOrder=desc
GET /api/jobs?cursor=eyJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1IiwiaWQiOiIxMjMifQ&limit=20
```

#### Offset Pagination

```
GET /api/jobs?page=2&limit=20&sortBy=createdAt&sortOrder=desc
```

### Search with Filters

```
GET /api/jobs/search?q=developer&location=San Francisco&jobType=fulltime&remote=true&limit=20
```

## Cache Services

### JobCacheService

Handles job-related caching with advanced filtering:

```typescript
// Get paginated jobs
const jobs = await JobCacheService.getPaginatedJobs({
  limit: 20,
  filters: {
    q: 'developer',
    location: 'San Francisco',
    jobType: 'fulltime',
    salaryMin: 80000,
    remote: 'true',
    datePosted: '7d',
  },
});

// Get single job
const job = await JobCacheService.getJobById('job123');

// Get jobs by employer
const employerJobs = await JobCacheService.getJobsByEmployer('emp123', {
  page: 1,
  limit: 10,
});

// Invalidate caches
await JobCacheService.invalidateJobCaches('job123', 'emp123');
```

#### Search Filters

| Filter       | Type             | Description                                   |
| ------------ | ---------------- | --------------------------------------------- |
| `q`          | string           | Text search (title, description, company)     |
| `location`   | string           | Location filter                               |
| `jobType`    | string           | Job type (fulltime, parttime, contract, etc.) |
| `salaryMin`  | number           | Minimum salary                                |
| `salaryMax`  | number           | Maximum salary                                |
| `company`    | string           | Company name filter                           |
| `remote`     | 'true'/'false'   | Remote work filter                            |
| `datePosted` | '24h'/'7d'/'30d' | Date posted filter                            |

### UserCacheService

Handles user profile and application caching:

```typescript
// Get user profile
const user = await UserCacheService.getUserById('user123');

// Get user applications with pagination
const applications = await UserCacheService.getUserApplications('user123', {
  cursor: 'xyz',
  limit: 20,
});

// Invalidate user caches
await UserCacheService.invalidateUserCaches('user123');
```

### SearchCacheService

Handles search result caching:

```typescript
const searchResults = await SearchCacheService.searchJobs(
  'javascript developer',
  {
    location: 'New York',
    jobType: 'fulltime',
  },
  {
    limit: 20,
    sortBy: 'createdAt',
  }
);
```

## Performance Tracking

The system tracks performance metrics automatically:

```typescript
export const GET = withAPIMiddleware(async (req, context) => {
  const { performance } = context;

  // Track database queries
  performance.trackDatabaseQuery();
  const data = await prisma.job.findMany();

  // Track cache operations
  performance.trackCacheHit(); // or trackCacheMiss()

  return createSuccessResponse(data);
}, config);
```

### Performance Metrics

Automatically logged:

- Query execution time
- Database query count
- Cache hit/miss ratio
- Memory usage
- Request duration

## Environment Configuration

### Required for Production

```bash
# Redis Configuration (choose one)
# Option 1: Local Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# Option 2: Upstash Redis (recommended for production)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

### Optional Configuration

```bash
# Cache settings
DEFAULT_CACHE_TTL=1800          # 30 minutes
ENABLE_CACHE_COMPRESSION=true   # Compress large cache values
CACHE_KEY_PREFIX=209jobs        # Prefix for all cache keys

# Performance monitoring
SLOW_QUERY_THRESHOLD=1000       # Log queries slower than 1s
ENABLE_PERFORMANCE_LOGGING=true
```

## Best Practices

### 1. Cache Strategy

- **Frequently accessed data**: Use longer TTL
- **User-specific data**: Use shorter TTL
- **Search results**: Use short TTL (5-15 minutes)
- **Static data**: Use very long TTL

### 2. Cache Invalidation

```typescript
// When creating/updating jobs
await JobCacheService.invalidateJobCaches(jobId, employerId);

// When updating user profiles
await UserCacheService.invalidateUserCaches(userId);

// Use tags for bulk invalidation
await invalidateCacheByTags(['jobs', 'search']);
```

### 3. Pagination Choice

**Use Cursor Pagination when:**

- Dataset > 10,000 records
- Real-time data updates
- Performance is critical
- Consistent ordering important

**Use Offset Pagination when:**

- Small datasets
- Need page numbers
- Random access required
- Simpler implementation needed

### 4. Error Handling

The system gracefully degrades when Redis is unavailable:

```typescript
// Cache operations return false on failure
const cached = await setCache(key, data);
if (!cached) {
  console.log('Cache unavailable, continuing without cache');
}

// Get operations return null on failure
const data = await getCache(key);
if (!data) {
  // Fetch from database as fallback
}
```

## Monitoring and Debugging

### Cache Hit Rates

Monitor cache performance:

```typescript
// Enable detailed logging
ENABLE_PERFORMANCE_LOGGING=true

// Check logs for cache metrics
[INFO] Cache hit rate: 85% (42 hits, 8 misses)
[INFO] Average query time: 45ms (cached: 12ms, uncached: 180ms)
```

### Debug Cache Keys

```typescript
// List all cache keys (development only)
const keys = await redis.keys('jobs:*');
console.log('Job cache keys:', keys);

// Check cache contents
const cached = await getCache('jobs:paginated:limit:20');
console.log('Cached data:', cached);
```

### Performance Monitoring

```typescript
// Slow request logging
[WARN] Slow request: GET /api/jobs/search (1250ms)
- Database queries: 3
- Cache misses: 2
- Memory usage: 45MB
```

## Migration Guide

### From Old Pagination

```typescript
// Before
const { searchParams } = new URL(req.url);
const page = parseInt(searchParams.get('page') || '1');
const limit = parseInt(searchParams.get('limit') || '10');

// After
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { query } = context;
    const results = await JobCacheService.getPaginatedJobs(query!);
    return createSuccessResponse(results);
  },
  { querySchema: paginatedQuerySchema }
);
```

### Adding Caching to Existing Endpoints

```typescript
// Before
const job = await prisma.job.findUnique({ where: { id } });

// After
const job = await JobCacheService.getJobById(id, performance);
```

## Troubleshooting

### Common Issues

1. **Redis Connection Errors**

   ```bash
   # Check Redis connectivity
   redis-cli ping

   # Verify environment variables
   echo $UPSTASH_REDIS_REST_URL
   ```

2. **Cache Misses**

   - Check TTL values
   - Verify cache key generation
   - Monitor invalidation patterns

3. **Pagination Issues**

   - Ensure consistent sorting
   - Check cursor encoding/decoding
   - Verify pagination parameters

4. **Performance Problems**
   - Monitor database query counts
   - Check cache hit rates
   - Review TTL settings

### Debug Mode

```bash
# Enable debug logging
NODE_ENV=development
DEBUG_CACHE=true
DEBUG_PAGINATION=true
```

## Examples

### Complete API Endpoint

```typescript
import { withAPIMiddleware } from '@/lib/middleware/api';
import { searchQuerySchema } from '@/lib/cache/pagination';
import { JobCacheService } from '@/lib/cache/services';

export const GET = withAPIMiddleware(
  async (req, context) => {
    const { query, performance } = context;

    const results = await JobCacheService.getPaginatedJobs(
      {
        ...query!,
        filters: {
          q: query!.q,
          location: query!.location,
          jobType: query!.jobType,
          remote: query!.remote,
        },
      },
      performance
    );

    return createSuccessResponse(results);
  },
  {
    querySchema: searchQuerySchema,
    rateLimit: { enabled: true, type: 'search' },
    logging: { enabled: true, includeQuery: true },
    cors: { enabled: true },
  }
);
```

### Custom Cache Service

```typescript
export class CustomCacheService {
  private static readonly CACHE_TTL = DEFAULT_TTL.medium;

  static async getCustomData(id: string): Promise<any> {
    const cacheKey = generateCacheKey('custom', id);

    return getCacheOrExecute(
      cacheKey,
      async () => {
        return await prisma.customTable.findUnique({ where: { id } });
      },
      {
        ttl: this.CACHE_TTL,
        tags: ['custom', `custom:${id}`],
      }
    );
  }

  static async invalidateCustomCaches(id: string): Promise<void> {
    await invalidateCacheByTags(['custom', `custom:${id}`]);
  }
}
```
