import { NextRequest } from 'next/server';
import { withAPIMiddleware } from '@/components/ui/card';
import { apiConfigs } from '@/components/ui/card';
import { createSuccessResponse } from '@/components/ui/card';
import { getDatabaseHealthReport } from '@/components/ui/card';
import { errorMonitor } from '@/lib/monitoring/error-monitor';


interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: {
      status: string;
      responseTime?: number;
      details: any;
    };
    memory: {
      status: string;
      usage: NodeJS.MemoryUsage;
      details: {
        usagePercentage: number;
        available: number;
      };
    };
    errors: {
      status: string;
      details: {
        recentErrorCount: number;
        errorRate: number;
        criticalErrors: number;
      };
    };
    performance: {
      status: string;
      details: {
        averageResponseTime: number;
        slowRequestCount: number;
        requestsPerMinute: number;
      };
    };
  };
  metrics: {
    requests: {
      total: number;
      successful: number;
      failed: number;
      averageResponseTime: number;
    };
    database: {
      totalQueries: number;
      slowQueries: number;
      averageQueryTime: number;
      connectionHealth: number;
    };
    memory: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    errors: {
      total: number;
      byCategory: Record<string, number>;
      bySeverity: Record<string, number>;
    };
  };
}

// In-memory metrics store (in production, use Redis)
class HealthMetricsStore {
  private static instance: HealthMetricsStore;
  private requestMetrics: Array<{
    timestamp: number;
    duration: number;
    success: boolean;
    endpoint: string;
  }> = [];
  private errorMetrics: Array<{
    timestamp: number;
    category: string;
    severity: string;
    message: string;
  }> = [];
  private readonly maxMetricsHistory = 1000;

  private constructor() {}

  public static getInstance(): HealthMetricsStore {
    if (!HealthMetricsStore.instance) {
      HealthMetricsStore.instance = new HealthMetricsStore();
    }
    return HealthMetricsStore.instance;
  }

  public recordRequest(
    duration: number,
    success: boolean,
    endpoint: string
  ): void {
    this.requestMetrics.push({
      timestamp: Date.now(),
      duration,
      success,
      endpoint,
    });

    // Maintain history size
    if (this.requestMetrics.length > this.maxMetricsHistory) {
      this.requestMetrics = this.requestMetrics.slice(-this.maxMetricsHistory);
    }
  }

  public recordError(
    category: string,
    severity: string,
    message: string
  ): void {
    this.errorMetrics.push({
      timestamp: Date.now(),
      category,
      severity,
      message,
    });

    // Maintain history size
    if (this.errorMetrics.length > this.maxMetricsHistory) {
      this.errorMetrics = this.errorMetrics.slice(-this.maxMetricsHistory);
    }
  }

  public getRequestMetrics(timeWindow: number = 3600000): {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
    requestsPerMinute: number;
    slowRequestCount: number;
  } {
    const cutoff = Date.now() - timeWindow;
    const recentRequests = this.requestMetrics.filter(
      r => r.timestamp >= cutoff
    );

    if (recentRequests.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        requestsPerMinute: 0,
        slowRequestCount: 0,
      };
    }

    const successful = recentRequests.filter(r => r.success).length;
    const failed = recentRequests.length - successful;
    const totalDuration = recentRequests.reduce(
      (sum, r) => sum + r.duration,
      0
    );
    const averageResponseTime = totalDuration / recentRequests.length;
    const slowRequestCount = recentRequests.filter(
      r => r.duration > 1000
    ).length;
    const requestsPerMinute = recentRequests.length / (timeWindow / 60000);

    return {
      total: recentRequests.length,
      successful,
      failed,
      averageResponseTime,
      requestsPerMinute,
      slowRequestCount,
    };
  }

  public getErrorMetrics(timeWindow: number = 3600000): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recentErrorCount: number;
    errorRate: number;
    criticalErrors: number;
  } {
    const cutoff = Date.now() - timeWindow;
    const recentErrors = this.errorMetrics.filter(e => e.timestamp >= cutoff);
    const requestMetrics = this.getRequestMetrics(timeWindow);

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let criticalErrors = 0;

    recentErrors.forEach(error => {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;

      if (error.severity === 'critical') {
        criticalErrors++;
      }
    });

    const errorRate =
      requestMetrics.total > 0
        ? (recentErrors.length / requestMetrics.total) * 100
        : 0;

    return {
      total: recentErrors.length,
      byCategory,
      bySeverity,
      recentErrorCount: recentErrors.length,
      errorRate,
      criticalErrors,
    };
  }
}

const healthMetrics = HealthMetricsStore.getInstance();

