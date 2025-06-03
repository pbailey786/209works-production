/**
 * Admin API: Database Performance Monitoring
 * Task 45.13: Database Performance Optimization
 *
 * This endpoint provides database performance metrics for monitoring
 * slow queries, index usage, and overall database health
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { OptimizedJobSearchService } from '@/lib/database/optimized-queries';
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('Fetching database performance metrics...');
    const startTime = Date.now();

    // Get performance metrics
    const metrics = await OptimizedJobSearchService.getPerformanceMetrics();

    // Get additional database statistics
    const [tableStats, connectionStats, cacheStats] = await Promise.all([
      // Table size and row count statistics
      prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_stat_get_tuples_returned(c.oid) as rows_read,
          pg_stat_get_tuples_fetched(c.oid) as rows_fetched,
          pg_stat_get_tuples_inserted(c.oid) as rows_inserted,
          pg_stat_get_tuples_updated(c.oid) as rows_updated,
          pg_stat_get_tuples_deleted(c.oid) as rows_deleted
        FROM pg_tables pt
        JOIN pg_class c ON c.relname = pt.tablename
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `,

      // Database connection statistics
      prisma.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity
        WHERE datname = current_database()
      `,

      // Cache hit ratio
      prisma.$queryRaw`
        SELECT 
          sum(heap_blks_read) as heap_read,
          sum(heap_blks_hit) as heap_hit,
          sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
        FROM pg_statio_user_tables
      `,
    ]);

    const queryTime = Date.now() - startTime;

    // Format the response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      queryTime,
      metrics: {
        slowQueries: {
          count: metrics.slowQueries.length,
          queries: metrics.slowQueries.slice(0, 5), // Top 5 slowest
        },
        indexUsage: {
          unusedCount: metrics.indexUsage.filter(
            idx => idx.usage_status === 'UNUSED'
          ).length,
          lowUsageCount: metrics.indexUsage.filter(
            idx => idx.usage_status === 'LOW_USAGE'
          ).length,
          indexes: metrics.indexUsage.slice(0, 10),
        },
        tableStats: tableStats as any[],
        connectionStats: (connectionStats as any[])[0],
        cacheStats: (cacheStats as any[])[0],
      },
      recommendations: generateRecommendations(
        metrics,
        tableStats as any[],
        (cacheStats as any[])[0]
      ),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching database performance metrics:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch database performance metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Generate performance recommendations based on metrics
 */
function generateRecommendations(
  metrics: { slowQueries: any[]; indexUsage: any[] },
  tableStats: any[],
  cacheStats: any
): string[] {
  const recommendations: string[] = [];

  // Slow query recommendations
  if (metrics.slowQueries.length > 5) {
    recommendations.push(
      `Found ${metrics.slowQueries.length} slow queries. Consider optimizing queries with mean_time > 100ms.`
    );
  }

  // Index usage recommendations
  const unusedIndexes = metrics.indexUsage.filter(
    idx => idx.usage_status === 'UNUSED'
  );
  if (unusedIndexes.length > 0) {
    recommendations.push(
      `Found ${unusedIndexes.length} unused indexes. Consider dropping: ${unusedIndexes
        .slice(0, 3)
        .map(idx => idx.indexname)
        .join(', ')}`
    );
  }

  // Cache hit ratio recommendations
  if (cacheStats?.cache_hit_ratio && cacheStats.cache_hit_ratio < 95) {
    recommendations.push(
      `Cache hit ratio is ${cacheStats.cache_hit_ratio.toFixed(2)}%. Consider increasing shared_buffers or optimizing queries.`
    );
  }

  // Large table recommendations
  const largeTables = tableStats.filter(
    table =>
      table.size &&
      (table.size.includes('GB') ||
        (table.size.includes('MB') && parseInt(table.size) > 100))
  );
  if (largeTables.length > 0) {
    recommendations.push(
      `Large tables detected: ${largeTables
        .slice(0, 2)
        .map(t => t.tablename)
        .join(', ')}. Consider partitioning or archiving old data.`
    );
  }

  // Default recommendation if no issues found
  if (recommendations.length === 0) {
    recommendations.push(
      'Database performance looks good! Continue monitoring regularly.'
    );
  }

  return recommendations;
}

// Support POST for manual refresh and analysis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Refresh statistics and then return metrics
    await prisma.$executeRaw`ANALYZE`;

    // Wait a moment for statistics to update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return updated metrics
    return GET(request);
  } catch (error) {
    console.error('Error refreshing database statistics:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh database statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
