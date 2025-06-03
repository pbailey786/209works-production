# Internal Validation and Error Handling System Documentation

**Target Audience:** Development Team  
**Last Updated:** January 2024  
**Maintainer:** Engineering Team

## Table of Contents

1. [System Overview](#system-overview)
2. [Custom Error Classes](#custom-error-classes)
3. [Zod Schema Implementation](#zod-schema-implementation)
4. [Middleware Wrapper Pattern](#middleware-wrapper-pattern)
5. [HTTP Status Code Guidelines](#http-status-code-guidelines)
6. [Common Error Scenarios](#common-error-scenarios)
7. [Extending the System](#extending-the-system)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## System Overview

Our validation and error handling system is built around three core components:

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    API Endpoint                              │
├─────────────────────────────────────────────────────────────┤
│                 withAPIMiddleware                            │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│  │ Rate Limit  │    Auth     │ Validation  │   Logging    │ │
│  └─────────────┴─────────────┴─────────────┴──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                  Error Handling                             │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│  │ Zod Errors  │ Prisma Errs │ Custom Errs │ Generic Errs │ │
│  └─────────────┴─────────────┴─────────────┴──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│              Standardized API Response                      │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── lib/
│   ├── errors/
│   │   └── api-errors.ts          # Error classes and response handling
│   ├── middleware/
│   │   ├── api.ts                 # Main API middleware wrapper
│   │   └── validation.ts          # Legacy validation middleware
│   └── validations/
│       ├── api.ts                 # Core API schemas
│       ├── jobs.ts                # Job-related schemas
│       ├── alerts.ts              # Alert-related schemas
│       ├── ads.ts                 # Advertisement schemas
│       └── search.ts              # Search schemas
```

## Custom Error Classes

### Base Error Class

```typescript
// src/lib/errors/api-errors.ts
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
```

### Available Error Classes

| Class                 | Status Code | When to Use              | Example                                               |
| --------------------- | ----------- | ------------------------ | ----------------------------------------------------- |
| `ValidationError`     | 400         | Invalid input data       | `throw new ValidationError('Email format invalid')`   |
| `AuthenticationError` | 401         | Missing/invalid auth     | `throw new AuthenticationError()`                     |
| `AuthorizationError`  | 403         | Insufficient permissions | `throw new AuthorizationError('Admin required')`      |
| `NotFoundError`       | 404         | Resource doesn't exist   | `throw new NotFoundError('Job')`                      |
| `ConflictError`       | 409         | Resource already exists  | `throw new ConflictError('Email already registered')` |
| `RateLimitError`      | 429         | Too many requests        | Automatically thrown by middleware                    |

### Creating Custom Errors

For new error types, extend the base `ApiError` class:

```typescript
// Example: Business logic error
export class PaymentRequiredError extends ApiError {
  constructor(message: string = 'Payment required to access this feature') {
    super(message, 402, ErrorCode.PAYMENT_REQUIRED);
  }
}

// Usage in handler
if (!user.hasActivePlan) {
  throw new PaymentRequiredError(
    'Premium subscription required for bulk uploads'
  );
}
```

### Error Response Format

All errors are automatically converted to this standardized format:

```typescript
interface ApiErrorResponse {
  error: string; // Error class name
  message: string; // Human-readable message
  code: string; // Machine-readable error code
  details?: unknown; // Additional error details (e.g., validation errors)
  timestamp: string; // ISO timestamp
  requestId?: string; // Unique request identifier
}
```

## Zod Schema Implementation

### Schema Organization

Schemas are organized by domain:

```typescript
// src/lib/validations/jobs.ts
export const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  description: z.string().min(50).max(10000),
  // ... more fields
});

export const updateJobSchema = createJobSchema.partial();
export const jobQuerySchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  // ... query parameters
});
```

### Schema Naming Conventions

- **Create schemas**: `create{Entity}Schema` (e.g., `createJobSchema`)
- **Update schemas**: `update{Entity}Schema` (e.g., `updateJobSchema`)
- **Query schemas**: `{entity}QuerySchema` (e.g., `jobQuerySchema`)
- **Params schemas**: `{entity}ParamsSchema` (e.g., `jobParamsSchema`)

### Common Schema Patterns

#### 1. Base Entity Schema

```typescript
const baseJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(50).max(10000),
  // ... core fields
});

export const createJobSchema = baseJobSchema.extend({
  // Additional create-only fields
  publishAt: z.string().datetime().optional(),
});

export const updateJobSchema = baseJobSchema.partial().extend({
  // Additional update-only fields
  status: jobStatusSchema.optional(),
});
```

#### 2. Enum Schemas

```typescript
export const jobTypeSchema = z.enum([
  'full-time',
  'part-time',
  'contract',
  'temporary',
  'internship',
]);

export const experienceLevelSchema = z.enum([
  'entry',
  'mid',
  'senior',
  'executive',
]);
```

#### 3. Query Parameter Schemas

```typescript
export const paginatedQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const jobQuerySchema = paginatedQuerySchema.extend({
  query: z.string().max(200).optional(),
  location: z.string().max(100).optional(),
  jobType: jobTypeSchema.optional(),
  // ... more filters
});
```

#### 4. Complex Nested Schemas

```typescript
const addressSchema = z.object({
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(50),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
});

const companySchema = z.object({
  name: z.string().min(1).max(200),
  website: z.string().url().optional(),
  address: addressSchema.optional(),
  size: companySizeSchema.optional(),
});
```

### Schema Validation Helpers

```typescript
// Custom validation helpers
const emailSchema = z.string().email().max(255);
const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format');
const urlSchema = z.string().url().max(2000);
const uuidSchema = z.string().uuid();

// Date validation
const futureDateSchema = z
  .string()
  .datetime()
  .refine(date => new Date(date) > new Date(), 'Date must be in the future');

// File validation
const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.enum([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
});
```

## Middleware Wrapper Pattern

### Current Implementation (withAPIMiddleware)

This is the recommended approach for all new endpoints:

```typescript
import { withAPIMiddleware, apiConfigs } from '@/lib/middleware/api';

export const POST = withAPIMiddleware(
  async (req, context) => {
    const { user, params, body, query, performance } = context;

    // Your business logic here
    // All validation is already done
    // User is authenticated if required
    // Rate limiting is applied

    return createSuccessResponse(result);
  },
  {
    // Configuration options
    requiredRoles: ['employer'],
    bodySchema: createJobSchema,
    querySchema: jobQuerySchema,
    paramsSchema: routeParamsSchemas.jobId,
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);
```

### Available Preset Configurations

```typescript
import { apiConfigs } from '@/lib/middleware/api';

// For public endpoints (no auth required)
apiConfigs.public;

// For authenticated endpoints
apiConfigs.authenticated;

// For admin-only endpoints
apiConfigs.admin;

// For employer endpoints
apiConfigs.employer;

// For search endpoints (special rate limiting)
apiConfigs.search;

// For upload endpoints
apiConfigs.upload;

// For auth endpoints (heavy rate limiting)
apiConfigs.auth;
```

### Custom Configuration

```typescript
import { mergeAPIConfig, apiConfigs } from '@/lib/middleware/api';

export const POST = withAPIMiddleware(
  handler,
  mergeAPIConfig(apiConfigs.authenticated, {
    // Override specific settings
    rateLimit: { enabled: true, type: 'premium' },
    logging: { enabled: true, includeBody: true },
  })
);
```

### Legacy Pattern (withValidation)

⚠️ **DEPRECATED** - Only use for existing endpoints that haven't been migrated:

```typescript
import { withValidation } from '@/lib/middleware/validation';

export const POST = withValidation(
  async (req, { params, body, query, requestId }) => {
    // Manual auth check required
    const session = await requireAuth(req);
    if (session instanceof NextResponse) return session;

    // Your logic here
  },
  {
    bodySchema: createJobSchema,
    paramsSchema: routeParamsSchemas.jobId,
  }
);
```

## HTTP Status Code Guidelines

### Success Codes

| Code | Use Case                       | Example                 |
| ---- | ------------------------------ | ----------------------- |
| 200  | Successful GET/PUT/DELETE      | Retrieved user profile  |
| 201  | Successful POST (created)      | Created new job posting |
| 202  | Accepted for processing        | Bulk operation queued   |
| 204  | Successful DELETE (no content) | Deleted job posting     |

### Client Error Codes

| Code | Use Case             | When to Use                                   |
| ---- | -------------------- | --------------------------------------------- |
| 400  | Bad Request          | Invalid input data, malformed JSON            |
| 401  | Unauthorized         | Missing or invalid authentication             |
| 403  | Forbidden            | Valid auth but insufficient permissions       |
| 404  | Not Found            | Resource doesn't exist                        |
| 405  | Method Not Allowed   | Unsupported HTTP method                       |
| 409  | Conflict             | Resource already exists, constraint violation |
| 422  | Unprocessable Entity | Valid JSON but business logic error           |
| 429  | Too Many Requests    | Rate limit exceeded                           |

### Server Error Codes

| Code | Use Case              | When to Use                  |
| ---- | --------------------- | ---------------------------- |
| 500  | Internal Server Error | Unexpected server errors     |
| 502  | Bad Gateway           | External service unavailable |
| 503  | Service Unavailable   | Maintenance mode             |

### Implementation Examples

```typescript
// Correct status code usage
export const POST = withAPIMiddleware(async (req, context) => {
  const { body } = context;

  // Check if resource already exists (409)
  const existing = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existing) {
    throw new ConflictError('User with this email already exists');
  }

  // Create resource (201)
  const user = await prisma.user.create({ data: body });
  return createSuccessResponse(user, 'User created successfully', 201);
}, config);

export const GET = withAPIMiddleware(async (req, context) => {
  const { params } = context;

  // Resource not found (404)
  const user = await prisma.user.findUnique({
    where: { id: params.id },
  });
  if (!user) {
    throw new NotFoundError('User');
  }

  // Successful retrieval (200 - default)
  return createSuccessResponse(user);
}, config);

export const DELETE = withAPIMiddleware(async (req, context) => {
  const { params } = context;

  await prisma.user.delete({
    where: { id: params.id },
  });

  // Successful deletion with no content (204)
  return new NextResponse(null, { status: 204 });
}, config);
```

## Common Error Scenarios

### 1. Validation Errors

```typescript
// Automatic handling by middleware
export const POST = withAPIMiddleware(
  async (req, context) => {
    // If we reach here, body is guaranteed valid
    const { body } = context;
    // ... business logic
  },
  { bodySchema: createJobSchema } // Validation happens here
);

// Manual validation (if needed)
export const POST = withAPIMiddleware(async (req, context) => {
  const { body } = context;

  // Additional business validation
  if (body.startDate > body.endDate) {
    throw new ValidationError('Start date must be before end date');
  }
}, config);
```

### 2. Authentication Errors

```typescript
// Automatic handling by middleware
export const GET = withAPIMiddleware(
  async (req, context) => {
    // If we reach here, user is guaranteed authenticated
    const { user } = context;
    console.log(user.id); // Safe to access
  },
  { requireAuthentication: true }
);

// Manual auth check (legacy pattern)
export const GET = withAPIMiddleware(async (req, context) => {
  const { user } = context;

  if (!user) {
    throw new AuthenticationError();
  }
}, config);
```

### 3. Authorization Errors

```typescript
// Role-based access (automatic)
export const POST = withAPIMiddleware(
  async (req, context) => {
    // User is guaranteed to be admin or employer
    const { user } = context;
  },
  { requiredRoles: ['admin', 'employer'] }
);

// Custom authorization logic
export const PUT = withAPIMiddleware(async (req, context) => {
  const { user, params } = context;

  // Check resource ownership
  const job = await prisma.job.findUnique({
    where: { id: params.id },
  });

  if (job.employerId !== user.id && user.role !== 'admin') {
    throw new AuthorizationError('You can only edit your own job postings');
  }
}, config);
```

### 4. Database Errors

Database errors are automatically handled by the error handling system:

```typescript
// Prisma errors are automatically converted
export const POST = withAPIMiddleware(async (req, context) => {
  try {
    const user = await prisma.user.create({
      data: context.body,
    });
    return createSuccessResponse(user);
  } catch (error) {
    // Prisma errors are automatically handled:
    // P2002 -> ConflictError (409)
    // P2025 -> NotFoundError (404)
    // P2003 -> ValidationError (400)
    throw error; // Let middleware handle it
  }
}, config);
```

### 5. External Service Errors

```typescript
export const POST = withAPIMiddleware(async (req, context) => {
  try {
    const result = await externalAPICall();
    return createSuccessResponse(result);
  } catch (error) {
    if (error.code === 'NETWORK_ERROR') {
      throw new ApiError(
        'External service temporarily unavailable',
        502,
        ErrorCode.EXTERNAL_SERVICE_ERROR
      );
    }
    throw error;
  }
}, config);
```

## Extending the System

### Adding New Error Types

1. **Define the error code**:

```typescript
// src/lib/errors/api-errors.ts
export enum ErrorCode {
  // ... existing codes
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
}
```

2. **Create the error class**:

```typescript
export class PaymentRequiredError extends ApiError {
  constructor(message: string = 'Payment required') {
    super(message, 402, ErrorCode.PAYMENT_REQUIRED);
  }
}

export class QuotaExceededError extends ApiError {
  constructor(resource: string, limit: number) {
    super(
      `${resource} quota exceeded. Limit: ${limit}`,
      429,
      ErrorCode.QUOTA_EXCEEDED
    );
  }
}
```

3. **Use in handlers**:

```typescript
export const POST = withAPIMiddleware(async (req, context) => {
  const { user } = context;

  if (!user.hasActivePlan) {
    throw new PaymentRequiredError('Premium plan required for this feature');
  }

  const currentUsage = await getUsageCount(user.id);
  if (currentUsage >= user.planLimits.jobPostings) {
    throw new QuotaExceededError('job postings', user.planLimits.jobPostings);
  }
}, config);
```

### Adding New Validation Schemas

1. **Create the schema file**:

```typescript
// src/lib/validations/billing.ts
import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  planId: z.string().uuid(),
  paymentMethodId: z.string(),
  billingCycle: z.enum(['monthly', 'yearly']),
});

