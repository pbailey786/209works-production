import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  // Test 1: Basic database connection
  try {
    const count = await prisma.job.count();
    results.tests.basicConnection = {
      success: true,
      jobCount: count,
    };
  } catch (error) {
    results.tests.basicConnection = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    };
  }

  // Test 2: Simple query
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'active' },
      take: 1,
    });
    results.tests.simpleQuery = {
      success: true,
      found: jobs.length,
    };
  } catch (error) {
    results.tests.simpleQuery = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Test 3: Complex query with case-insensitive search
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'active',
        AND: [
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          {
            location: {
              contains: 'Stockton',
              mode: 'insensitive',
            },
          },
        ],
      },
      take: 1,
    });
    results.tests.complexQuery = {
      success: true,
      found: jobs.length,
    };
  } catch (error) {
    results.tests.complexQuery = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'This might be the issue causing 500 errors',
    };
  }

  // Test 4: Check if any jobs exist
  try {
    const anyJobs = await prisma.job.findFirst();
    results.tests.anyJobs = {
      success: true,
      exists: !!anyJobs,
      activeStatus: anyJobs?.status,
    };
  } catch (error) {
    results.tests.anyJobs = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Overall analysis
  const failedTests = Object.values(results.tests).filter(
    (test: any) => !test.success
  );
  results.analysis = {
    totalTests: Object.keys(results.tests).length,
    failedTests: failedTests.length,
    likelyIssue: failedTests.length > 0 ? failedTests[0] : null,
  };

  return NextResponse.json(results, { status: 200 });
}