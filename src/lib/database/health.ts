import { prisma } from './prisma';


interface DatabaseHealthCheck {
  isHealthy: boolean;
  responseTime: number;
  error?: string;
  details: {
    connection: boolean;
    queryPerformance: number;
    indexUsage?: any;
    slowQueries?: any[];
  };
}

interface QueryPerformanceMetrics {
  averageResponseTime: number;
  slowQueryCount: number;
  connectionCount: number;
  cacheHitRatio?: number;
}

/**
 * Comprehensive database health check
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthCheck> {
  const startTime = Date.now();
  
  try {
    // Basic connection test
    await prisma.$queryRaw`SELECT 1`;
    const connectionTime = Date.now() - startTime;
    
    // Test a simple query performance
    const queryStart = Date.now();
    await prisma.user.count();
    const queryTime = Date.now() - queryStart;
    
    // Check if we can perform a more complex query (dashboard-like)
    const complexQueryStart = Date.now();
    await prisma.job.count({
      where: {
        deletedAt: null,
        status: 'active'
      }
    });
    const complexQueryTime = Date.now() - complexQueryStart;
    
    const totalResponseTime = Date.now() - startTime;
    
    // Determine health status
    const isHealthy = connectionTime < 1000 && queryTime < 500 && complexQueryTime < 1000;
    
    return {
      isHealthy,
      responseTime: totalResponseTime,
      details: {
        connection: true,
        queryPerformance: Math.max(queryTime, complexQueryTime),
      }
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      isHealthy: false,
      responseTime,
      error: (error as Error).message,
      details: {
        connection: false,
        queryPerformance: responseTime,
      }
    };
  }
}

/**
 * Get database performance metrics
 */
export async function getDatabaseMetrics(): Promise<QueryPerformanceMetrics> {
  try {
    // Get basic connection info
    const connectionInfo = await prisma.$queryRaw<any[]>`
      SELECT 
        count(*) as connection_count,
        avg(extract(epoch from (now() - query_start))) as avg_query_time
      FROM pg_stat_activity 
      WHERE state = 'active' AND query != '<IDLE>'
    `;
    
    // Get slow query information (queries taking > 1 second)
    const slowQueries = await prisma.$queryRaw<any[]>`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements 
      WHERE mean_time > 1000 
      ORDER BY mean_time DESC 
      LIMIT 10
    `.catch(() => []); // pg_stat_statements might not be enabled
    
    const connectionCount = connectionInfo[0]?.connection_count || 0;
    const avgQueryTime = connectionInfo[0]?.avg_query_time || 0;
    
    return {
      averageResponseTime: avgQueryTime * 1000, // Convert to milliseconds
      slowQueryCount: slowQueries.length,
      connectionCount: parseInt(connectionCount),
    };
    
  } catch (error) {
    console.error('Failed to get database metrics:', error);
    return {
      averageResponseTime: 0,
      slowQueryCount: 0,
      connectionCount: 0,
    };
  }
}

/**
 * Optimize database performance by updating statistics
 */
export async function optimizeDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔧 Starting database optimization...');
    
    // Update table statistics for better query planning
    const tables = [
      'User', 'Job', 'JobApplication', 'Subscription', 
      'JobPostingCredit', 'UserSession', 'EmailLog', 
      'Alert', 'SavedJob', 'SearchHistory', 'Company'
    ];
    
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`ANALYZE "${table}"`);
    }
    
    console.log('✅ Database optimization completed');
    
    return {
      success: true,
      message: `Successfully updated statistics for ${tables.length} tables`
    };
    
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    
    return {
      success: false,
      message: `Optimization failed: ${(error as Error).message}`
    };
  }
}

/**
 * Check for missing indexes that could improve performance
 */
export async function checkIndexUsage(): Promise<any[]> {
  try {
    // Get index usage statistics
    const indexStats = await prisma.$queryRaw<any[]>`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch,
        idx_scan
      FROM pg_stat_user_indexes 
      WHERE idx_scan < 10 
      ORDER BY idx_scan ASC
      LIMIT 20
    `;
    
    return indexStats;
    
  } catch (error) {
    console.error('Failed to check index usage:', error);
    return [];
  }
}

/**
 * Get table sizes to identify potential performance issues
 */
export async function getTableSizes(): Promise<any[]> {
  try {
    const tableSizes = await prisma.$queryRaw<any[]>`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `;
    
    return tableSizes;
    
  } catch (error) {
    console.error('Failed to get table sizes:', error);
    return [];
  }
}

/**
 * Monitor database health continuously
 */
export class DatabaseHealthMonitor {
  private static instance: DatabaseHealthMonitor;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck: DatabaseHealthCheck | null = null;
  
  static getInstance(): DatabaseHealthMonitor {
    if (!DatabaseHealthMonitor.instance) {
      DatabaseHealthMonitor.instance = new DatabaseHealthMonitor();
    }
    return DatabaseHealthMonitor.instance;
  }
  
  startMonitoring(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        this.lastHealthCheck = await checkDatabaseHealth();
        
        if (!this.lastHealthCheck.isHealthy) {
          console.warn('🚨 Database health check failed:', this.lastHealthCheck);
        }
      } catch (error) {
        console.error('❌ Health check monitoring error:', error);
      }
    }, intervalMs);
    
    console.log(`🔍 Database health monitoring started (interval: ${intervalMs}ms)`);
  }
  
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🛑 Database health monitoring stopped');
    }
  }
  
  getLastHealthCheck(): DatabaseHealthCheck | null {
    return this.lastHealthCheck;
  }
}
