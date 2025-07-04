import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { buildJobQueryFromFiltersSafe } from '@/lib/job-query-builder';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filters = {} } = body;

    // Build query
    const query = buildJobQueryFromFiltersSafe(filters);
    
    console.log('Debug query:', JSON.stringify(query, null, 2));

    // Test the query
    const jobs = await prisma.job.findMany({
      where: query,
      take: 5,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        status: true,
        expiresAt: true,
        isRemote: true,
        categories: true
      }
    });

    return NextResponse.json({
      success: true,
      query,
      jobsFound: jobs.length,
      jobs
    });
  } catch (error) {
    console.error('Debug query error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      },
      { status: 500 }
    );
  }
}