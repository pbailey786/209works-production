import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  validateRequestData,
  generateRequestId,
  createErrorResponse,
  ValidationError,
} from '../errors/api-errors';

// Middleware wrapper for API routes with validation and error handling
export function withValidation<TBody = any, TQuery = any>(
  handler: (
    req: NextRequest,
    context: {
      params: any;
      body?: TBody;
      query?: TQuery;
      requestId: string;
    }
  ) => Promise<Response>,
  options?: {
    bodySchema?: z.ZodSchema<TBody>;
    querySchema?: z.ZodSchema<TQuery>;
    paramsSchema?: z.ZodSchema<any>;
  }
) {
  return async (req: NextRequest, context: { params: any }) => {
    const requestId = generateRequestId();

    try {
      let body: TBody | undefined;
      let query: TQuery | undefined;
      let validatedParams = context.params;

      // Validate request body for non-GET requests
      if (
        options?.bodySchema &&
        ['POST', 'PUT', 'PATCH'].includes(req.method)
      ) {
        try {
          const rawBody = await req.json();
          body = validateRequestData<TBody>(
            options.bodySchema,
            rawBody,
            'Invalid request body'
          );
        } catch (error) {
          if (error instanceof SyntaxError) {
            throw new ValidationError('Invalid JSON in request body');
          }
          throw error;
        }
      }

      // Validate query parameters
      if (options?.querySchema) {
        const searchParams = new URL(req.url).searchParams;
        const queryObject = Object.fromEntries(searchParams.entries());
        query = validateRequestData<TQuery>(
          options.querySchema,
          queryObject,
          'Invalid query parameters'
        );
      }

      // Validate URL parameters
      if (options?.paramsSchema) {
        validatedParams = validateRequestData(
          options.paramsSchema,
          context.params,
          'Invalid URL parameters'
        );
      }

      // Call the actual handler
      return await handler(req, {
        params: validatedParams,
        body,
        query,
        requestId,
      });
    } catch (error) {
      return createErrorResponse(error, requestId);
    }
  };
}

// Specific validation schemas for route parameters
export const routeParamsSchemas = {
  userId: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
  jobId: z.object({
    id: z.string().uuid('Invalid job ID format'),
  }),
  uuid: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
};

// Helper function to extract and validate pagination from URL
export function extractPagination(url: string, maxLimit = 50) {
  const searchParams = new URL(url).searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get('limit') || '10', 10))
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Helper function to extract sorting from URL
export function extractSorting(url: string, allowedFields: string[] = []) {
  const searchParams = new URL(url).searchParams;
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    throw new ValidationError(
      `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`
    );
  }

  return { [sortBy]: order };
}
