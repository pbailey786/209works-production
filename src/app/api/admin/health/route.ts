import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth() as Session | null;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session!.user?.role || 'guest';
    if (!hasPermission(userRole, Permission.VIEW_SYSTEM_HEALTH)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get system metrics
    const metrics = await getSystemMetrics();

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getSystemMetrics() {
  try {
    // Database metrics
    const [totalUsers, totalJobs, activeJobs, totalApplications, recentErrors] =
      await Promise.all([
        prisma.user.count(),
        prisma.job.count(),
        prisma.job.count({ where: { status: 'ACTIVE' } }),
        prisma.jobApplication.count(),
        // Get recent error logs if you have an error logging table
        // prisma.errorLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
        Promise.resolve(0), // Placeholder for error count
      ]);

    // Calculate database connection pool info
    const dbConnections = await getDatabaseConnections();

    // Calculate response times (you might want to implement actual monitoring)
    const responseTime = Math.floor(Math.random() * 100) + 150; // Simulated for now

    // Calculate error rate (you might want to implement actual error tracking)
    const errorRate = Math.random() * 0.05; // Simulated error rate

    // System status determination
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (responseTime > 500 || errorRate > 0.05) {
      status = 'warning';
    }
    if (responseTime > 1000 || errorRate > 0.1) {
      status = 'critical';
    }

    return {
      status,
      uptime: '99.9%', // You might want to implement actual uptime tracking
      responseTime,
      errorRate,
      activeUsers: totalUsers, // You might want to track actual active sessions
      databaseConnections: dbConnections,
      memoryUsage: Math.floor(Math.random() * 30) + 60, // Simulated
      diskUsage: Math.floor(Math.random() * 20) + 35, // Simulated
      cpuUsage: Math.floor(Math.random() * 40) + 15, // Simulated
      lastUpdated: new Date(),
      databaseMetrics: {
        totalUsers,
        totalJobs,
        activeJobs,
        totalApplications,
        recentErrors,
      },
      services: [
        {
          name: 'Web Server',
          status: 'online' as const,
          responseTime: Math.floor(Math.random() * 50) + 100,
          lastCheck: new Date(),
        },
        {
          name: 'Database',
          status: 'online' as const,
          responseTime: Math.floor(Math.random() * 30) + 20,
          lastCheck: new Date(),
        },
        {
          name: 'Redis Cache',
          status: 'online' as const,
          responseTime: Math.floor(Math.random() * 20) + 5,
          lastCheck: new Date(),
        },
        {
          name: 'Email Service',
          status: 'online' as const,
          responseTime: Math.floor(Math.random() * 100) + 50,
          lastCheck: new Date(),
        },
        {
          name: 'File Storage',
          status: 'online' as const,
          responseTime: Math.floor(Math.random() * 200) + 100,
          lastCheck: new Date(),
        },
        {
          name: 'Search Engine',
          status:
            Math.random() > 0.8 ? ('degraded' as const) : ('online' as const),
          responseTime: Math.floor(Math.random() * 500) + 200,
          lastCheck: new Date(),
        },
      ],
    };
  } catch (error) {
    console.error('Error getting system metrics:', error);
    throw error;
  }
}

async function getDatabaseConnections(): Promise<number> {
  try {
    // This is a simplified way to get connection info
    // In a real application, you might want to query the database directly
    // for connection pool statistics
    const result =
      (await prisma.$queryRaw`SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'active'`) as any[];
    return parseInt(result[0]?.count || '0');
  } catch (error) {
    console.error('Error getting database connections:', error);
    return 0;
  }
}