export const updateBillingSchema = z.object({
  paymentMethodId: z.string().optional(),
  billingAddress: addressSchema.optional(),
});
```

2. **Use in endpoints**:

```typescript
import { createSubscriptionSchema } from '@/lib/validations/billing';

export const POST = withAPIMiddleware(
  async (req, context) => {
    const { body } = context; // Typed as z.infer<typeof createSubscriptionSchema>
    // ... business logic
  },
  { bodySchema: createSubscriptionSchema }
);
```

### Adding Custom Middleware

```typescript
// src/lib/middleware/custom.ts
export function withCustomValidation<T>(
  schema: z.ZodSchema<T>,
  customValidator: (data: T) => Promise<void>
) {
  return (config: APIMiddlewareConfig) => ({
    ...config,
    bodySchema: schema.refine(async data => {
      await customValidator(data);
      return true;
    }),
  });
}

// Usage
const customConfig = withCustomValidation(createJobSchema, async data => {
  // Custom async validation
  const isValid = await checkCompanyExists(data.company);
  if (!isValid) {
    throw new ValidationError('Company not found in our database');
  }
});

export const POST = withAPIMiddleware(
  handler,
  customConfig(apiConfigs.authenticated)
);
```

## Best Practices

### 1. Error Messages

**DO:**

```typescript
throw new ValidationError('Email address is required');
throw new AuthorizationError('You must be an employer to post jobs');
throw new NotFoundError('Job posting not found');
```

**DON'T:**

```typescript
throw new ValidationError('Invalid input'); // Too vague
throw new Error('Error'); // Not descriptive
throw new AuthorizationError('No access'); // Not helpful
```

### 2. Schema Design

**DO:**

```typescript
// Clear, descriptive schemas
export const createJobSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  salary: z
    .number()
    .min(0, 'Salary cannot be negative')
    .max(10000000, 'Salary exceeds maximum allowed'),
});
```

**DON'T:**

```typescript
// Vague schemas without proper constraints
export const createJobSchema = z.object({
  title: z.string(),
  salary: z.number(),
});
```

### 3. Error Context

**DO:**

```typescript
// Provide helpful context
if (existingApplication) {
  throw new ConflictError(
    `You have already applied to this job on ${existingApplication.createdAt.toDateString()}`
  );
}

