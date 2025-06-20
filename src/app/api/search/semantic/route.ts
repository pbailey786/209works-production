import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SemanticSearchEngine, SemanticSearchParams } from '@/lib/ai/semantic-search';
import { getDomainConfig } from '@/lib/domain/config';
import { EnhancedPerformanceTracker } from '@/lib/performance/performance-monitor';

/**
 * POST /api/search/semantic
 * Advanced semantic search using AI embeddings
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { query, filters = {}, limit = 20, threshold = 0.7 } = body;

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Get domain context for regional filtering
    const hostname = request.headers.get('host') || '';
    const domainConfig = getDomainConfig(hostname);
    const region = filters.region || domainConfig.areaCode;

    // Prepare search parameters
    const searchParams: SemanticSearchParams = {
      query: query.trim(),
      region,
      filters: {
        jobType: filters.jobType,
        experienceLevel: filters.experienceLevel,
        salaryMin: filters.salaryMin ? parseInt(filters.salaryMin) : undefined,
        salaryMax: filters.salaryMax ? parseInt(filters.salaryMax) : undefined,
        remote: filters.remote === true || filters.remote === 'true',
        skills: Array.isArray(filters.skills) ? filters.skills : [],
        location: filters.location,
      },
      limit: Math.min(limit, 50), // Cap at 50 results
      threshold: Math.max(0.1, Math.min(threshold, 1)), // Ensure valid threshold
    };

    // Perform semantic search
    const results = await SemanticSearchEngine.searchJobs(searchParams);

    // Track performance
    const duration = Date.now() - startTime;
    EnhancedPerformanceTracker.trackAPICall({
      endpoint: '/api/search/semantic',
      method: 'POST',
      duration,
      statusCode: 200,
      region,
    });

    // Format response
    const response = {
      success: true,
      data: {
        results: results.map(result => ({
          job: {
            id: result.job.id,
            title: result.job.title,
            company: result.job.company,
            location: result.job.location,
            jobType: result.job.jobType,
            experienceLevel: result.job.experienceLevel,
            salaryMin: result.job.salaryMin,
            salaryMax: result.job.salaryMax,
            description: result.job.description.substring(0, 500) + '...', // Truncate for API
            categories: result.job.categories,
            skills: result.job.skills,
            remote: result.job.remote,
            featured: result.job.featured,
            createdAt: result.job.createdAt,
            applicationCount: result.job.jobApplications?.length || 0,
          },
          semanticScore: Math.round(result.semanticScore * 100) / 100,
          relevanceScore: Math.round(result.relevanceScore * 100) / 100,
          matchedConcepts: result.matchedConcepts,
          explanation: result.explanation,
        })),
        totalResults: results.length,
        searchParams: {
          query: searchParams.query,
          region: domainConfig.region,
          filters: searchParams.filters,
          threshold: searchParams.threshold,
        },
        performance: {
          duration,
          cached: false, // Will be true if served from cache
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        region: domainConfig.region,
        domain: domainConfig.domain,
        searchType: 'semantic',
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Semantic search error:', error);
    
    // Track error
    const duration = Date.now() - startTime;
    EnhancedPerformanceTracker.trackAPICall({
      endpoint: '/api/search/semantic',
      method: 'POST',
      duration,
      statusCode: 500,
      region: '209', // Default region for error tracking
    });

    return NextResponse.json(
      { 
        error: 'Internal server error during semantic search',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search/semantic
 * Get semantic search with query parameters (for simple searches)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter (q or query) is required' },
        { status: 400 }
      );
    }

    // Get domain context
    const hostname = request.headers.get('host') || '';
    const domainConfig = getDomainConfig(hostname);
    
    // Parse filters from query parameters
    const filters = {
      jobType: searchParams.get('jobType'),
      experienceLevel: searchParams.get('experienceLevel'),
      salaryMin: searchParams.get('salaryMin'),
      salaryMax: searchParams.get('salaryMax'),
      remote: searchParams.get('remote'),
      location: searchParams.get('location'),
      skills: searchParams.get('skills')?.split(',').filter(Boolean) || [],
    };

    const limit = parseInt(searchParams.get('limit') || '20');
    const threshold = parseFloat(searchParams.get('threshold') || '0.7');

    // Prepare search parameters
    const semanticSearchParams: SemanticSearchParams = {
      query: query.trim(),
      region: domainConfig.areaCode,
      filters: {
        jobType: filters.jobType || undefined,
        experienceLevel: filters.experienceLevel || undefined,
        salaryMin: filters.salaryMin ? parseInt(filters.salaryMin) : undefined,
        salaryMax: filters.salaryMax ? parseInt(filters.salaryMax) : undefined,
        remote: filters.remote === 'true',
        skills: filters.skills,
        location: filters.location || undefined,
      },
      limit: Math.min(limit, 50),
      threshold: Math.max(0.1, Math.min(threshold, 1)),
    };

    // Perform semantic search
    const results = await SemanticSearchEngine.searchJobs(semanticSearchParams);

    // Track performance
    const duration = Date.now() - startTime;
    EnhancedPerformanceTracker.trackAPICall({
      endpoint: '/api/search/semantic',
      method: 'GET',
      duration,
      statusCode: 200,
      region: domainConfig.areaCode,
    });

    // Format response (simplified for GET)
    const response = {
      success: true,
      data: {
        jobs: results.map(result => ({
          ...result.job,
          semanticScore: result.semanticScore,
          explanation: result.explanation,
        })),
        totalCount: results.length,
        query,
        region: domainConfig.region,
      },
      meta: {
        timestamp: new Date().toISOString(),
        searchType: 'semantic',
        performance: { duration },
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Semantic search GET error:', error);
    
    // Track error
    const duration = Date.now() - startTime;
    EnhancedPerformanceTracker.trackAPICall({
      endpoint: '/api/search/semantic',
      method: 'GET',
      duration,
      statusCode: 500,
      region: '209',
    });

    return NextResponse.json(
      { 
        error: 'Internal server error during semantic search',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/search/semantic
 * CORS preflight support
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
