import { NextRequest } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api-middleware';
import { createSuccessResponse } from '@/lib/utils/api-response';
import { prisma } from '@/lib/database/prisma';
import { z } from '@/lib/cache/redis';

// Query schema for suggestions
const suggestionsQuerySchema = z.object({
  type: z.enum(['trending', 'popular', 'recent']).default('trending'),
  category: z
    .enum(['all', 'jobs', 'locations', 'companies', 'skills'])
    .default('all'),
  limit: z.coerce.number().min(1).max(50).default(10)
});

// GET /api/search/suggestions - Get search suggestions and trending topics
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { query, performance } = context;
    const { type = 'trending', category = 'all', limit = 10 } = query!;

    // Validate parameters
    const validType = typeof type === 'string' ? type : 'trending';
    const validCategory = typeof category === 'string' ? category : 'all';
    const validLimit = typeof limit === 'number' ? limit : 10;

    // Generate cache key
    const cacheKey = generateCacheKey(
      CACHE_PREFIXES.search,
      'suggestions',
      validType,
      validCategory,
      validLimit.toString()
    );

    // Try cache first
    let suggestions = await getCache<any>(cacheKey);
    if (suggestions) {
      performance.trackCacheHit();
      return createSuccessResponse({
        type: validType,
        category: validCategory,
        suggestions,
        cached: true
      });
    }

    performance.trackCacheMiss();

    // Generate suggestions based on type
    switch (validType) {
      case 'trending':
        suggestions = await generateTrendingSuggestions(
          validCategory,
          validLimit,
          performance
        );
        break;
      case 'popular':
        suggestions = await generatePopularSuggestions(
          validCategory,
          validLimit,
          performance
        );
        break;
      case 'recent':
        suggestions = await generateRecentSuggestions(
          validCategory,
          validLimit,
          performance
        );
        break;
      default:
        suggestions = [];
    }

    // Cache suggestions
    await setCache(cacheKey, suggestions, {
      ttl: DEFAULT_TTL.short, // Trending data changes frequently
      tags: ['search', 'suggestions']
    });

    return createSuccessResponse({
      type: validType,
      category: validCategory,
      suggestions,
      cached: false
    });
  },
  {
    querySchema: suggestionsQuerySchema,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true },
    cors: { enabled: true }
  }
);

// Generate trending suggestions (simulated algorithm)
async function generateTrendingSuggestions(
  category: string,
  limit: number,
  performance: any
): Promise<any[]> {
  const suggestions: any[] = [];

  if (category === 'all' || category === 'jobs') {
    // Get trending job titles based on recent job postings
    performance.trackDatabaseQuery();
    const recentJobs = await prisma.job.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        }
      },
      select: {
        title: true,
        jobType: true
      },
      take: 100
    });

    // Count job title frequencies
    const titleCounts: Record<string, number> = {};
    recentJobs.forEach(job => {
      const normalizedTitle = job.title.toLowerCase().trim();
      titleCounts[normalizedTitle] = (titleCounts[normalizedTitle] || 0) + 1;
    });

    const trendingJobs = Object.entries(titleCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, Math.ceil(limit / 2))
      .map(([title, count]) => ({
        query: title,
        type: 'job',
        frequency: count,
        trend: 'up'
      }));

    suggestions.push(...trendingJobs);
  }

  if (category === 'all' || category === 'locations') {
    // Trending locations
    const trendingLocations = [
      { query: 'remote', type: 'location', frequency: 95, trend: 'up' },
      { query: 'san francisco', type: 'location', frequency: 78, trend: 'up' },
      { query: 'new york', type: 'location', frequency: 65, trend: 'stable' },
      { query: 'austin', type: 'location', frequency: 52, trend: 'up' },
      { query: 'seattle', type: 'location', frequency: 48, trend: 'stable' },
    ];

    suggestions.push(...trendingLocations.slice(0, Math.ceil(limit / 4)));
  }

  if (category === 'all' || category === 'skills') {
    // Trending skills
    const trendingSkills = [
      {
        query: 'artificial intelligence',
        type: 'skill',
        frequency: 89,
        trend: 'up'
      },
      { query: 'react', type: 'skill', frequency: 76, trend: 'stable' },
      { query: 'kubernetes', type: 'skill', frequency: 67, trend: 'up' },
      { query: 'machine learning', type: 'skill', frequency: 63, trend: 'up' },
      { query: 'typescript', type: 'skill', frequency: 58, trend: 'stable' },
    ];

    suggestions.push(...trendingSkills.slice(0, Math.ceil(limit / 4)));
  }

  // Sort by frequency and return top results
  return suggestions.sort((a, b) => b.frequency - a.frequency).slice(0, limit);
}

// Generate popular all-time suggestions
async function generatePopularSuggestions(
  category: string,
  limit: number,
  performance: any
): Promise<any[]> {
  const suggestions: any[] = [];

  if (category === 'all' || category === 'jobs') {
    // Popular job searches
    const popularJobs = [
      { query: 'software engineer', type: 'job', searches: 2450 },
      { query: 'data scientist', type: 'job', searches: 1876 },
      { query: 'product manager', type: 'job', searches: 1654 },
      { query: 'frontend developer', type: 'job', searches: 1432 },
      { query: 'backend developer', type: 'job', searches: 1298 },
      { query: 'devops engineer', type: 'job', searches: 1145 },
      { query: 'ux designer', type: 'job', searches: 987 },
      { query: 'marketing manager', type: 'job', searches: 865 },
    ];

    suggestions.push(...popularJobs.slice(0, Math.ceil(limit / 2)));
  }

  if (category === 'all' || category === 'companies') {
    // Popular company searches
    performance.trackDatabaseQuery();
    const popularCompanies = await prisma.job.groupBy({
      by: ['company'],
      _count: {
        company: true
      },
      orderBy: {
        _count: {
          company: 'desc'
        }
      },
      take: Math.ceil(limit / 4)
    });

    const companyResults = popularCompanies.map(item => ({
      query: item.company,
      type: 'company',
      searches: item._count.company
    }));

    suggestions.push(...companyResults);
  }

  return suggestions.sort((a, b) => b.searches - a.searches).slice(0, limit);
}

// Generate recent suggestions
async function generateRecentSuggestions(
  category: string,
  limit: number,
  performance: any
): Promise<any[]> {
  const suggestions: any[] = [];

  if (category === 'all' || category === 'jobs') {
    // Recent job postings
    performance.trackDatabaseQuery();
    const recentJobs = await prisma.job.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        }
      },
      select: {
        title: true,
        company: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    const jobResults = recentJobs.map(job => ({
      query: job.title,
      type: 'job',
      company: job.company,
      postedAt: job.createdAt
    }));

    suggestions.push(...jobResults);
  }

  return suggestions.slice(0, limit);
}
