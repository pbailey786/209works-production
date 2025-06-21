import { NextRequest, NextResponse } from 'next/server';
import { withValidation } from '@/lib/middleware/validation';
import { routeParamsSchemas } from '@/lib/errors/api-errors';
import { UserCacheService } from '@/lib/services/user-cache';
import { z } from 'zod';

// Mock paginatedQuerySchema for build compatibility
const paginatedQuerySchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  status: z.string().optional()
});

// GET /api/users/:id/applications - Get user's job applications with pagination
export const GET = withValidation(
  async (req, { params, query }) => {
    // Check authorization
    const session = await requireRole(req, ['admin', 'employer', 'jobseeker']);
    if (session instanceof NextResponse) return session;

    const user = (session as any).user;
    // User and params already available from above
    const userId = params.id;

    // Users can only view their own applications, admins can view any
    if (user.id !== userId && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'You can only view your own applications' }, { status: 403 });
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
            : 'forward'
      };
    } else if ('page' in queryParams && queryParams.page) {
      // Page-based pagination
      paginationParams = {
        page: queryParams.page,
        limit: queryParams.limit || 20
      };
    } else {
      // Default pagination
      paginationParams = {
        page: 1,
        limit: queryParams.limit || 20
      };
    }

    // Get paginated applications with caching
    const results = await UserCacheService.getUserApplications(
      userId,
      paginationParams
    );

    return NextResponse.json({ success: true, data: results });
  },
  {
    requireAuthentication: true,
    paramsSchema: routeParamsSchemas.userId,
    querySchema: paginatedQuerySchema,
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true, includeQuery: true },
    cors: { enabled: true }
  }
);