// Memory health check
function checkMemoryHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  usage: NodeJS.MemoryUsage;
  details: {
    usagePercentage: number;
    available: number;
  };
} {
  const usage = process.memoryUsage();
  const totalMemory = usage.heapTotal;
  const usedMemory = usage.heapUsed;
  const usagePercentage = (usedMemory / totalMemory) * 100;

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (usagePercentage > 90) {
    status = 'unhealthy';
  } else if (usagePercentage > 75) {
    status = 'degraded';
  }

  return {
    status,
    usage,
    details: {
      usagePercentage,
      available: totalMemory - usedMemory,
    },
  };
}

// Performance health check
function checkPerformanceHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    averageResponseTime: number;
    slowRequestCount: number;
    requestsPerMinute: number;
  };
} {
  const requestMetrics = healthMetrics.getRequestMetrics();

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (
    requestMetrics.averageResponseTime > 2000 ||
    requestMetrics.slowRequestCount > requestMetrics.total * 0.2
  ) {
    status = 'unhealthy';
  } else if (
    requestMetrics.averageResponseTime > 1000 ||
    requestMetrics.slowRequestCount > requestMetrics.total * 0.1
  ) {
    status = 'degraded';
  }

  return {
    status,
    details: {
      averageResponseTime: requestMetrics.averageResponseTime,
      slowRequestCount: requestMetrics.slowRequestCount,
      requestsPerMinute: requestMetrics.requestsPerMinute,
    },
  };
}

// Error health check
function checkErrorHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    recentErrorCount: number;
    errorRate: number;
    criticalErrors: number;
  };
} {
  const errorMetrics = healthMetrics.getErrorMetrics();

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (errorMetrics.criticalErrors > 0 || errorMetrics.errorRate > 10) {
    status = 'unhealthy';
  } else if (errorMetrics.errorRate > 5 || errorMetrics.recentErrorCount > 50) {
    status = 'degraded';
  }

  return {
    status,
    details: {
      recentErrorCount: errorMetrics.recentErrorCount,
      errorRate: errorMetrics.errorRate,
      criticalErrors: errorMetrics.criticalErrors,
    },
  };
}

// Main health check handler
export const GET = withAPIMiddleware(
  async (req: NextRequest, context) => {
    const startTime = Date.now();

    try {
      // Get database health
      const databaseHealth = await getDatabaseHealthReport();
      const databaseResponseTime = Date.now() - startTime;

      // Get system health checks
      const memoryHealth = checkMemoryHealth();
      const performanceHealth = checkPerformanceHealth();
      const errorHealth = checkErrorHealth();

      // Get metrics
      const requestMetrics = healthMetrics.getRequestMetrics();
      const errorMetrics = healthMetrics.getErrorMetrics();
      const memoryUsage = process.memoryUsage();

      // Determine overall status
      const statuses = [
        databaseHealth.status,
        memoryHealth.status,
        performanceHealth.status,
        errorHealth.status,
      ];

      const overallStatus = statuses.includes('unhealthy')
        ? 'unhealthy'
        : statuses.includes('degraded')
          ? 'degraded'
          : 'healthy';

      const healthStatus: SystemHealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || 'unknown',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: {
            status: databaseHealth.status,
            responseTime: databaseResponseTime,
            details: databaseHealth.checks,
          },
          memory: memoryHealth,
          errors: errorHealth,
          performance: performanceHealth,
        },
        metrics: {
          requests: requestMetrics,
          database: {
            totalQueries:
              databaseHealth.checks.queries.details.totalQueries || 0,
            slowQueries: databaseHealth.checks.queries.details.slowQueries || 0,
            averageQueryTime:
              databaseHealth.checks.queries.details.averageQueryTime || 0,
            connectionHealth:
              databaseHealth.checks.connections.details.successRate || 100,
          },
          memory: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            external: memoryUsage.external,
            rss: memoryUsage.rss,
          },
          errors: errorMetrics,
        },
      };

      // Record this request
      const responseTime = Date.now() - startTime;
      healthMetrics.recordRequest(responseTime, true, '/api/health/monitoring');

      return createSuccessResponse(healthStatus);
    } catch (error) {
      // Record failed request
      const responseTime = Date.now() - startTime;
      healthMetrics.recordRequest(
        responseTime,
        false,
        '/api/health/monitoring'
      );

      // Record error
      healthMetrics.recordError(
        'system',
        'high',
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error;
    }
  },
  {
    ...apiConfigs.public,
    rateLimit: { enabled: true, type: 'general' },
    logging: { enabled: true, includeQuery: false },
  }
);

// Export the metrics store for use by other parts of the application
export { healthMetrics };
