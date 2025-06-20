import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';


export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    // Check if user is admin
    if (!session?.user || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();

    // Test database connectivity and performance
    const dbHealthStart = Date.now();
    const dbTest = await prisma.user.count();
    const dbResponseTime = Date.now() - dbHealthStart;

    // Get system metrics
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsersLastHour,
      activeUsersLastDay,
      totalJobs,
      activeJobs,
      totalApplications,
      recentErrors,
      chatSessions,
    ] = await Promise.all([
      // User metrics
      prisma.user.count(),
      prisma.user.count({
        where: { lastLoginAt: { gte: oneHourAgo } },
      }),
      prisma.user.count({
        where: { lastLoginAt: { gte: oneDayAgo } },
      }),

      // Job metrics
      prisma.job.count(),
      prisma.job.count({ where: { status: 'active' } }),

      // Application metrics
      prisma.jobApplication.count(),

      // Error tracking (if you have an error log table)
      // For now, we'll simulate this
      Promise.resolve([]),

      // Chat sessions (using ChatAnalytics as proxy)
      prisma.chatAnalytics.count({
        where: { createdAt: { gte: oneDayAgo } },
      }),
    ]);

    // Calculate health scores
    const dbHealth = dbResponseTime < 100 ? 'excellent' : 
                    dbResponseTime < 500 ? 'good' : 
                    dbResponseTime < 1000 ? 'fair' : 'poor';

    const userActivityScore = activeUsersLastHour > 0 ? 'active' : 'low';
    
    // Memory usage (Node.js process)
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    // System uptime
    const uptimeSeconds = process.uptime();
    const uptimeHours = Math.floor(uptimeSeconds / 3600);
    const uptimeDays = Math.floor(uptimeHours / 24);

    // API response time
    const totalResponseTime = Date.now() - startTime;

    const healthData = {
      status: 'healthy', // Overall status
      timestamp: now.toISOString(),
      
      // Database health
      database: {
        status: dbHealth,
        responseTime: dbResponseTime,
        connections: 'active', // You might want to track actual connection pool stats
        totalRecords: dbTest,
      },

      // Application metrics
      application: {
        uptime: {
          seconds: Math.round(uptimeSeconds),
          hours: uptimeHours,
          days: uptimeDays,
          formatted: `${uptimeDays}d ${uptimeHours % 24}h`,
        },
        memory: memoryUsageMB,
        responseTime: totalResponseTime,
      },

      // User activity
      users: {
        total: totalUsers,
        activeLastHour: activeUsersLastHour,
        activeLastDay: activeUsersLastDay,
        activityLevel: userActivityScore,
      },

      // Platform metrics
      platform: {
        totalJobs,
        activeJobs,
        totalApplications,
        chatSessions,
        jobsToApplicationsRatio: totalJobs > 0 ? 
          Math.round((totalApplications / totalJobs) * 100) / 100 : 0,
      },

      // System alerts
      alerts: [
        ...(dbResponseTime > 1000 ? [{
          level: 'warning',
          message: 'Database response time is high',
          value: `${dbResponseTime}ms`,
        }] : []),
        ...(memoryUsageMB.heapUsed > 500 ? [{
          level: 'info',
          message: 'Memory usage is elevated',
          value: `${memoryUsageMB.heapUsed}MB`,
        }] : []),
        ...(activeUsersLastHour === 0 ? [{
          level: 'info',
          message: 'No active users in the last hour',
          value: 'Low activity',
        }] : []),
      ],

      // Performance metrics
      performance: {
        dbResponseTime,
        apiResponseTime: totalResponseTime,
        memoryUsage: memoryUsageMB.heapUsed,
        activeConnections: activeUsersLastHour,
      },

      // Health checks
      healthChecks: {
        database: dbHealth === 'excellent' || dbHealth === 'good',
        memory: memoryUsageMB.heapUsed < 1000,
        responseTime: totalResponseTime < 1000,
        userActivity: activeUsersLastDay > 0,
      },
    };

    // Determine overall status
    const failedChecks = Object.values(healthData.healthChecks).filter(check => !check).length;
    if (failedChecks === 0) {
      healthData.status = 'healthy';
    } else if (failedChecks <= 2) {
      healthData.status = 'warning';
    } else {
      healthData.status = 'critical';
    }

    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch system health',
      healthChecks: {
        database: false,
        memory: false,
        responseTime: false,
        userActivity: false,
      },
    }, { status: 500 });
  }
}
