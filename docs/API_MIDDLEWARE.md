# API Middleware System

This document describes the comprehensive API middleware system implemented for the 209jobs API.

## Overview

The API middleware system provides a unified wrapper for all API endpoints that includes:

- **Rate Limiting** with Upstash Redis
- **Request Logging** and performance monitoring  
- **CORS** configuration
- **Authentication & Authorization**
- **Request Validation** with Zod schemas
- **Error Handling** with standardized responses
- **Security Headers**
- **Performance Tracking**

## Quick Start

### Basic Usage

```typescript
import { withAPIMiddleware } from '@/lib/middleware/api';
import { createSuccessResponse } from '@/lib/errors/api-errors';

export const GET = withAPIMiddleware(
  async (req, context) => {
    // Your handler logic here
    return createSuccessResponse({ message: 'Hello World' });
  },
  {
    // Configuration options
    requireAuthentication: true,
    rateLimit: { enabled: true },
    logging: { enabled: true },
  }
);
```

### Using Preset Configurations

```typescript
import { withAPIMiddleware, apiConfigs } from '@/lib/middleware/api';

// For public endpoints
export const GET = withAPIMiddleware(handler, apiConfigs.public);

// For authenticated endpoints  
export const POST = withAPIMiddleware(handler, apiConfigs.authenticated);

// For admin-only endpoints
export const DELETE = withAPIMiddleware(handler, apiConfigs.admin);

// For employer endpoints
export const PUT = withAPIMiddleware(handler, apiConfigs.employer);
```

## Configuration Options

### Authentication & Authorization

```typescript
{
  // Require authentication
  requireAuthentication: true,
  
  // Require specific roles
  requiredRoles: ['admin', 'employer'],
}
```

### Request Validation

```typescript
{
  // Validate request body
  bodySchema: createJobSchema,
  
  // Validate query parameters
  querySchema: jobSearchSchema,
  
  // Validate URL parameters
  paramsSchema: routeParamsSchemas.jobId,
}
```

### Rate Limiting

```typescript
{
  rateLimit: {
    enabled: true,
    type: 'authenticated', // 'general', 'authenticated', 'premium', 'search', 'auth', 'upload'
  }
}
```

#### Rate Limit Types

| Type | Limit | Use Case |
|------|-------|----------|
| `general` | 100/min | Public endpoints |
| `authenticated` | 200/min | Logged-in users |
| `premium` | 500/min | Admin/Employer users |
| `search` | 30/min | Search endpoints |
| `auth` | 5/min | Authentication endpoints |
| `upload` | 10/min | File upload endpoints |

### CORS Configuration

```typescript
{
  cors: {
    enabled: true,
    config: {
      origin: ['https://yourdomain.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }
  }
}
```

### Logging & Monitoring

```typescript
{
  logging: {
    enabled: true,
    includeBody: false,    // Don't log request bodies (for sensitive data)
    includeQuery: true,    // Log query parameters
  },
  
  monitoring: {
    enabled: true,
    slowRequestThreshold: 1000, // Log warning for requests > 1s
  }
}
```

## Context Object

The middleware provides an enhanced context object to your handlers:

```typescript
interface APIContext<TBody, TQuery> {
  params: any;           // URL parameters (validated)
  body?: TBody;          // Request body (validated)
  query?: TQuery;        // Query parameters (validated)
  requestId: string;     // Unique request identifier
  
  user?: {               // Authenticated user (if auth required)
    id: string;
    email: string;
    role: string;
  };
  
  performance: {         // Performance tracking utilities
    startTime: number;
    trackDatabaseQuery(): void;
    trackCacheHit(): void;
    trackCacheMiss(): void;
  };
}
```

### Using the Context

```typescript
export const POST = withAPIMiddleware(
  async (req, context) => {
    const { user, params, body, performance } = context;
    
    // Access authenticated user
    const userId = user!.id;
    
    // Track database operations
    performance.trackDatabaseQuery();
    const result = await prisma.job.findUnique({ where: { id: params.id } });
    
    // Use validated request body
    const jobData = body!; // TypeScript knows this is validated
    
    return createSuccessResponse({ result });
  },
  {
    requiredRoles: ['employer'],
    bodySchema: createJobSchema,
    paramsSchema: routeParamsSchemas.jobId,
  }
);
```

## Environment Configuration

### Required Environment Variables

For production, set these environment variables:

```bash
# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# CORS configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
API_ALLOWED_ORIGINS=https://api.yourdomain.com

# Optional configuration
LOG_LEVEL=info
SLOW_REQUEST_THRESHOLD=1000
ENABLE_PERFORMANCE_LOGGING=true
SKIP_RATE_LIMIT=false
```

### Development Configuration

For development, you can skip rate limiting:

