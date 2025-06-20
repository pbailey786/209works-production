import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth() as any;

    if (!session?.user || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json or csv
    const type = searchParams.get('type') || 'overview'; // overview, users, jobs, ai, etc.
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Set date range (default to last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dateFilter = {
      gte: startDate ? new Date(startDate) : thirtyDaysAgo,
      lte: endDate ? new Date(endDate) : new Date(),
    };

    let data: any = {};
    let filename = '';

    switch (type) {
      case 'overview':
        data = await getOverviewData(dateFilter);
        filename = `analytics-overview-${new Date().toISOString().split('T')[0]}`;
        break;
      
      case 'users':
        data = await getUserAnalytics(dateFilter);
        filename = `user-analytics-${new Date().toISOString().split('T')[0]}`;
        break;
      
      case 'jobs':
        data = await getJobAnalytics(dateFilter);
        filename = `job-analytics-${new Date().toISOString().split('T')[0]}`;
        break;
      
      case 'ai':
        data = await getAIAnalytics(dateFilter);
        filename = `ai-analytics-${new Date().toISOString().split('T')[0]}`;
        break;
      
      case 'applications':
        data = await getApplicationAnalytics(dateFilter);
        filename = `application-analytics-${new Date().toISOString().split('T')[0]}`;
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    if (format === 'csv') {
      const csv = convertToCSV(data, type);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

async function getOverviewData(dateFilter: any) {
  const [
    totalUsers,
    newUsers,
    totalJobs,
    newJobs,
    totalApplications,
    newApplications,
    totalChatSessions,
    newChatSessions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: dateFilter } }),
    prisma.job.count(),
    prisma.job.count({ where: { createdAt: dateFilter } }),
    prisma.jobApplication.count(),
    prisma.jobApplication.count({ where: { appliedAt: dateFilter } }),
    prisma.chatAnalytics.count(),
    prisma.chatAnalytics.count({ where: { createdAt: dateFilter } }),
  ]);

  return {
    summary: {
      totalUsers,
      newUsers,
      totalJobs,
      newJobs,
      totalApplications,
      newApplications,
      totalChatSessions,
      newChatSessions,
    },
    exportedAt: new Date().toISOString(),
    dateRange: dateFilter,
  };
}

