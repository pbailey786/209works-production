import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { getDomainConfig } from '@/lib/domain/config';

// POST /api/saved-searches/[id]/run - Execute a saved search
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the saved search
    const savedSearch = await prisma.savedSearch.findFirst({
      where: {
        id: params.id,
        userId,
        isActive: true,
      },
    });

    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    // Parse filters
    const filters = savedSearch.filters ? JSON.parse(savedSearch.filters) : {};
    
    // Get domain configuration
    const domainConfig = getDomainConfig(req.headers.get('host') || '');
    
    // Build search query for database
    const whereCondition: any = {
      status: 'active',
      deletedAt: null,
      areaCodes: {
        hasSome: [domainConfig.areaCode],
      },
    };

    // Apply search query
    if (savedSearch.query) {
      whereCondition.OR = [
        { title: { contains: savedSearch.query, mode: 'insensitive' } },
        { description: { contains: savedSearch.query, mode: 'insensitive' } },
        { company: { contains: savedSearch.query, mode: 'insensitive' } },
      ];
    }

    // Apply filters
    if (filters.jobType) {
      whereCondition.jobType = filters.jobType;
    }

    if (filters.location) {
      whereCondition.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters.remote) {
      whereCondition.isRemote = true;
    }

    if (filters.salaryMin || filters.salaryMax) {
      whereCondition.AND = whereCondition.AND || [];
      if (filters.salaryMin) {
        whereCondition.AND.push({
          OR: [
            { salaryMin: { gte: filters.salaryMin } },
            { salaryMax: { gte: filters.salaryMin } },
          ],
        });
      }
      if (filters.salaryMax) {
        whereCondition.AND.push({
          OR: [
            { salaryMin: { lte: filters.salaryMax } },
            { salaryMax: { lte: filters.salaryMax } },
          ],
        });
      }
    }

    if (filters.experienceLevel) {
      // This would need to be implemented based on how experience level is stored
      // For now, we'll search in the description
      whereCondition.description = {
        contains: filters.experienceLevel,
        mode: 'insensitive',
      };
    }

    if (filters.skills && filters.skills.length > 0) {
      whereCondition.OR = whereCondition.OR || [];
      filters.skills.forEach((skill: string) => {
        whereCondition.OR.push(
          { skills: { has: skill } },
          { description: { contains: skill, mode: 'insensitive' } },
          { title: { contains: skill, mode: 'insensitive' } }
        );
      });
    }

    // Execute the search
    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where: whereCondition,
        orderBy: { postedAt: 'desc' },
        take: 20,
        include: {
          jobApplications: {
            where: { userId },
            select: { id: true, status: true },
          },
        },
      }),
      prisma.job.count({ where: whereCondition }),
    ]);

    // Update the saved search's lastRun timestamp
    await prisma.savedSearch.update({
      where: { id: params.id },
      data: { lastRun: new Date() },
    });

    // Calculate relevance scores for results
    const results = jobs.map(job => ({
      job,
      relevanceScore: calculateRelevanceScore(job, savedSearch.query, filters),
      snippet: generateSnippet(job, savedSearch.query),
    }));

    return NextResponse.json({
      success: true,
      results,
      totalCount,
      searchMetadata: {
        savedSearchId: savedSearch.id,
        savedSearchName: savedSearch.name,
        query: savedSearch.query,
        filters,
        region: domainConfig.region,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error running saved search:', error);
    return NextResponse.json(
      { error: 'Failed to run saved search' },
      { status: 500 }
    );
  }
}

// Helper function to calculate relevance score
function calculateRelevanceScore(job: any, query: string, filters: any): number {
  let score = 0;

  if (query) {
    const queryLower = query.toLowerCase();
    const titleLower = job.title.toLowerCase();
    const descriptionLower = job.description.toLowerCase();
    const companyLower = job.company.toLowerCase();

    // Title match (highest weight)
    if (titleLower.includes(queryLower)) score += 10;
    
    // Exact title match
    if (titleLower === queryLower) score += 20;
    
    // Company match
    if (companyLower.includes(queryLower)) score += 8;
    
    // Description match
    if (descriptionLower.includes(queryLower)) score += 5;
  }

  // Recency bonus
  const daysSincePosted = Math.floor(
    (Date.now() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSincePosted <= 7) score += 3;
  else if (daysSincePosted <= 30) score += 1;

  // Featured job bonus
  if (job.featured) score += 5;

  return Math.max(score, 1);
}

// Helper function to generate snippet
function generateSnippet(job: any, query: string): string {
  if (!query || !job.description) return '';

  const description = job.description;
  const queryLower = query.toLowerCase();
  const descriptionLower = description.toLowerCase();
  
  const index = descriptionLower.indexOf(queryLower);
  if (index === -1) return '';

  const start = Math.max(0, index - 50);
  const end = Math.min(description.length, index + query.length + 50);
  
  let snippet = description.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < description.length) snippet = snippet + '...';
  
  return snippet;
}
