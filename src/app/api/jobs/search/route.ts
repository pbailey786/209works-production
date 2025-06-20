import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getDomainConfig } from '@/lib/domain/config';

/**
 * GET /api/jobs/search - Enhanced job search with regional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const hostname = request.headers.get('host') || '';

    // Get domain configuration for regional filtering
    const domainConfig = getDomainConfig(hostname);

    // Extract search parameters
    const q = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const salaryMin = searchParams.get('salaryMin');
    const salaryMax = searchParams.get('salaryMax');
    const remote = searchParams.get('remote') === 'true';
    const datePosted = searchParams.get('datePosted') || '';
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const region = searchParams.get('region') || domainConfig.areaCode;

    // Build where condition with regional filtering
    const whereCondition: any = {
      status: 'ACTIVE',
      // Regional filtering - jobs must be in the current domain's region
      OR: [
        { region: region },
        { location: { contains: domainConfig.region, mode: 'insensitive' } },
        {
          location: {
            in: domainConfig.cities.map(city => city.toLowerCase())
          }
        }
      ]
    };

    // Add search query filtering
    if (q) {
      whereCondition.AND = [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } },
            { categories: { hasSome: [q] } }
          ]
        }
      ];
    }

    // Add additional filters
    if (location) {
      whereCondition.location = { contains: location, mode: 'insensitive' };
    }

    if (jobType) {
      whereCondition.jobType = jobType;
    }

    if (experienceLevel) {
      whereCondition.experienceLevel = experienceLevel;
    }

    if (salaryMin) {
      whereCondition.salaryMin = { gte: parseInt(salaryMin) };
    }

    if (salaryMax) {
      whereCondition.salaryMax = { lte: parseInt(salaryMax) };
    }

    if (remote) {
      whereCondition.remote = true;
    }

    if (datePosted) {
      const dateFilter = getDateFilter(datePosted);
      if (dateFilter) {
        whereCondition.createdAt = { gte: dateFilter };
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'salary') {
      orderBy = { salaryMax: 'desc' };
    } else if (sortBy === 'relevance' && q) {
      // For relevance, we'll use a simple scoring based on title match
      orderBy = { createdAt: 'desc' }; // Fallback to date for now
    }

    // Execute search query
    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where: whereCondition,
        orderBy,
        skip,
        take: limit,
        include: {
          jobApplications: {
            where: userId ? { userId } : undefined,
            select: { id: true, status: true }
          }
        }
      }),
      prisma.job.count({ where: whereCondition })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        data: jobs.map(job => ({
          item: job,
          relevanceScore: calculateRelevanceScore(job, q),
          snippet: generateSnippet(job, q)
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage
        }
      },
      meta: {
        query: q,
        region: domainConfig.region,
        domain: domainConfig.domain,
        searchType: 'regional',
        filtersApplied: {
          location: !!location,
          jobType: !!jobType,
          experienceLevel: !!experienceLevel,
          salary: !!(salaryMin || salaryMax),
          remote,
          datePosted: !!datePosted
        }
      }
    });

  } catch (error) {
    console.error('Job search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search jobs',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to get date filter
function getDateFilter(datePosted: string): Date | null {
  const now = new Date();
  switch (datePosted) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

// Helper function to calculate relevance score
function calculateRelevanceScore(job: any, query: string): number {
  if (!query) return 1;

  let score = 0;
  const queryLower = query.toLowerCase();

  // Title match (highest weight)
  if (job.title.toLowerCase().includes(queryLower)) {
    score += 10;
  }

  // Company match
  if (job.company.toLowerCase().includes(queryLower)) {
    score += 5;
  }

  // Description match
  if (job.description.toLowerCase().includes(queryLower)) {
    score += 3;
  }

  // Category match
  if (job.categories && job.categories.some((cat: string) =>
    cat.toLowerCase().includes(queryLower)
  )) {
    score += 7;
  }

  return score;
}

// Helper function to generate snippet
function generateSnippet(job: any, query: string): string {
  if (!query) return job.description.substring(0, 150) + '...';

  const queryLower = query.toLowerCase();
  const description = job.description.toLowerCase();
  const index = description.indexOf(queryLower);

  if (index === -1) {
    return job.description.substring(0, 150) + '...';
  }

  const start = Math.max(0, index - 50);
  const end = Math.min(job.description.length, index + query.length + 50);

  return '...' + job.description.substring(start, end) + '...';
}
