# API Validation and Error Handling

This document describes the comprehensive validation and error handling system implemented for the 209jobs API.

## Overview

The API uses a centralized validation and error handling system built with:
- **Zod** for schema validation
- **Custom error classes** for standardized error responses
- **Middleware wrapper** for consistent error handling
- **Type-safe validation** for all endpoints

## Key Features

### ✅ **Standardized Error Responses**
All API errors follow this consistent format:
```json
{
  "error": "ValidationError",
  "message": "Invalid input data",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "invalid-email"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_1705315800000_abc123"
}
```

### ✅ **Automatic Request Validation**
Request bodies, query parameters, and URL parameters are automatically validated using Zod schemas.

### ✅ **Type Safety**
All validated data is properly typed, providing excellent TypeScript support.

### ✅ **Centralized Error Handling**
Prisma errors, validation errors, and custom errors are all handled consistently.

## Usage

### Basic Endpoint with Validation

```typescript
import { withValidation, routeParamsSchemas } from '@/lib/middleware/validation';
import { createJobSchema } from '@/lib/validations/api';
import { createSuccessResponse, NotFoundError } from '@/lib/errors/api-errors';

export const POST = withValidation(
  async (req, { params, body, query, requestId }) => {
    // body is automatically validated and typed
    // params.id is validated as UUID
    // query parameters are validated if schema provided
    
    // Your business logic here
    const result = await someBusinessLogic(body);
    
    return createSuccessResponse(result, 'Operation successful');
  },
  {
    bodySchema: createJobSchema,           // Validates request body
    paramsSchema: routeParamsSchemas.jobId, // Validates URL params
    querySchema: jobSearchSchema,          // Validates query params
  }
);
```

### Available Validation Schemas

#### Job-related
- `createJobSchema` - For creating new jobs
- `updateJobSchema` - For updating existing jobs
- `jobSearchSchema` - For job search query parameters

#### User-related
- `updateUserSchema` - For updating user profiles
- `userApplicationsSchema` - For user applications query params
- `registerSchema` - For user registration

#### Application-related
- `createJobApplicationSchema` - For job applications

### Custom Error Classes

```typescript
import { 
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
} from '@/lib/errors/api-errors';

// Throw custom errors in your handlers
if (!user) {
  throw new NotFoundError('User');
}

if (user.role !== 'admin') {
  throw new AuthorizationError('Admin access required');
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `AUTHENTICATION_ERROR` | Authentication required | 401 |
| `AUTHORIZATION_ERROR` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `CONFLICT` | Resource already exists | 409 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `DATABASE_ERROR` | Database operation failed | 500 |
| `INTERNAL_SERVER_ERROR` | Unexpected error | 500 |

## Testing Validation

Use the test endpoint to verify validation works:

```bash
# Test with valid data
curl -X POST http://localhost:3000/api/test/validation \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Engineer",
    "description": "Build awesome applications",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "type": "full_time",
    "salaryMin": 80000,
    "salaryMax": 120000
  }'

# Test with invalid data (will return validation errors)
curl -X POST http://localhost:3000/api/test/validation \
  -H "Content-Type: application/json" \
  -d '{
    "title": "",
    "description": "Too short",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "type": "invalid_type"
  }'
```

## Benefits

1. **Consistency** - All endpoints handle errors the same way
2. **Security** - Sensitive information never leaks in error messages
3. **Developer Experience** - Clear error messages with field-level details
4. **Type Safety** - Full TypeScript support for validated data
5. **Maintainability** - Centralized validation logic
6. **Debugging** - Request IDs for tracing issues
7. **Production Ready** - Different error details for dev vs production

## Migration Guide

To convert existing endpoints to use the new validation system:

1. **Wrap your handler** with `withValidation()`
2. **Remove manual validation** code
3. **Replace manual error responses** with error classes
4. **Update types** to use validated data from context
5. **Test thoroughly** with both valid and invalid data

Example before/after:

```typescript
// Before
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }
    // ... rest of logic
  } catch (error) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// After
export const POST = withValidation(
  async (req, { body, requestId }) => {
    // body.title is guaranteed to exist and be valid
    // ... rest of logic
    return createSuccessResponse(result);
  },
  { bodySchema: createJobSchema }
);
``` 