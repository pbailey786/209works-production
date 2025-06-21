import { NextRequest, NextResponse } from 'next/server';
import {
  checkDatabaseHealth,
  getDatabaseMetrics,
  optimizeDatabase,
  checkIndexUsage,
  getTableSizes,
} from '@/lib/database/health';

/**
 * GET /api/debug/database-health
 * Returns comprehensive database health information
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Database health check requested');
    
    // Only allow in development or for admin users
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      // In production, you might want to add authentication check here
      // For now, we'll allow it but with limited information
    }
    
    // Run health checks in parallel
    const [
      healthCheck,
      metrics,
      indexUsage,
      tableSizes
    ] = await Promise.allSettled([
      checkDatabaseHealth(),
      getDatabaseMetrics(),
      checkIndexUsage(),
      getTableSizes()
    ]);
    
    // Extract results, handling any failures gracefully
    const healthResult = healthCheck.status === 'fulfilled' ? healthCheck.value : null;
    const metricsResult = metrics.status === 'fulfilled' ? metrics.value : null;
    const indexResult = indexUsage.status === 'fulfilled' ? indexUsage.value : [];
    const sizesResult = tableSizes.status === 'fulfilled' ? tableSizes.value : [];
    
    // Determine overall health status
    const isHealthy = healthResult?.isHealthy ?? false;
    const responseTime = Date.now() - startTime;
    
    // Create recommendations based on health check results
    const recommendations = [];
    
    if (healthResult && !healthResult.isHealthy) {
      recommendations.push('Database connection issues detected - check connection pool settings');
    }
    
    if (healthResult && healthResult.details.queryPerformance > 1000) {
      recommendations.push('Slow query performance detected - consider optimizing queries or adding indexes');
    }
    
    if (metricsResult && metricsResult.slowQueryCount > 5) {
      recommendations.push('Multiple slow queries detected - review query performance');
    }
    
    if (metricsResult && metricsResult.connectionCount > 20) {
      recommendations.push('High connection count - consider connection pooling optimization');
    }
    
    if (indexResult.length > 10) {
      recommendations.push('Unused indexes detected - consider removing unused indexes');
    }
    
    const response = {
      timestamp: new Date().toISOString(),
      queryTime: responseTime,
      overall: {
        isHealthy,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: healthResult?.responseTime || responseTime
      },
      connection: {
        status: healthResult?.details.connection ? 'connected' : 'disconnected',
        error: healthResult?.error
      },
      performance: {
        queryPerformance: healthResult?.details.queryPerformance || 0,
        averageResponseTime: metricsResult?.averageResponseTime || 0,
        slowQueryCount: metricsResult?.slowQueryCount || 0,
        connectionCount: metricsResult?.connectionCount || 0
      },
      indexes: {
        unusedCount: indexResult.length,
        details: isDevelopment ? indexResult.slice(0, 5) : [] // Limit in production
      },
      tables: {
        largestTables: isDevelopment ? sizesResult.slice(0, 5) : [] // Limit in production
      },
      recommendations,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: !!process.env.DATABASE_URL,
        connectionPooling: !!process.env.DATABASE_URL?.includes('pgbouncer')
      }
    };
    
    console.log(`✅ Database health check completed in ${responseTime}ms`);
    
    return NextResponse.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      error: 'Database health check failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
      queryTime: responseTime
    }, { status: 500 });
  }
}

/**
 * POST /api/debug/database-health
 * Performs database optimization actions
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { action } = body;
    
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({
        error: 'Forbidden',
        message: 'Database optimization only available in development'
      }, { status: 403 });
    }
    
    let result;
    
    switch (action) {
      case 'optimize':
        console.log('🔧 Running database optimization...');
        result = await optimizeDatabase();
        break;
        
      case 'health-check':
        console.log('🔍 Running health check...');
        result = await checkDatabaseHealth();
        break;
        
      case 'metrics':
        console.log('📊 Getting database metrics...');
        result = await getDatabaseMetrics();
        break;
        
      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['optimize', 'health-check', 'metrics']
        }, { status: 400 });
    }
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      action,
      result,
      queryTime: responseTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database optimization action failed:', error);
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      error: 'Database action failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
      queryTime: responseTime
    }, { status: 500 });
  }
}
