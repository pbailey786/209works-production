import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EnhancedPerformanceTracker } from '@/lib/performance/performance-monitor';
import { EnhancedCacheManager } from '@/lib/performance/enhanced-cache-manager';
import { getDomainConfig } from '@/lib/domain/config';


export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || undefined;
    const type = searchParams.get('type') || 'all';

    // Get domain context
    const hostname = request.headers.get('host') || '';
    const domainConfig = getDomainConfig(hostname);
    const currentRegion = region || domainConfig.areaCode;

    const performanceData: any = {
      timestamp: new Date().toISOString(),
      region: currentRegion,
    };

    // Enhanced database and API performance
    if (type === 'all' || type === 'database' || type === 'api') {
      const summary = EnhancedPerformanceTracker.getPerformanceSummary(currentRegion);
      performanceData.enhanced = summary;
    }

    // Cache performance
    if (type === 'all' || type === 'cache') {
      const cacheMetrics = EnhancedCacheManager.getMetrics();
      const cacheHitRatio = EnhancedCacheManager.getCacheHitRatio();

      performanceData.cache = {
        metrics: cacheMetrics,
        hitRatio: cacheHitRatio,
        efficiency: cacheHitRatio > 0.8 ? 'excellent' : cacheHitRatio > 0.6 ? 'good' : 'needs-improvement',
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

    // Performance score and recommendations
    if (type === 'all' || type === 'score') {
      const summary = EnhancedPerformanceTracker.getPerformanceSummary(currentRegion);
      const score = calculatePerformanceScore(summary);
      performanceData.performance = {
        score,
        grade: getPerformanceGrade(score),
        recommendations: generatePerformanceRecommendations(summary, EnhancedCacheManager.getMetrics()),
      };
    }

    return NextResponse.json({
      success: true,
      data: performanceData,
      meta: {
        region: domainConfig.region,
        domain: domainConfig.domain,
        generatedAt: new Date().toISOString(),
      },
    });
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

/**
 * POST /api/analytics/performance
 * Record performance metrics from client or server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...metricData } = body;

    // Get domain context
    const hostname = request.headers.get('host') || '';
    const domainConfig = getDomainConfig(hostname);

    // Add region to metric data
    const enrichedData = {
      ...metricData,
      region: metricData.region || domainConfig.areaCode,
    };

    switch (type) {
      case 'database':
        EnhancedPerformanceTracker.trackDatabaseQuery(enrichedData);
        break;

      case 'api':
        EnhancedPerformanceTracker.trackAPICall(enrichedData);
        break;

      case 'web-vitals':
        console.log('Web Vitals received:', enrichedData);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid metric type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Performance metric recorded',
      type,
    });

  } catch (error) {
    console.error('Performance metric recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record performance metric' },
      { status: 500 }
    );
  }
}

/**
 * Calculate overall performance score (0-100)
 */
function calculatePerformanceScore(summary: any): number {
  const weights = {
    avgDbDuration: 0.3,
    avgApiDuration: 0.3,
    cacheHitRate: 0.2,
    errorRate: 0.2,
  };

  // Normalize metrics to 0-100 scale
  const dbScore = Math.max(0, 100 - (summary.database.averageDuration / 10));
  const apiScore = Math.max(0, 100 - (summary.api.averageDuration / 20));
  const cacheScore = summary.database.cacheHitRate || 0;
  const errorScore = Math.max(0, 100 - (summary.api.errorRate * 2));

  const weightedScore =
    (dbScore * weights.avgDbDuration) +
    (apiScore * weights.avgApiDuration) +
    (cacheScore * weights.cacheHitRate) +
    (errorScore * weights.errorRate);

  return Math.round(weightedScore);
}

/**
 * Get performance grade based on score
 */
function getPerformanceGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Generate performance recommendations
 */
function generatePerformanceRecommendations(summary: any, cacheMetrics: any): string[] {
  const recommendations: string[] = [];

  if (summary.database.averageDuration > 500) {
    recommendations.push('Consider optimizing database queries - average response time is above 500ms');
  }

  if (summary.database.slowQueries > 0) {
    recommendations.push(`${summary.database.slowQueries} slow queries detected - review and optimize`);
  }

  if (summary.database.cacheHitRate < 60) {
    recommendations.push('Cache hit rate is below 60% - consider increasing cache TTL or improving cache strategy');
  }

  if (summary.api.averageDuration > 1000) {
    recommendations.push('API response times are above 1 second - consider optimization');
  }

  if (summary.api.errorRate > 5) {
    recommendations.push(`API error rate is ${summary.api.errorRate}% - investigate and fix errors`);
  }

  if (cacheMetrics.cacheMisses > cacheMetrics.cacheHits) {
    recommendations.push('More cache misses than hits - review caching strategy');
  }

  if (recommendations.length === 0) {
    recommendations.push('Performance looks good! Continue monitoring for optimal results.');
  }

  return recommendations;
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
