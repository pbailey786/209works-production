import { NextRequest } from '@/components/ui/card';
import { withAPIMiddleware } from '@/components/ui/card';
import { enhancedSearchQuerySchema } from '@/components/ui/card';
import { EnhancedJobSearchService } from '@/components/ui/card';
import { createSuccessResponse } from '@/lib/errors/api-errors';

// GET /api/jobs/search - Enhanced job search with relevance scoring and geolocation
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { query, performance } = context;

    // Extract and process search parameters
    const {
      q = '',
      sortBy = 'relevance',
      sortOrder = 'desc',
      includeSnippets,
      highlightMatches,
      useRelevanceScoring,
      includeFacets,
      skills,
      ...searchParams
    } = query!;

    // Convert string arrays from query params
    const processedSkills = skills
      ? Array.isArray(skills)
        ? skills
        : [skills]
      : undefined;

    // Build enhanced filters
    const enhancedFilters = {
      ...searchParams,
      skills: processedSkills,
      includeSnippets: includeSnippets === 'true',
      highlightMatches: highlightMatches === 'true',
      useRelevanceScoring: useRelevanceScoring !== 'false',
      includeFacets: includeFacets === 'true',
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

    // Use enhanced search service
    const results = await EnhancedJobSearchService.searchJobsEnhanced(
      q,
      enhancedFilters,
      paginationParams,
      performance
    );

    // Add search metadata
    const responseWithMeta = {
      ...results,
      searchMetadata: {
        query: q,
        totalResults: results.data.length,
        searchType: 'enhanced',
        relevanceScoring: enhancedFilters.useRelevanceScoring,
        geolocationUsed: !!(enhancedFilters.lat && enhancedFilters.lng),
        filtersApplied: Object.keys(enhancedFilters).filter(
          key =>
            enhancedFilters[key as keyof typeof enhancedFilters] !==
              undefined &&
            enhancedFilters[key as keyof typeof enhancedFilters] !== false &&
            enhancedFilters[key as keyof typeof enhancedFilters] !== ''
        ),
      },
    };

    return createSuccessResponse(responseWithMeta);
  },
  {
    querySchema: enhancedSearchQuerySchema,
    rateLimit: { enabled: true, type: 'search' },
    logging: {
      enabled: true,
      includeQuery: true,
    },
    cors: { enabled: true },
  }
);
