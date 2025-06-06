import { Prisma } from '@prisma/client';
import { ErrorLogger, ErrorSeverity, ErrorCategory } from './error-monitor';

// Database performance thresholds
export const DB_PERFORMANCE_THRESHOLDS = {
  SLOW_QUERY_WARNING: 1000, // 1 second
  SLOW_QUERY_ERROR: 5000, // 5 seconds
  VERY_SLOW_QUERY_CRITICAL: 10000, // 10 seconds
  MAX_QUERY_SIZE: 10000, // Maximum query size to log
  CONNECTION_TIMEOUT: 30000, // 30 seconds
} as const;

// Database operation types
export enum DatabaseOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  AGGREGATE = 'aggregate',
  BATCH = 'batch',
}

// Query performance metrics
export interface QueryMetrics {
  operation: string;
  model: string;
  duration: number;
  timestamp: Date;
  querySize: number;
  resultCount?: number;
  requestId?: string;
  userId?: string;
  isSlowQuery: boolean;
  isCriticalQuery: boolean;
}

// Database health metrics
export interface DatabaseHealthMetrics {
  connectionCount: number;
  activeQueries: number;
  averageQueryTime: number;
  slowQueryCount: number;
  errorCount: number;
  lastHealthCheck: Date;
  memoryUsage?: NodeJS.MemoryUsage;
}

// Database monitoring service
export class DatabaseMonitoringService {
  private static instance: DatabaseMonitoringService;
  private queryMetrics: QueryMetrics[] = [];
  private healthMetrics: DatabaseHealthMetrics = {
    connectionCount: 0,
    activeQueries: 0,
    averageQueryTime: 0,
    slowQueryCount: 0,
    errorCount: 0,
    lastHealthCheck: new Date(),
  };
  private activeQueries = new Set<string>();
  private readonly maxMetricsHistory = 1000; // Keep last 1000 queries

  private constructor() {}

  public static getInstance(): DatabaseMonitoringService {
    if (!DatabaseMonitoringService.instance) {
      DatabaseMonitoringService.instance = new DatabaseMonitoringService();
    }
    return DatabaseMonitoringService.instance;
  }

