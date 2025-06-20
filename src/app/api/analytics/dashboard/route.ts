import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { ComprehensiveAnalytics } from '@/lib/analytics/comprehensive-analytics';
import { z } from 'zod';

// Validation schema
const analyticsQuerySchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  userType: z.enum(['job_seeker', 'employer', 'all']).default('all'),
  region: z.string().optional(),
  includeComparisons: z.string().transform(val => val === 'true').default(false),
});

// GET /api/analytics/dashboard - Get comprehensive dashboard analytics
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const { timeRange, userType, region, includeComparisons } = analyticsQuerySchema.parse({
      timeRange: url.searchParams.get('timeRange'),
      userType: url.searchParams.get('userType'),
      region: url.searchParams.get('region'),
      includeComparisons: url.searchParams.get('includeComparisons'),
    });

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'all':
        startDate.setFullYear(2020); // Platform start date
        break;
    }

    // Build analytics based on user role
    if (user.role === 'job_seeker') {
      const analytics = await getJobSeekerAnalytics(user.id, startDate, endDate);
      return NextResponse.json({
        success: true,
        analytics,
        timeRange,
        generatedAt: new Date().toISOString(),
      });
    } else if (user.role === 'employer') {
      const analytics = await getEmployerAnalytics(user.id, startDate, endDate);
      return NextResponse.json({
        success: true,
        analytics,
        timeRange,
        generatedAt: new Date().toISOString(),
      });
    } else if (user.role === 'admin') {
      const analytics = await getAdminAnalytics(startDate, endDate, region, userType);
      return NextResponse.json({
        success: true,
        analytics,
        timeRange,
        generatedAt: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Job Seeker Analytics
async function getJobSeekerAnalytics(userId: string, startDate: Date, endDate: Date) {
  const [
    profileViews,
    jobApplications,
    savedJobs,
    searchHistory,
    chatSessions,
    jobMatches,
    applicationStats
  ] = await Promise.all([
    // Profile views (if tracking exists)
    prisma.profileView.count({
      where: {
        viewedUserId: userId,
        createdAt: { gte: startDate, lte: endDate },
      },
    }).catch(() => 0),

    // Job applications
    prisma.jobApplication.findMany({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        job: {
          select: {
            title: true,
            company: true,
            location: true,
          },
        },
      },
    }),

    // Saved jobs
    prisma.savedJob.count({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),

    // Search history
    prisma.searchHistory.findMany({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),

    // Chat sessions
    prisma.chatAnalytics.count({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),

    // Job matches from alerts
    prisma.jobAlert.count({
      where: {
        userId,
        isActive: true,
      },
    }),

    // Application status breakdown
    prisma.jobApplication.groupBy({
      by: ['status'],
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    }),
  ]);

  return {
    overview: {
      profileViews,
      totalApplications: jobApplications.length,
      savedJobs,
      activeJobAlerts: jobMatches,
      chatSessions,
    },
    applications: {
      total: jobApplications.length,
      statusBreakdown: applicationStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>),
      recentApplications: jobApplications.slice(0, 5),
    },
    searchActivity: {
      totalSearches: searchHistory.length,
      recentSearches: searchHistory.slice(0, 5),
    },
    engagement: {
      chatSessions,
      savedJobs,
      applicationRate: jobApplications.length > 0 ? (jobApplications.length / Math.max(searchHistory.length, 1)) * 100 : 0,
    },
  };
}

// Employer Analytics
async function getEmployerAnalytics(userId: string, startDate: Date, endDate: Date) {
  const [
    jobPosts,
    totalApplications,
    jobViews,
    creditUsage,
    topPerformingJobs,
    applicationsByStatus
  ] = await Promise.all([
    // Job posts
    prisma.job.findMany({
      where: {
        employerId: userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        jobApplications: true,
        _count: {
          select: {
            jobApplications: true,
          },
        },
      },
    }),

    // Total applications received
    prisma.jobApplication.count({
      where: {
        job: {
          employerId: userId,
        },
        createdAt: { gte: startDate, lte: endDate },
      },
    }),

    // Job views (if tracking exists)
    prisma.jobView.count({
      where: {
        job: {
          employerId: userId,
        },
        createdAt: { gte: startDate, lte: endDate },
      },
    }).catch(() => 0),

    // Credit usage
    prisma.creditTransaction.findMany({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Top performing jobs
    prisma.job.findMany({
      where: {
        employerId: userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        _count: {
          select: {
            jobApplications: true,
          },
        },
      },
      orderBy: {
        jobApplications: {
          _count: 'desc',
        },
      },
      take: 5,
    }),

    // Applications by status
    prisma.jobApplication.groupBy({
      by: ['status'],
      where: {
        job: {
          employerId: userId,
        },
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: true,
    }),
  ]);

  return {
    overview: {
      totalJobs: jobPosts.length,
      activeJobs: jobPosts.filter(job => job.status === 'active').length,
      totalApplications,
      jobViews,
      averageApplicationsPerJob: jobPosts.length > 0 ? totalApplications / jobPosts.length : 0,
    },
    jobPerformance: {
      topPerformingJobs: topPerformingJobs.map(job => ({
        id: job.id,
        title: job.title,
        applications: job._count.jobApplications,
        views: 0, // Would need job view tracking
        conversionRate: 0, // Would calculate from views/applications
      })),
      applicationsByStatus: applicationsByStatus.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>),
    },
    creditUsage: {
      totalSpent: creditUsage.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0),
      transactions: creditUsage.slice(0, 10),
    },
  };
}

// Admin Analytics
async function getAdminAnalytics(startDate: Date, endDate: Date, region?: string, userType?: string) {
  // This would be a comprehensive admin dashboard
  // For now, return a simplified version
  const [
    totalUsers,
    totalJobs,
    totalApplications,
    revenue
  ] = await Promise.all([
    prisma.user.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.job.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.jobApplication.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.creditTransaction.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        amount: { gt: 0 },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return {
    overview: {
      totalUsers,
      totalJobs,
      totalApplications,
      revenue: revenue._sum.amount || 0,
    },
    // Additional admin metrics would go here
  };
}
