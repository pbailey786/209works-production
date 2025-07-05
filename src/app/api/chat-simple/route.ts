import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { buildJobQueryFromFiltersSafe } from '@/lib/job-query-builder';

// Simplified chat API without security middleware for testing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userMessage, conversationHistory = [] } = body;

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid userMessage' },
        { status: 400 }
      );
    }

    console.log('Simple chat API received:', { userMessage });

    // Basic filter extraction
    const message = userMessage.toLowerCase();
    let location = null;
    
    // Extract location keywords
    const locationKeywords = ['stockton', 'modesto', 'tracy', 'manteca', 'lodi'];
    location = locationKeywords.find(loc => message.includes(loc));

    // Extract job type
    let jobType = null;
    if (message.includes('warehouse')) jobType = 'warehouse';
    if (message.includes('customer service')) jobType = 'customer service';

    const filters = {
      location,
      other: userMessage,
      isRemote: false,
      sortBy: 'relevance'
    };

    console.log('Using filters:', filters);

    // Build query
    const jobQuery = buildJobQueryFromFiltersSafe(filters);
    console.log('Built query:', JSON.stringify(jobQuery, null, 2));

    // Search for jobs
    let jobs = [];
    try {
      jobs = await prisma.job.findMany({
        where: jobQuery,
        orderBy: [{ postedAt: 'desc' }],
        take: 10,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          jobType: true,
          salaryMin: true,
          salaryMax: true,
          description: true,
          postedAt: true,
          isRemote: true,
        },
      });
      console.log(`Found ${jobs.length} jobs`);
    } catch (queryError) {
      console.error('Query error:', queryError);
      return NextResponse.json(
        { error: 'Database query failed', details: String(queryError) },
        { status: 500 }
      );
    }

    // Generate simple response
    const response = jobs.length > 0 
      ? `Found ${jobs.length} job${jobs.length !== 1 ? 's' : ''} matching your search.`
      : "No jobs found matching your search. Try different keywords.";

    return NextResponse.json({
      response,
      jobs,
      filters,
      metadata: {
        totalResults: jobs.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Simple chat API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}