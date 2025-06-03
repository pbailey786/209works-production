/**
 * Cron Job: Refresh Job Statistics Materialized View
 * Task 45.13: Database Performance Optimization
 *
 * This endpoint refreshes the materialized view that contains
 * aggregated job statistics by company to prevent N+1 queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { OptimizedJobSearchService } from '@/lib/database/optimized-queries';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const headersList = await headers();
    const cronSecret = headersList.get('x-cron-secret');

    if (cronSecret !== process.env.CRON_SECRET) {
      console.error('Unauthorized cron job access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting job statistics refresh...');
    const startTime = Date.now();

    // Refresh the materialized view
    await OptimizedJobSearchService.refreshCompanyStats();

    const duration = Date.now() - startTime;

    console.log(`Job statistics refresh completed in ${duration}ms`);

    // Get performance metrics after refresh
    const metrics = await OptimizedJobSearchService.getPerformanceMetrics();

    return NextResponse.json({
      success: true,
      message: 'Job statistics refreshed successfully',
      duration,
      timestamp: new Date().toISOString(),
      metrics: {
        slowQueriesCount: metrics.slowQueries.length,
        unusedIndexesCount: metrics.indexUsage.length,
      },
    });
  } catch (error) {
    console.error('Error refreshing job statistics:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh job statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