```bash
SKIP_RATE_LIMIT=true
```

## Preset Configurations

The system includes several preset configurations for common use cases:

### `apiConfigs.public`
- No authentication required
- Basic rate limiting (100/min by IP)
- CORS enabled for public use
- Standard logging

### `apiConfigs.authenticated`
- Authentication required
- Higher rate limits (200/min by user)
- CORS enabled
- User context available

### `apiConfigs.admin`
- Admin role required
- Premium rate limits (500/min)
- Body logging enabled
- Full monitoring

### `apiConfigs.employer`
- Admin or Employer role required
- Premium rate limits
- Standard logging

### `apiConfigs.search`
- No authentication required
- Restrictive rate limits (30/min)
- Query parameter logging
- Optimized for search endpoints

### `apiConfigs.upload`
- Authentication required
- Upload-specific rate limits (10/min)
- File handling optimized

### `apiConfigs.auth`
- No authentication required (for login/register)
- Very restrictive rate limits (5/min)
- Body logging disabled (no passwords in logs)

## Security Features

### Automatic Security Headers

The middleware automatically adds security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Request ID Tracking

Every request gets a unique ID for tracing:

```
X-Request-ID: req_1640995200000_abc123def
```

### Performance Headers (Development)

In development, response time is included:

```
X-Response-Time: 150ms
```

## Error Handling

The middleware integrates with the error handling system:

```typescript
// Automatic error handling
export const POST = withAPIMiddleware(
  async (req, context) => {
    // If you throw any error, it's automatically handled
    throw new NotFoundError('Job not found');
    
    // Rate limiting errors are handled automatically
    // Validation errors are handled automatically
    // Authentication errors are handled automatically
  },
  config
);
```

## Performance Monitoring

### Database Query Tracking

```typescript
export const GET = withAPIMiddleware(
  async (req, context) => {
    context.performance.trackDatabaseQuery();
    const users = await prisma.user.findMany();
    
    context.performance.trackDatabaseQuery();  
    const jobs = await prisma.job.findMany();
    
    // Logs will show: "2 database queries"
    return createSuccessResponse({ users, jobs });
  },
  config
);
```

### Cache Tracking

```typescript
export const GET = withAPIMiddleware(
  async (req, context) => {
    const cached = await redis.get('jobs');
    if (cached) {
      context.performance.trackCacheHit();
      return createSuccessResponse(JSON.parse(cached));
    }
    
    context.performance.trackCacheMiss();
    const jobs = await prisma.job.findMany();
    await redis.set('jobs', JSON.stringify(jobs));
    
    return createSuccessResponse(jobs);
  },
  config
);
```

## Migration from Old System

### Before (withValidation)

```typescript
export const POST = withValidation(
  async (req, { params, body, requestId }) => {
    const session = await requireRole(req, ['employer']);
    if (session instanceof Response) return session;
    
    const userId = (session.user as any).id;
    // ... rest of logic
  },
  {
    bodySchema: createJobSchema,
    paramsSchema: routeParamsSchemas.jobId,
  }
);
```

### After (withAPIMiddleware)

```typescript
export const POST = withAPIMiddleware(
  async (req, context) => {
    const { user, params, body } = context;
    const userId = user!.id; // Type-safe, guaranteed to exist
    // ... rest of logic (much cleaner!)
  },
  {
    requiredRoles: ['employer'],
    bodySchema: createJobSchema,
    paramsSchema: routeParamsSchemas.jobId,
    rateLimit: { enabled: true },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);
```

## Benefits

1. **Unified Interface** - One wrapper for all middleware concerns
2. **Type Safety** - Full TypeScript support with validated data
3. **Performance Monitoring** - Built-in tracking for database queries and cache operations
4. **Security** - Automatic security headers and CORS handling
5. **Rate Limiting** - Sophisticated, role-based rate limiting
6. **Logging** - Comprehensive request/response logging with performance metrics
7. **Error Handling** - Centralized error handling with proper HTTP status codes
8. **Configuration** - Flexible configuration with sensible presets
9. **Production Ready** - Environment-aware configuration and monitoring

## Troubleshooting

### Rate Limiting Issues

If you're getting rate limited in development:

```bash
# Add to your .env.local
SKIP_RATE_LIMIT=true
```

### CORS Issues

Make sure your origins are configured:

```bash
# For production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# For development (automatic)
# CORS allows all origins in development
```

### Performance Issues

Monitor slow requests:

```bash
# Set threshold for slow request warnings (ms)
SLOW_REQUEST_THRESHOLD=500

# Enable detailed performance logging
ENABLE_PERFORMANCE_LOGGING=true
```

### Redis Connection Issues

Verify your Upstash configuration:

```bash
# Check these are set correctly
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
``` 