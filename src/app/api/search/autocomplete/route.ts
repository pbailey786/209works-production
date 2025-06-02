import { NextRequest } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api';
import { autocompleteQuerySchema } from '@/lib/validations/search';
import { createSuccessResponse } from '@/lib/errors/api-errors';
import { prisma } from '../../auth/prisma';
import { 
  getCache, 
  setCache, 
  generateCacheKey,
  CACHE_PREFIXES,
  DEFAULT_TTL 
} from '@/lib/cache/redis';
import { TextProcessor } from '@/lib/search/algorithms';

// GET /api/search/autocomplete - Get search suggestions
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { query, performance } = context;
    const { q, type, limit } = query!;
    
    // Validate required parameters
    if (!q || typeof q !== 'string') {
      return createSuccessResponse({
        query: '',
        type: type || 'jobs',
        suggestions: [],
        error: 'Query parameter is required',
      });
    }

    const validLimit = typeof limit === 'number' ? limit : 10;

    // Generate cache key
    const cacheKey = generateCacheKey(
      CACHE_PREFIXES.search,
      'autocomplete',
      type || 'jobs',
      q.toLowerCase(),
      validLimit.toString()
    );
    
    // Try cache first
    let suggestions = await getCache<string[]>(cacheKey);
    if (suggestions) {
      performance.trackCacheHit();
      return createSuccessResponse({
        query: q,
        type,
        suggestions,
        cached: true,
      });
    }
    
    performance.trackCacheMiss();
    
    // Generate suggestions based on type
    switch (type || 'jobs') {
      case 'jobs':
        suggestions = await generateJobSuggestions(q, validLimit, performance);
        break;
      case 'companies':
        suggestions = await generateCompanySuggestions(q, validLimit, performance);
        break;
      case 'locations':
        suggestions = await generateLocationSuggestions(q, validLimit, performance);
        break;
      case 'skills':
        suggestions = await generateSkillSuggestions(q, validLimit, performance);
        break;
      default:
        suggestions = [];
    }
    
    // Cache suggestions
    await setCache(cacheKey, suggestions, {
      ttl: DEFAULT_TTL.medium,
      tags: ['search', 'autocomplete'],
    });
    
    return createSuccessResponse({
      query: q,
      type,
      suggestions,
      cached: false,
    });
  },
  {
    querySchema: autocompleteQuerySchema,
    rateLimit: { enabled: true, type: 'search' },
    logging: { enabled: true, includeQuery: true },
    cors: { enabled: true },
  }
);

// Generate job title suggestions
async function generateJobSuggestions(
  query: string, 
  limit: number,
  performance: any
): Promise<string[]> {
  performance.trackDatabaseQuery();
  
  const jobs = await prisma.job.findMany({
    where: {
      title: {
        contains: query,
        mode: 'insensitive',
      },
    },
    select: {
      title: true,
    },
    take: limit * 2, // Get more to filter duplicates
  });
  
  // Extract unique titles and rank by frequency
  const titleCounts: Record<string, number> = {};
  jobs.forEach(job => {
    const normalizedTitle = job.title.trim();
    titleCounts[normalizedTitle] = (titleCounts[normalizedTitle] || 0) + 1;
  });
  
  return Object.entries(titleCounts)
    .sort(([, a], [, b]) => b - a) // Sort by frequency
    .slice(0, limit)
    .map(([title]) => title);
}

// Generate company suggestions
async function generateCompanySuggestions(
  query: string, 
  limit: number,
  performance: any
): Promise<string[]> {
  performance.trackDatabaseQuery();
  
  const companies = await prisma.job.findMany({
    where: {
      company: {
        contains: query,
        mode: 'insensitive',
      },
    },
    select: {
      company: true,
    },
    distinct: ['company'],
    take: limit,
  });
  
  return companies.map(job => job.company).filter(Boolean);
}

// Generate location suggestions
async function generateLocationSuggestions(
  query: string, 
  limit: number,
  performance: any
): Promise<string[]> {
  performance.trackDatabaseQuery();
  
  const locations = await prisma.job.findMany({
    where: {
      location: {
        contains: query,
        mode: 'insensitive',
      },
    },
    select: {
      location: true,
    },
    distinct: ['location'],
    take: limit,
  });
  
  return locations.map(job => job.location).filter(Boolean);
}

// Generate skill suggestions
async function generateSkillSuggestions(
  query: string, 
  limit: number,
  performance: any
): Promise<string[]> {
  // Common tech skills - in production, this would come from a database
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
    'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
    'HTML', 'CSS', 'Angular', 'Vue.js', 'Next.js', 'Express',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes',
    'AWS', 'Azure', 'GCP', 'Git', 'Linux', 'API Development',
    'Machine Learning', 'Data Science', 'DevOps', 'Cybersecurity',
    'UI/UX Design', 'Product Management', 'Digital Marketing', 'Sales'
  ];
  
  // Filter skills that match the query
  const normalizedQuery = TextProcessor.normalize(query);
  const matchingSkills = commonSkills.filter(skill =>
    TextProcessor.normalize(skill).includes(normalizedQuery)
  );
  
  // Also try to get skills from user profiles
  performance.trackDatabaseQuery();
  const userSkills = await prisma.user.findMany({
    where: {
      skills: {
        hasSome: [query],
      },
    },
    select: {
      skills: true,
    },
    take: 50,
  });
  
  // Extract and flatten skills from users
  const dbSkills = userSkills
    .flatMap(user => user.skills || [])
    .filter(skill => 
      skill && TextProcessor.normalize(skill).includes(normalizedQuery)
    );
  
  // Combine and deduplicate
  const allSkills = [...new Set([...matchingSkills, ...dbSkills])];
  
  return allSkills.slice(0, limit);
} 