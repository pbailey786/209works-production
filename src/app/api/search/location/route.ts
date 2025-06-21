import { NextRequest } from 'next/server';
import { withAPIMiddleware } from '@/lib/middleware/api-middleware';
import { geolocationSearchSchema } from '@/lib/validations/api';
import { createSuccessResponse } from '@/lib/middleware/api-middleware';
import { prisma } from '@/lib/database/prisma';
import {
  GeolocationUtils,
  RelevanceScorer,
  TextProcessor
} from '@/lib/search/algorithms';

// GET /api/search/location - Location-based job search
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { query, performance } = context;
    const { lat, lng, radius: rawRadius, query: searchQuery } = query!;

    // Validate and set default radius
    const radius = typeof rawRadius === 'number' ? rawRadius : 25; // Default 25 miles

    // Generate cache key
    const cacheKey = generateCacheKey(
      CACHE_PREFIXES.search,
      'geolocation',
      `${lat},${lng}`,
      radius.toString(),
      searchQuery || 'all'
    );

    // Try cache first
    let results = await getCache<any>(cacheKey);
    if (results) {
      performance.trackCacheHit();
      return createSuccessResponse({
        ...results,
        cached: true
      });
    }

    performance.trackCacheMiss();

    // Calculate bounding box for efficient database queries
    const boundingBox = GeolocationUtils.getBoundingBox(lat, lng, radius);

    // Build search conditions
    const whereConditions: any = {};

    // Add text search if query provided
    if (searchQuery && searchQuery.length >= 2) {
      const searchTerms = TextProcessor.generateSearchTerms(searchQuery);
      whereConditions.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { company: { contains: searchQuery, mode: 'insensitive' } },
        ...searchTerms.map(term => ({
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { company: { contains: term, mode: 'insensitive' } },
          ]
        })),
      ];
    }

    // For now, search by location text since we don't have lat/lng in job table
    // In production, you'd filter by actual coordinates
    performance.trackDatabaseQuery();
    const jobs = await prisma.job.findMany({
      where: whereConditions,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        description: true,
        salaryMin: true,
        salaryMax: true,
        jobType: true,
        isRemote: true,
        createdAt: true,
        employer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 100, // Get more results to filter by actual distance
    });

    // Filter and calculate distances
    const jobsWithDistance = await Promise.all(
      jobs.map(async job => {
        // Try to geocode job location
        const jobCoords = await GeolocationUtils.geocodeLocation(job.location);

        let distance = null;
        let withinRadius = true;

        if (jobCoords) {
          distance = GeolocationUtils.calculateDistance(
            lat,
            lng,
            jobCoords.lat,
            jobCoords.lng
          );
          withinRadius = distance <= radius;
        }

        // Calculate relevance score if search query provided
        let relevanceScore = 1;
        if (searchQuery) {
          relevanceScore = RelevanceScorer.scoreJob(job, searchQuery);
        }

        return {
          ...job,
          distance,
          withinRadius,
          relevanceScore,
          coordinates: jobCoords
        };
      })
    );

    // Filter jobs within radius and sort
    const filteredJobs = jobsWithDistance
      .filter(job => job.withinRadius)
      .sort((a, b) => {
        if (searchQuery) {
          // Sort by relevance first if search query provided
          if (Math.abs(a.relevanceScore - b.relevanceScore) > 0.1) {
            return b.relevanceScore - a.relevanceScore;
          }
        }

        // Then sort by distance
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }

        // Fallback to creation date
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      .slice(0, 50); // Limit results

    // Generate location-based insights
    const insights = generateLocationInsights(filteredJobs, lat, lng, radius);

    const response = {
      searchLocation: { lat, lng, radius },
      query: searchQuery || null,
      totalResults: filteredJobs.length,
      results: filteredJobs.map(job => ({
        ...job,
        coordinates: undefined, // Don't expose raw coordinates
      })),
      insights,
      boundingBox
    };

    // Cache results
    await setCache(cacheKey, response, {
      ttl: DEFAULT_TTL.medium,
      tags: ['search', 'geolocation']
    });

    return createSuccessResponse({
      ...response,
      cached: false
    });
  },
  {
    querySchema: geolocationSearchSchema,
    rateLimit: { enabled: true, type: 'search' },
    logging: { enabled: true, includeQuery: true },
    cors: { enabled: true }
  }
);

// Generate insights about the location-based search
function generateLocationInsights(
  jobs: any[],
  lat: number,
  lng: number,
  radius: number
): any {
  if (jobs.length === 0) {
    return {
      averageDistance: null,
      jobTypes: [],
      salaryRange: null,
      topCompanies: [],
      remotePercentage: 0
    };
  }

  // Calculate average distance with null checks
  const jobsWithDistance = jobs.filter(
    job =>
      job &&
      typeof job.distance === 'number' &&
      !isNaN(job.distance) &&
      isFinite(job.distance)
  );

  const averageDistance =
    jobsWithDistance.length > 0
      ? jobsWithDistance.reduce((sum, job) => sum + job.distance, 0) /
        jobsWithDistance.length
      : null;

  // Job type distribution with null checks
  const jobTypeCounts: Record<string, number> = {};
  jobs.forEach(job => {
    if (job && job.jobType && typeof job.jobType === 'string') {
      jobTypeCounts[job.jobType] = (jobTypeCounts[job.jobType] || 0) + 1;
    }
  });

  const jobTypes = Object.entries(jobTypeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({
      type,
      count,
      percentage:
        jobs.length > 0 ? Math.round((count / jobs.length) * 100 * 10) / 10 : 0
    }));

  // Salary range with comprehensive validation
  const validSalaries = jobs
    .filter(job => job && (job.salaryMin || job.salaryMax))
    .map(job => {
      const salary = job.salaryMin || job.salaryMax;
      return typeof salary === 'number' &&
        !isNaN(salary) &&
        isFinite(salary) &&
        salary > 0
        ? salary
        : null;
    })
    .filter(salary => salary !== null);

  const salaryRange =
    validSalaries.length > 0
      ? {
          min: Math.min(...validSalaries),
          max: Math.max(...validSalaries),
          average:
            Math.round(
              (validSalaries.reduce((sum, salary) => sum + salary, 0) /
                validSalaries.length) *
                100
            ) / 100
        }
      : null;

  // Top companies with null checks
  const companyCounts: Record<string, number> = {};
  jobs.forEach(job => {
    if (
      job &&
      job.company &&
      typeof job.company === 'string' &&
      job.company.trim()
    ) {
      const companyName = job.company.trim();
      companyCounts[companyName] = (companyCounts[companyName] || 0) + 1;
    }
  });

  const topCompanies = Object.entries(companyCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([company, count]) => ({ company, jobCount: count }));

  // Remote work percentage with null checks
  const remoteJobs = jobs.filter(job => job && job.isRemote === true);
  const remotePercentage =
    jobs.length > 0
      ? Math.round((remoteJobs.length / jobs.length) * 100 * 10) / 10
      : 0;

  return {
    averageDistance: averageDistance
      ? Math.round(averageDistance * 10) / 10
      : null,
    jobTypes,
    salaryRange,
    topCompanies,
    remotePercentage: Math.round(remotePercentage * 10) / 10
  };
}
