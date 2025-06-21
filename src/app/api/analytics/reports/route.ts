import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import path from "path";

// Validation schema
const reportRequestSchema = z.object({
  reportType: z.enum(['user_activity', 'job_performance', 'platform_overview', 'revenue_analysis', 'custom']),
  timeRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  includeCharts: z.boolean().default(false),
  filters: z.object({
    region: z.string().optional(),
    userType: z.enum(['job_seeker', 'employer', 'all']).optional(),
    jobCategory: z.string().optional(),
    status: z.string().optional(),
  }).optional(),
  customMetrics: z.array(z.string()).optional(),
});

// POST /api/analytics/reports - Generate analytics report
export async function POST(req: NextRequest) {
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
      select: { id: true, role: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const reportRequest = reportRequestSchema.parse(body);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (reportRequest.timeRange) {
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

    // Generate report based on type and user role
    let reportData;
    
    switch (reportRequest.reportType) {
      case 'user_activity':
        reportData = await generateUserActivityReport(user, startDate, endDate, reportRequest.filters);
        break;
      case 'job_performance':
        reportData = await generateJobPerformanceReport(user, startDate, endDate, reportRequest.filters);
        break;
      case 'platform_overview':
        if (user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Admin access required for platform overview reports' },
            { status: 403 }
          );
        }
        reportData = await generatePlatformOverviewReport(startDate, endDate, reportRequest.filters);
        break;
      case 'revenue_analysis':
        if (user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Admin access required for revenue analysis reports' },
            { status: 403 }
          );
        }
        reportData = await generateRevenueAnalysisReport(startDate, endDate, reportRequest.filters);
        break;
      case 'custom':
        reportData = await generateCustomReport(user, startDate, endDate, reportRequest.customMetrics, reportRequest.filters);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    // Store report in database
    const report = await prisma.analyticsReport.create({
      data: {
        type: reportRequest.reportType,
        generatedBy: user.id,
        data: reportData,
        status: 'generated',
      },
    });

    // Format response based on requested format
    if (reportRequest.format === 'csv') {
      const csvData = convertToCSV(reportData);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-report-${report.id}.csv"`,
        },
      });
    } else if (reportRequest.format === 'pdf') {
      // TODO: Implement PDF generation
      return NextResponse.json(
        { error: 'PDF format not yet implemented' },
        { status: 501 }
      );
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        type: reportRequest.reportType,
        data: reportData,
        generatedAt: report.createdAt,
        timeRange: reportRequest.timeRange,
        filters: reportRequest.filters,
      },
    });
  } catch (error) {
    console.error('Error generating analytics report:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// GET /api/analytics/reports - Get user's reports
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

    // Get user's reports
    const reports = await prisma.analyticsReport.findMany({
      where: { generatedBy: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// Helper functions for generating different types of reports
async function generateUserActivityReport(user: any, startDate: Date, endDate: Date, filters?: any) {
  if (user.role === 'job_seeker') {
    const [applications, searches, savedJobs, chatSessions] = await Promise.all([
      prisma.jobApplication.count({
        where: {
          userId: user.id,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.searchHistory.count({
        where: {
          userId: user.id,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.savedJob.count({
        where: {
          userId: user.id,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.chatAnalytics.count({
        where: {
          userId: user.id,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    return {
      userType: 'job_seeker',
      metrics: {
        applications,
        searches,
        savedJobs,
        chatSessions,
      },
      period: { startDate, endDate },
    };
  } else if (user.role === 'employer') {
    const [jobPosts, applications, views] = await Promise.all([
      prisma.job.count({
        where: {
          employerId: user.id,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.jobApplication.count({
        where: {
          job: { employerId: user.id },
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.jobView.count({
        where: {
          job: { employerId: user.id },
          createdAt: { gte: startDate, lte: endDate },
        },
      }).catch(() => 0),
    ]);

    return {
      userType: 'employer',
      metrics: {
        jobPosts,
        applications,
        views,
      },
      period: { startDate, endDate },
    };
  }

  return { error: 'Invalid user type for user activity report' };
}

async function generateJobPerformanceReport(user: any, startDate: Date, endDate: Date, filters?: any) {
  if (user.role !== 'employer' && user.role !== 'admin') {
    return { error: 'Insufficient permissions for job performance report' };
  }

  const whereCondition: any = {
    createdAt: { gte: startDate, lte: endDate },
  };

  if (user.role === 'employer') {
    whereCondition.employerId = user.id;
  }

  if (filters?.jobCategory) {
    whereCondition.category = filters.jobCategory;
  }

  const jobs = await prisma.job.findMany({
    where: whereCondition,
    include: {
      _count: {
        select: {
          jobApplications: true,
        },
      },
    },
  });

  return {
    totalJobs: jobs.length,
    averageApplications: jobs.length > 0 ? jobs.reduce((sum, job) => sum + job._count.jobApplications, 0) / jobs.length : 0,
    topPerformingJobs: jobs
      .sort((a, b) => b._count.jobApplications - a._count.jobApplications)
      .slice(0, 10)
      .map(job => ({
        id: job.id,
        title: job.title,
        applications: job._count.jobApplications,
      })),
    period: { startDate, endDate },
  };
}

async function generatePlatformOverviewReport(startDate: Date, endDate: Date, filters?: any) {
  const [totalUsers, totalJobs, totalApplications, revenue] = await Promise.all([
    prisma.user.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    }),
    prisma.job.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    }),
    prisma.jobApplication.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    }),
    prisma.creditTransaction.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    overview: {
      totalUsers,
      totalJobs,
      totalApplications,
      revenue: revenue._sum.amount || 0,
    },
    period: { startDate, endDate },
  };
}

async function generateRevenueAnalysisReport(startDate: Date, endDate: Date, filters?: any) {
  const transactions = await prisma.creditTransaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      amount: { gt: 0 },
    },
    include: {
      user: {
        select: {
          role: true,
        },
      },
    },
  });

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const revenueByUserType = transactions.reduce((acc, t) => {
    const role = t.user.role;
    acc[role] = (acc[role] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalRevenue,
    transactionCount: transactions.length,
    averageTransactionValue: transactions.length > 0 ? totalRevenue / transactions.length : 0,
    revenueByUserType,
    period: { startDate, endDate },
  };
}

async function generateCustomReport(user: any, startDate: Date, endDate: Date, metrics?: string[], filters?: any) {
  // This would be a more flexible report generator based on requested metrics
  return {
    customMetrics: metrics || [],
    message: 'Custom report generation not fully implemented',
    period: { startDate, endDate },
  };
}

function convertToCSV(data: any): string {
  // Simple CSV conversion - would need more sophisticated implementation
  const headers = Object.keys(data);
  const csvHeaders = headers.join(',');
  
  // For now, just return a basic CSV structure
  return `${csvHeaders}\n${headers.map(h => JSON.stringify(data[h])).join(',')}`;
}
