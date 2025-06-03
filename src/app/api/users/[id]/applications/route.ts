import { NextRequest } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api';
import { paginatedQuerySchema } from '@/lib/cache/pagination';
import { routeParamsSchemas } from '@/lib/middleware/validation';
import { UserCacheService } from '@/lib/cache/services';
import {
  createSuccessResponse,
  AuthorizationError,
} from '@/lib/errors/api-errors';

// GET /api/users/:id/applications - Get user's job applications with pagination
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { user, params, query, performance } = context;
    const userId = params.id;

    // Users can only view their own applications, admins can view any
    if (user!.id !== userId && user!.role !== 'admin') {
      throw new AuthorizationError('You can only view your own applications');
    }

    // Extract pagination parameters safely based on type
    let paginationParams: any;
    const queryParams = query!;

    if ('cursor' in queryParams && queryParams.cursor) {
      // Cursor-based pagination
      paginationParams = {
        cursor: queryParams.cursor,
        limit: queryParams.limit || 20,
        direction:
          'direction' in queryParams
            ? queryParams.direction || 'forward'
            : 'forward',
      };
    } else if ('page' in queryParams && queryParams.page) {
      // Page-based pagination
      paginationParams = {
        page: queryParams.page,
        limit: queryParams.limit || 20,
      };
    } else {
      // Default pagination
      paginationParams = {
        page: 1,
        limit: queryParams.limit || 20,
      };
    }

    // Get paginated applications with caching
    const results = await UserCacheService.getUserApplications(
      userId,
      paginationParams
    );

    return createSuccessResponse(results);
  },
  {
    requireAuthentication: true,
    paramsSchema: routeParamsSchemas.userId,
    querySchema: paginatedQuerySchema,
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true, includeQuery: true },
    cors: { enabled: true },
  }
);