  // Track query performance
  public trackQuery(metrics: QueryMetrics): void {
    // Add to metrics history
    this.queryMetrics.push(metrics);

    // Maintain metrics history size
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsHistory);
    }

    // Update health metrics
    this.updateHealthMetrics(metrics);

    // Log performance issues
    this.logPerformanceIssues(metrics);
  }

  // Start tracking a query
  public startQuery(queryId: string): void {
    this.activeQueries.add(queryId);
    this.healthMetrics.activeQueries = this.activeQueries.size;
  }

  // End tracking a query
  public endQuery(queryId: string): void {
    this.activeQueries.delete(queryId);
    this.healthMetrics.activeQueries = this.activeQueries.size;
  }

  // Get current health metrics
  public getHealthMetrics(): DatabaseHealthMetrics {
    return { ...this.healthMetrics };
  }

  // Get query performance statistics
  public getQueryStatistics(timeWindow: number = 3600000): {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    criticalQueries: number;
    queriesByModel: Record<string, number>;
    queriesByOperation: Record<string, number>;
  } {
    const cutoff = new Date(Date.now() - timeWindow);
    const recentQueries = this.queryMetrics.filter(q => q.timestamp >= cutoff);

    const stats = {
      totalQueries: recentQueries.length,
      averageQueryTime: 0,
      slowQueries: 0,
      criticalQueries: 0,
      queriesByModel: {} as Record<string, number>,
      queriesByOperation: {} as Record<string, number>,
    };

    if (recentQueries.length === 0) return stats;

    // Calculate statistics
    let totalTime = 0;
    recentQueries.forEach(query => {
      totalTime += query.duration;

      if (query.isSlowQuery) stats.slowQueries++;
      if (query.isCriticalQuery) stats.criticalQueries++;

      stats.queriesByModel[query.model] =
        (stats.queriesByModel[query.model] || 0) + 1;
      stats.queriesByOperation[query.operation] =
        (stats.queriesByOperation[query.operation] || 0) + 1;
    });

    stats.averageQueryTime = totalTime / recentQueries.length;
    return stats;
  }

  // Check database health
  public async checkDatabaseHealth(): Promise<{
    isHealthy: boolean;
    issues: string[];
    metrics: DatabaseHealthMetrics;
  }> {
    const issues: string[] = [];
    const stats = this.getQueryStatistics();

    // Check for performance issues
    if (stats.averageQueryTime > DB_PERFORMANCE_THRESHOLDS.SLOW_QUERY_WARNING) {
      issues.push(
        `High average query time: ${stats.averageQueryTime.toFixed(2)}ms`
      );
    }

    if (stats.slowQueries > stats.totalQueries * 0.1) {
      issues.push(
        `High slow query rate: ${((stats.slowQueries / stats.totalQueries) * 100).toFixed(1)}%`
      );
    }

    if (stats.criticalQueries > 0) {
      issues.push(`Critical slow queries detected: ${stats.criticalQueries}`);
    }

    if (this.healthMetrics.activeQueries > 50) {
      issues.push(
        `High number of active queries: ${this.healthMetrics.activeQueries}`
      );
    }

    // Update health check timestamp
    this.healthMetrics.lastHealthCheck = new Date();

    return {
      isHealthy: issues.length === 0,
      issues,
      metrics: this.getHealthMetrics(),
    };
  }

  // Private methods

  private updateHealthMetrics(metrics: QueryMetrics): void {
    // Update average query time (rolling average)
    const recentQueries = this.queryMetrics.slice(-100); // Last 100 queries
    const totalTime = recentQueries.reduce((sum, q) => sum + q.duration, 0);
    this.healthMetrics.averageQueryTime = totalTime / recentQueries.length;

    // Update slow query count
    if (metrics.isSlowQuery) {
      this.healthMetrics.slowQueryCount++;
    }
  }

  private logPerformanceIssues(metrics: QueryMetrics): void {
    const context = {
      requestId: metrics.requestId,
      userId: metrics.userId,
      operation: metrics.operation,
      model: metrics.model,
      duration: metrics.duration,
      querySize: metrics.querySize,
      resultCount: metrics.resultCount,
      timestamp: metrics.timestamp.toISOString(),
    };

    // Log slow queries
    if (metrics.duration > DB_PERFORMANCE_THRESHOLDS.SLOW_QUERY_WARNING) {
      const severity =
        metrics.duration > DB_PERFORMANCE_THRESHOLDS.VERY_SLOW_QUERY_CRITICAL
          ? ErrorSeverity.CRITICAL
          : metrics.duration > DB_PERFORMANCE_THRESHOLDS.SLOW_QUERY_ERROR
            ? ErrorSeverity.HIGH
            : ErrorSeverity.MEDIUM;

      ErrorLogger.database(
        new Error(
          `Slow database query: ${metrics.operation} on ${metrics.model} took ${metrics.duration}ms`
        ),
        {
          requestId: metrics.requestId,
          userId: metrics.userId,
          additionalData: {
            category: ErrorCategory.PERFORMANCE,
            operation: metrics.operation,
            model: metrics.model,
            duration: metrics.duration,
            querySize: metrics.querySize,
            resultCount: metrics.resultCount,
            timestamp: metrics.timestamp.toISOString(),
            threshold: DB_PERFORMANCE_THRESHOLDS.SLOW_QUERY_WARNING,
            performanceImpact: this.calculatePerformanceImpact(
              metrics.duration
            ),
          },
        }
      );
    }

    // Log large queries
    if (metrics.querySize > DB_PERFORMANCE_THRESHOLDS.MAX_QUERY_SIZE) {
      ErrorLogger.database(
        new Error(
          `Large database query detected: ${metrics.querySize} characters`
        ),
        {
          requestId: metrics.requestId,
          userId: metrics.userId,
          additionalData: {
            category: ErrorCategory.PERFORMANCE,
            operation: metrics.operation,
            model: metrics.model,
            duration: metrics.duration,
            querySize: metrics.querySize,
            resultCount: metrics.resultCount,
            timestamp: metrics.timestamp.toISOString(),
            maxSize: DB_PERFORMANCE_THRESHOLDS.MAX_QUERY_SIZE,
          },
        }
      );
    }
  }

  private calculatePerformanceImpact(
    duration: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (duration > DB_PERFORMANCE_THRESHOLDS.VERY_SLOW_QUERY_CRITICAL)
      return 'critical';
    if (duration > DB_PERFORMANCE_THRESHOLDS.SLOW_QUERY_ERROR) return 'high';
    if (duration > DB_PERFORMANCE_THRESHOLDS.SLOW_QUERY_WARNING)
      return 'medium';
    return 'low';
  }
}