// Include relevant IDs for debugging
throw new NotFoundError(`Job with ID ${jobId} not found`);
```

**DON'T:**

```typescript
// Generic errors without context
throw new ConflictError('Already exists');
throw new NotFoundError('Not found');
```

### 4. Async Validation

**DO:**

```typescript
export const createJobSchema = z
  .object({
    companyId: z.string().uuid(),
  })
  .refine(async data => {
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
    });
    return !!company;
  }, 'Company not found');
```

**DON'T:**

```typescript
// Don't do heavy async validation in schemas
// Do it in the handler instead
```

### 5. Testing Error Scenarios

```typescript
// test/api/jobs.test.ts
describe('POST /api/jobs', () => {
  it('should return 400 for invalid job data', async () => {
    const response = await request(app).post('/api/jobs').send({ title: '' }); // Invalid: empty title

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.details).toContainEqual({
      field: 'title',
      message: 'Title is required',
    });
  });

  it('should return 403 for non-employer users', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${jobseekerToken}`)
      .send(validJobData);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('AUTHORIZATION_ERROR');
  });
});
```

## Troubleshooting

### Common Issues

#### 1. "Body is undefined" Error

**Cause**: Missing body schema in configuration  
**Solution**:

```typescript
// Add bodySchema to config
export const POST = withAPIMiddleware(
  handler,
  { bodySchema: createJobSchema } // Add this
);
```

#### 2. "Cannot read property of undefined" on validated data

**Cause**: Accessing optional fields without checking  
**Solution**:

```typescript
// Bad
const location = context.query.location.toLowerCase(); // May be undefined

// Good
const location = context.query?.location?.toLowerCase() || '';
```

#### 3. Prisma errors not being handled properly

**Cause**: Catching and re-throwing generic errors  
**Solution**:

```typescript
// Bad
try {
  await prisma.user.create({ data });
} catch (error) {
  throw new Error('Database error'); // Loses Prisma error info
}

// Good
// Just let Prisma errors bubble up, they're handled automatically
await prisma.user.create({ data });
```

#### 4. Custom validation not working

**Cause**: Using `.refine()` incorrectly  
**Solution**:

```typescript
// Bad
.refine((data) => {
  if (data.startDate > data.endDate) {
    throw new Error('Invalid dates');
  }
  return true;
})

// Good
.refine(
  (data) => data.startDate <= data.endDate,
  'Start date must be before end date'
)
```

### Debug Tools

#### 1. Request ID Tracking

Every request gets a unique ID for debugging:

```typescript
export const POST = withAPIMiddleware(async (req, context) => {
  console.log(`Processing request ${context.requestId}`);
  // Use context.requestId in logs
}, config);
```

#### 2. Error Details in Development

In development, errors include additional debug information:

```json
{
  "error": "DatabaseError",
  "message": "Unique constraint violation",
  "code": "CONFLICT",
  "details": {
    "prismaCode": "P2002",
    "target": ["email"],
    "stack": "..." // Only in development
  }
}
```

#### 3. Performance Tracking

```typescript
export const GET = withAPIMiddleware(async (req, context) => {
  context.performance.trackDatabaseQuery();
  const users = await prisma.user.findMany();

  context.performance.trackCacheHit();
  const cached = await redis.get('stats');

  // Performance metrics are logged automatically
}, config);
```

### Migration Checklist

When updating an endpoint to use the new system:

- [ ] Replace `withValidation` with `withAPIMiddleware`
- [ ] Remove manual auth checks (use `requiredRoles` or `requireAuthentication`)
- [ ] Update error handling to use custom error classes
- [ ] Add appropriate rate limiting configuration
- [ ] Test all error scenarios
- [ ] Update any existing tests

---

**Questions or Issues?**  
Contact the Engineering Team or create an issue in the internal repository.
