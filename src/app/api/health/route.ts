import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Create clients for health checks
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    redis: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    external_apis: {
      status: 'healthy' | 'unhealthy' | 'degraded';
      services: Array<{
        name: string;
        status: 'healthy' | 'unhealthy';
        responseTime: number;
        error?: string;
      }>;
    };
    memory: {
      status: 'healthy' | 'unhealthy';
      usage: number;
      limit: number;
    };
  };
}

async function checkDatabase(): Promise<{
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    // Simple database query to check connectivity
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    return { status: 'healthy', responseTime };
  } catch (error) {
    const responseTime = Date.now() - start;
    return {
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

async function checkRedis(): Promise<{
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await redis.ping();
    const responseTime = Date.now() - start;
    return { status: 'healthy', responseTime };
  } catch (error) {
    const responseTime = Date.now() - start;
    return {
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown Redis error',
    };
  }
}

async function checkExternalAPI(
  name: string,
  url: string
): Promise<{
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - start;

    if (response.ok) {
      return { name, status: 'healthy', responseTime };
    } else {
      return {
        name,
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - start;
    return {
      name,
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown API error',
    };
  }
}

function checkMemory(): {
  status: 'healthy' | 'unhealthy';
  usage: number;
  limit: number;
} {
  const usage = process.memoryUsage();
  const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const limitMB = Math.round((usage.heapTotal / 1024 / 1024) * 2); // Assume 2x heap total as limit

  // Consider memory unhealthy if using more than 80% of limit
  const status = usedMB > limitMB * 0.8 ? 'unhealthy' : 'healthy';

  return { status, usage: usedMB, limit: limitMB };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const start = Date.now();

  try {
    // Run all health checks in parallel
    const [databaseCheck, redisCheck, memoryCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      Promise.resolve(checkMemory()),
    ]);

    // Check external APIs if configured
    const externalServices = [];

    // Only check external APIs in production to avoid unnecessary load
    if (process.env.NODE_ENV === 'production') {
      // Add external API checks here if needed
      // Example: Google OAuth endpoint, email service, etc.
      if (process.env.GOOGLE_CLIENT_ID) {
        externalServices.push(
          checkExternalAPI(
            'Google OAuth',
            'https://accounts.google.com/.well-known/openid_configuration'
          )
        );
      }
    }

    const externalChecks = await Promise.all(externalServices);

    // Determine overall external API status
    let externalApiStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (externalChecks.some(check => check.status === 'unhealthy')) {
      externalApiStatus = externalChecks.every(
        check => check.status === 'unhealthy'
      )
        ? 'unhealthy'
        : 'degraded';
    }

    // Determine overall system status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (
      databaseCheck.status === 'unhealthy' ||
      redisCheck.status === 'unhealthy' ||
      memoryCheck.status === 'unhealthy'
    ) {
      overallStatus = 'unhealthy';
    } else if (externalApiStatus === 'degraded') {
      overallStatus = 'degraded';
    }

    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: databaseCheck,
        redis: redisCheck,
        external_apis: {
          status: externalApiStatus,
          services: externalChecks,
        },
        memory: memoryCheck,
      },
    };

    // Return appropriate HTTP status based on health
    const httpStatus =
      overallStatus === 'healthy'
        ? 200
        : overallStatus === 'degraded'
          ? 200
          : 503;

    return NextResponse.json(healthCheck, { status: httpStatus });
  } catch (error) {
    // If health check itself fails, return minimal error response
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(errorResponse, { status: 503 });
  } finally {
    // Clean up database connection
    await prisma.$disconnect().catch(() => {
      // Ignore cleanup errors
    });

    // Clean up Redis connection
    redis.disconnect();
  }
}

// Also support HEAD requests for simple uptime checks
export async function HEAD(): Promise<NextResponse> {
  try {
    // Quick health check - just verify the service is responding
    const quickCheck = await Promise.race([
      checkDatabase(),
      new Promise<{ status: 'unhealthy'; responseTime: number; error: string }>(
        (_, reject) =>
          setTimeout(
            () =>
              reject({
                status: 'unhealthy',
                responseTime: 1000,
                error: 'Timeout',
              }),
            1000
          )
      ),
    ]);

    const status = quickCheck.status === 'healthy' ? 200 : 503;
    return new NextResponse(null, { status });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