async function getUserAnalytics(dateFilter: any) {
  const [users, userGrowth, usersByRole] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: dateFilter },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        isEmailVerified: true,
        _count: {
          select: {
            jobApplications: true,
            alerts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as new_users,
        COUNT(CASE WHEN role = 'employer' THEN 1 END) as new_employers,
        COUNT(CASE WHEN role = 'jobseeker' THEN 1 END) as new_jobseekers
      FROM User 
      WHERE createdAt >= ${dateFilter.gte} AND createdAt <= ${dateFilter.lte}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `,
    prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      where: { createdAt: dateFilter },
    }),
  ]);

  return {
    users,
    userGrowth,
    usersByRole,
    exportedAt: new Date().toISOString(),
    dateRange: dateFilter,
  };
}

async function getJobAnalytics(dateFilter: any) {
  const [jobs, jobsByCategory, jobsByLocation] = await Promise.all([
    prisma.job.findMany({
      where: { createdAt: dateFilter },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        categories: true,
        salaryMin: true,
        salaryMax: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            jobApplications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Note: categories is an array field, so we'll use a raw query instead
    prisma.$queryRaw`
      SELECT
        UNNEST(categories) as category,
        COUNT(*) as count
      FROM Job
      WHERE createdAt >= ${dateFilter.gte} AND createdAt <= ${dateFilter.lte}
      AND array_length(categories, 1) > 0
      GROUP BY category
      ORDER BY count DESC
      LIMIT 20
    `,
    prisma.job.groupBy({
      by: ['location'],
      _count: { location: true },
      where: { createdAt: dateFilter },
      orderBy: { _count: { location: 'desc' } },
      take: 20,
    }),
  ]);

  return {
    jobs,
    jobsByCategory,
    jobsByLocation,
    exportedAt: new Date().toISOString(),
    dateRange: dateFilter,
  };
}

async function getAIAnalytics(dateFilter: any) {
  const [chatSessions, topQuestions, aiAssistance] = await Promise.all([
    prisma.chatAnalytics.findMany({
      where: { createdAt: dateFilter },
      select: {
        id: true,
        userId: true,
        question: true,
        response: true,
        responseTime: true,
        jobsFound: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.chatAnalytics.groupBy({
      by: ['question'],
      _count: { question: true },
      where: { createdAt: dateFilter },
      orderBy: { _count: { question: 'desc' } },
      take: 20,
    }),
    prisma.$queryRaw`
      SELECT
        COUNT(CASE WHEN ja.source = 'ai_chat' THEN 1 END) as ai_assisted,
        COUNT(*) as total_applications,
        ROUND(
          (COUNT(CASE WHEN ja.source = 'ai_chat' THEN 1 END) * 100.0 / COUNT(*)), 2
        ) as ai_assistance_rate
      FROM JobApplication ja
      WHERE ja.appliedAt >= ${dateFilter.gte} AND ja.appliedAt <= ${dateFilter.lte}
    `,
  ]);

  return {
    chatSessions,
    topQuestions,
    aiAssistance,
    exportedAt: new Date().toISOString(),
    dateRange: dateFilter,
  };
}

async function getApplicationAnalytics(dateFilter: any) {
  const [applications, applicationsByJob, applicationTrends] = await Promise.all([
    prisma.jobApplication.findMany({
      where: { appliedAt: dateFilter },
      select: {
        id: true,
        userId: true,
        jobId: true,
        appliedAt: true,
        status: true,
        job: {
          select: {
            title: true,
            company: true,
            categories: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    }),
    prisma.jobApplication.groupBy({
      by: ['jobId'],
      _count: { jobId: true },
      where: { appliedAt: dateFilter },
      orderBy: { _count: { jobId: 'desc' } },
      take: 20,
    }),
    prisma.$queryRaw`
      SELECT
        DATE(appliedAt) as date,
        COUNT(*) as applications,
        COUNT(DISTINCT userId) as unique_applicants,
        0 as ai_assisted_applications
      FROM JobApplication
      WHERE appliedAt >= ${dateFilter.gte} AND appliedAt <= ${dateFilter.lte}
      GROUP BY DATE(appliedAt)
      ORDER BY date DESC
    `,
  ]);

  return {
    applications,
    applicationsByJob,
    applicationTrends,
    exportedAt: new Date().toISOString(),
    dateRange: dateFilter,
  };
}

function convertToCSV(data: any, type: string): string {
  switch (type) {
    case 'overview':
      return convertOverviewToCSV(data);
    case 'users':
      return convertUsersToCSV(data);
    case 'jobs':
      return convertJobsToCSV(data);
    case 'ai':
      return convertAIToCSV(data);
    case 'applications':
      return convertApplicationsToCSV(data);
    default:
      return JSON.stringify(data);
  }
}

function convertOverviewToCSV(data: any): string {
  const headers = ['Metric', 'Total', 'New (Period)', 'Growth Rate'];
  const rows = [
    ['Users', data.summary.totalUsers, data.summary.newUsers, `${((data.summary.newUsers / data.summary.totalUsers) * 100).toFixed(2)}%`],
    ['Jobs', data.summary.totalJobs, data.summary.newJobs, `${((data.summary.newJobs / data.summary.totalJobs) * 100).toFixed(2)}%`],
    ['Applications', data.summary.totalApplications, data.summary.newApplications, `${((data.summary.newApplications / data.summary.totalApplications) * 100).toFixed(2)}%`],
    ['Chat Sessions', data.summary.totalChatSessions, data.summary.newChatSessions, `${((data.summary.newChatSessions / data.summary.totalChatSessions) * 100).toFixed(2)}%`],
  ];

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function convertUsersToCSV(data: any): string {
  const headers = ['ID', 'Name', 'Email', 'Role', 'Created At', 'Last Login', 'Verified', 'Applications', 'Alerts'];
  const rows = data.users.map((user: any) => [
    user.id,
    user.name || '',
    user.email,
    user.role,
    user.createdAt,
    user.lastLoginAt || '',
    user.isEmailVerified,
    user._count.jobApplications,
    user._count.alerts,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function convertJobsToCSV(data: any): string {
  const headers = ['ID', 'Title', 'Company', 'Location', 'Categories', 'Salary Min', 'Salary Max', 'Status', 'Created At', 'Applications'];
  const rows = data.jobs.map((job: any) => [
    job.id,
    job.title,
    job.company,
    job.location,
    Array.isArray(job.categories) ? job.categories.join('; ') : '',
    job.salaryMin || '',
    job.salaryMax || '',
    job.status,
    job.createdAt,
    job._count.jobApplications,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function convertAIToCSV(data: any): string {
  const headers = ['ID', 'User ID', 'Question', 'Response Time (ms)', 'Jobs Found', 'Created At'];
  const rows = data.chatSessions.map((session: any) => [
    session.id,
    session.userId,
    `"${session.question.replace(/"/g, '""')}"`, // Escape quotes in CSV
    session.responseTime || '',
    session.jobsFound || 0,
    session.createdAt,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function convertApplicationsToCSV(data: any): string {
  const headers = ['ID', 'User ID', 'Job ID', 'Job Title', 'Company', 'Applied At', 'Status', 'User Name', 'User Email'];
  const rows = data.applications.map((app: any) => [
    app.id,
    app.userId,
    app.jobId,
    app.job.title,
    app.job.company,
    app.appliedAt,
    app.status,
    app.user.name || '',
    app.user.email,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
