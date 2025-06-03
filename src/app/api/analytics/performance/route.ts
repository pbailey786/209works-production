import { NextRequest, NextResponse } from 'next/server';
import { QueryPerformanceMonitor } from '@/lib/performance/db-optimization';
import { memoryCache } from '@/lib/performance/cache-utils';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all';

    const performanceData: any = {
      timestamp: new Date().toISOString(),
    };

    // Database query performance
    if (type === 'all' || type === 'database') {
      performanceData.database = {
        queryStats: QueryPerformanceMonitor.getAllStats(),
        summary: {
          totalQueries: Object.keys(QueryPerformanceMonitor.getAllStats())
            .length,
          slowQueries: Object.values(
            QueryPerformanceMonitor.getAllStats()
          ).filter((stat: any) => stat && stat.average > 1000).length,
        },
      };
    }

    // Memory cache performance
    if (type === 'all' || type === 'cache') {
      performanceData.cache = {
        memory: memoryCache.getStats(),
        // Add Redis stats if available
        redis: await getRedisStats().catch(() => ({
          error: 'Redis not available',
        })),
      };
    }

    // System performance
    if (type === 'all' || type === 'system') {
      performanceData.system = {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        cpuUsage: process.cpuUsage(),
      };
    }

    // Web vitals summary (from stored metrics)
    if (type === 'all' || type === 'vitals') {
      performanceData.webVitals = await getWebVitalsSummary();
    }

    return NextResponse.json(performanceData);
  } catch (error) {
    console.error('Error retrieving performance data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve performance data' },
      { status: 500 }
    );
  }
}

async function getRedisStats() {
  // This would connect to your Redis instance
  // For now, return mock data
  return {
    connected: false,
    memory: 0,
    keys: 0,
    hits: 0,
    misses: 0,
  };
}

async function getWebVitalsSummary() {
  // In a real implementation, you'd query your database for stored web vitals
  // For now, return mock summary data
  return {
    lcp: { average: 2100, p95: 3200, samples: 150 },
    fid: { average: 85, p95: 120, samples: 150 },
    cls: { average: 0.08, p95: 0.15, samples: 150 },
    fcp: { average: 1600, p95: 2400, samples: 150 },
    ttfb: { average: 650, p95: 1200, samples: 150 },
  };
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
