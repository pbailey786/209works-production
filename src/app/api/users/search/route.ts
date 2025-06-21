import { NextRequest } from 'next/server';
import { withAPIMiddleware } from '@/components/ui/card';
import { userSearchQuerySchema } from '@/components/ui/card';
import { UserSearchService } from '@/components/ui/card';
import { createSuccessResponse } from '@/lib/errors/api-errors';

// GET /api/users/search - Search users/candidates (employers only)
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { query, performance } = context;

    // Extract search parameters
    const { q = '', skills, ...searchParams } = query!;

    // Convert string arrays from query params
    const processedSkills = skills
      ? Array.isArray(skills)
        ? skills
        : [skills]
      : undefined;

    // Build search filters
    const filters = {
      ...searchParams,
      skills: processedSkills,
    };

    // Extract pagination parameters safely based on type
    let paginationParams: any;
    if ('cursor' in searchParams && searchParams.cursor) {
      // Cursor-based pagination
      paginationParams = {
        cursor: searchParams.cursor,
        limit: searchParams.limit || 20,
        direction:
          'direction' in searchParams
            ? searchParams.direction || 'forward'
            : 'forward',
      };
    } else if ('page' in searchParams && searchParams.page) {
      // Page-based pagination
      paginationParams = {
        page: searchParams.page,
        limit: searchParams.limit || 20,
      };
    } else {
      // Default pagination
      paginationParams = {
        page: 1,
        limit: searchParams.limit || 20,
      };
    }

    // Execute user search
    const results = await UserSearchService.searchUsers(
      q,
      filters,
      paginationParams,
      performance
    );

    // Add search metadata
    const responseWithMeta = {
      ...results,
      searchMetadata: {
        query: q,
        totalResults: results.data.length,
        searchType: 'users',
        filtersApplied: Object.keys(filters).filter(
          key =>
            filters[key as keyof typeof filters] !== undefined &&
            filters[key as keyof typeof filters] !== ''
        ),
      },
    };

    return createSuccessResponse(responseWithMeta);
  },
  {
    requiredRoles: ['admin', 'employer'],
    querySchema: userSearchQuerySchema,
    rateLimit: { enabled: true, type: 'premium' },
    logging: {
      enabled: true,
      includeQuery: true,
    },
    cors: { enabled: true },
  }
);
