import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    queries: {},
  };

  // Test 1: Basic query without case-insensitive mode
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'active',
      },
      take: 5,
      select: {
        id: true,
        title: true,
        location: true,
        status: true,
      },
    });
    results.queries.basic = {
      success: true,
      count: jobs.length,
      sample: jobs[0] || null,
    };
  } catch (error) {
    results.queries.basic = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test 2: Query with contains (no mode)
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'active',
        location: {
          contains: 'Stockton',
        },
      },
      take: 5,
    });
    results.queries.containsNoMode = {
      success: true,
      count: jobs.length,
    };
  } catch (error) {
    results.queries.containsNoMode = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test 3: Query with case-insensitive mode
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'active',
        location: {
          contains: 'stockton',
          mode: 'insensitive',
        },
      },
      take: 5,
    });
    results.queries.caseInsensitive = {
      success: true,
      count: jobs.length,
      note: 'If this fails, case-insensitive mode might not be supported',
    };
  } catch (error) {
    results.queries.caseInsensitive = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      possibleFix: 'Remove mode: "insensitive" from queries',
    };
  }

  // Test 4: Complex query similar to chat-job-search
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'active',
        AND: [
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        ],
      },
      orderBy: [
        { isRemote: 'asc' },
        { postedAt: 'desc' },
      ],
      take: 5,
    });
    results.queries.complex = {
      success: true,
      count: jobs.length,
    };
  } catch (error) {
    results.queries.complex = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Analysis
  const failedQueries = Object.entries(results.queries).filter(
    ([_, result]: [string, any]) => !result.success
  );
  
  results.analysis = {
    totalQueries: Object.keys(results.queries).length,
    failedQueries: failedQueries.length,
    likelyIssue: failedQueries.length > 0 ? failedQueries[0][1].error : 'None detected',
    recommendations: [],
  };

  if (results.queries.caseInsensitive && !results.queries.caseInsensitive.success) {
    results.analysis.recommendations.push(
      'Remove mode: "insensitive" from all Prisma queries',
      'Use JavaScript toLowerCase() for case-insensitive matching instead'
    );
  }

  return NextResponse.json(results, { status: 200 });
}