// Enhanced Prisma middleware for comprehensive monitoring
export function createDatabaseMonitoringMiddleware(): Prisma.Middleware {
  const monitor = DatabaseMonitoringService.getInstance();

  return async (params, next) => {
    const queryId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Start tracking
    monitor.startQuery(queryId);

    try {
      // Execute the query
      const result = await next(params);
      const duration = Date.now() - startTime;

      // Calculate query size (approximate)
      const querySize = JSON.stringify(params.args || {}).length;

      // Determine result count
      let resultCount: number | undefined;
      if (Array.isArray(result)) {
        resultCount = result.length;
      } else if (result && typeof result === 'object' && 'count' in result) {
        resultCount = result.count as number;
      }

      // Track the query
      const metrics: QueryMetrics = {
        operation: params.action,
        model: params.model || 'unknown',
        duration,
        timestamp: new Date(),
        querySize,
        resultCount,
        isSlowQuery: duration > DB_PERFORMANCE_THRESHOLDS.SLOW_QUERY_WARNING,
        isCriticalQuery:
          duration > DB_PERFORMANCE_THRESHOLDS.VERY_SLOW_QUERY_CRITICAL,
      };

      monitor.trackQuery(metrics);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log database error
      ErrorLogger.database(error as Error, {
        requestId: queryId,
        additionalData: {
          operation: params.action,
          model: params.model,
          duration,
          querySize: JSON.stringify(params.args || {}).length,
          params: params.args,
          queryId,
        },
      });

      throw error;
    } finally {
      // End tracking
      monitor.endQuery(queryId);
    }
  };
}

// Connection monitoring
export class DatabaseConnectionMonitor {
  private static instance: DatabaseConnectionMonitor;
  private connectionAttempts = 0;
  private connectionFailures = 0;
  private lastConnectionCheck = new Date();

  private constructor() {}

  public static getInstance(): DatabaseConnectionMonitor {
    if (!DatabaseConnectionMonitor.instance) {
      DatabaseConnectionMonitor.instance = new DatabaseConnectionMonitor();
    }
    return DatabaseConnectionMonitor.instance;
  }

  public recordConnectionAttempt(): void {
    this.connectionAttempts++;
  }

  public recordConnectionFailure(error: Error): void {
    this.connectionFailures++;

    ErrorLogger.database(error, {
      additionalData: {
        category: ErrorCategory.DATABASE,
        connectionAttempts: this.connectionAttempts,
        connectionFailures: this.connectionFailures,
        failureRate: this.connectionFailures / this.connectionAttempts,
      },
    });
  }

  public getConnectionStats(): {
    attempts: number;
    failures: number;
    successRate: number;
    lastCheck: Date;
  } {
    return {
      attempts: this.connectionAttempts,
      failures: this.connectionFailures,
      successRate:
        this.connectionAttempts > 0
          ? ((this.connectionAttempts - this.connectionFailures) /
              this.connectionAttempts) *
            100
          : 100,
      lastCheck: this.lastConnectionCheck,
    };
  }
}

// Export instances
export const databaseMonitor = DatabaseMonitoringService.getInstance();
export const connectionMonitor = DatabaseConnectionMonitor.getInstance();

// Utility functions for integration
export function trackDatabaseQuery(
  operation: string,
  model: string,
  duration: number,
  options?: {
    requestId?: string;
    userId?: string;
    resultCount?: number;
    querySize?: number;
  }
): void {
  const metrics: QueryMetrics = {
    operation,
    model,
    duration,
    timestamp: new Date(),
    querySize: options?.querySize || 0,
    resultCount: options?.resultCount,
    requestId: options?.requestId,
    userId: options?.userId,
    isSlowQuery: duration > DB_PERFORMANCE_THRESHOLDS.SLOW_QUERY_WARNING,
    isCriticalQuery:
      duration > DB_PERFORMANCE_THRESHOLDS.VERY_SLOW_QUERY_CRITICAL,
  };

  databaseMonitor.trackQuery(metrics);
}

// Health check endpoint helper
export async function getDatabaseHealthReport(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    performance: { status: string; details: any };
    connections: { status: string; details: any };
    queries: { status: string; details: any };
  };
  timestamp: string;
}> {
  const healthCheck = await databaseMonitor.checkDatabaseHealth();
  const connectionStats = connectionMonitor.getConnectionStats();
  const queryStats = databaseMonitor.getQueryStatistics();

  const performanceStatus = healthCheck.isHealthy ? 'healthy' : 'degraded';
  const connectionStatus =
    connectionStats.successRate > 95
      ? 'healthy'
      : connectionStats.successRate > 80
        ? 'degraded'
        : 'unhealthy';
  const queryStatus = queryStats.criticalQueries === 0 ? 'healthy' : 'degraded';

  const overallStatus = [
    performanceStatus,
    connectionStatus,
    queryStatus,
  ].includes('unhealthy')
    ? 'unhealthy'
    : [performanceStatus, connectionStatus, queryStatus].includes('degraded')
      ? 'degraded'
      : 'healthy';

  return {
    status: overallStatus,
    checks: {
      performance: {
        status: performanceStatus,
        details: {
          issues: healthCheck.issues,
          metrics: healthCheck.metrics,
        },
      },
      connections: {
        status: connectionStatus,
        details: connectionStats,
      },
      queries: {
        status: queryStatus,
        details: queryStats,
      },
    },
    timestamp: new Date().toISOString(),
  };
}
