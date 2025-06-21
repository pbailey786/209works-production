import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Resend } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';
import path from "path";


function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is required');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth() as any;

    if (!session?.user || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      reportType = 'weekly', 
      recipients = [], 
      includeCharts = true,
      customDateRange = null 
    } = body;

    // Generate the report
    const report = await generateReport(reportType, customDateRange);
    
    // Create report record in database
    const reportRecord = await prisma.analyticsReport.create({
      data: {
        type: reportType,
        generatedBy: user?.id,
        data: JSON.stringify(report),
        recipients: recipients.path.join(','),
        status: 'generated',
      },
    });

    // Send email if recipients provided
    if (recipients.length > 0) {
      await sendReportEmail(report, recipients, reportType, includeCharts);
      
      // Update report status
      await prisma.analyticsReport.update({
        where: { id: reportRecord.id },
        data: { status: 'sent', sentAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      reportId: reportRecord.id,
      report,
      message: recipients.length > 0 ? 'Report generated and sent' : 'Report generated',
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

async function generateReport(type: string, customDateRange: any = null) {
  const now = new Date();
  let startDate: Date;
  let endDate = now;
  let periodName = '';

  // Set date range based on report type
  switch (type) {
    case 'daily':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      periodName = 'Daily';
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      periodName = 'Weekly';
      break;
    case 'monthly':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      periodName = 'Monthly';
      break;
    case 'custom':
      if (customDateRange) {
        startDate = new Date(customDateRange.start);
        endDate = new Date(customDateRange.end);
        periodName = 'Custom Range';
      } else {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        periodName = 'Weekly';
      }
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      periodName = 'Weekly';
  }

  const dateFilter = { gte: startDate, lte: endDate };

  // Fetch comprehensive analytics data
  const [
    userMetrics,
    jobMetrics,
    applicationMetrics,
    aiMetrics,
    topPerformers,
    alerts,
  ] = await Promise.all([
    getUserMetrics(dateFilter),
    getJobMetrics(dateFilter),
    getApplicationMetrics(dateFilter),
    getAIMetrics(dateFilter),
    getTopPerformers(dateFilter),
    getSystemAlerts(dateFilter),
  ]);

  return {
    reportType: type,
    periodName,
    dateRange: { start: startDate, end: endDate },
    generatedAt: now,
    summary: {
      totalUsers: userMetrics.total,
      newUsers: userMetrics.new,
      totalJobs: jobMetrics.total,
      newJobs: jobMetrics.new,
      totalApplications: applicationMetrics.total,
      newApplications: applicationMetrics.new,
      aiChatSessions: aiMetrics.totalSessions,
      avgResponseTime: aiMetrics.avgResponseTime,
    },
    userMetrics,
    jobMetrics,
    applicationMetrics,
    aiMetrics,
    topPerformers,
    alerts,
    insights: generateInsights({
      userMetrics,
      jobMetrics,
      applicationMetrics,
      aiMetrics,
    }),
  };
}

async function getUserMetrics(dateFilter: any) {
  const [total, newUsers, userGrowth, usersByRole] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: dateFilter } }),
    prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM User 
      WHERE createdAt >= ${dateFilter.gte} AND createdAt <= ${dateFilter.lte}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `,
    prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      where: { createdAt: dateFilter },
    }),
  ]);

  return {
    total,
    new: newUsers,
    growth: userGrowth,
    byRole: usersByRole,
  };
}

async function getJobMetrics(dateFilter: any) {
  const [total, newJobs, jobsByCategory, jobsByLocation] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { createdAt: dateFilter } }),
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
      LIMIT 10
    `,
    prisma.job.groupBy({
      by: ['location'],
      _count: { location: true },
      where: { createdAt: dateFilter },
      orderBy: { _count: { location: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    total,
    new: newJobs,
    byCategory: jobsByCategory,
    byLocation: jobsByLocation,
  };
}

async function getApplicationMetrics(dateFilter: any) {
  const [total, newApplications, applicationTrends, conversionRate] = await Promise.all([
    prisma.jobApplication.count(),
    prisma.jobApplication.count({ where: { appliedAt: dateFilter } }),
    prisma.$queryRaw`
      SELECT 
        DATE(appliedAt) as date,
        COUNT(*) as count,
        COUNT(DISTINCT userId) as unique_users
      FROM JobApplication 
      WHERE appliedAt >= ${dateFilter.gte} AND appliedAt <= ${dateFilter.lte}
      GROUP BY DATE(appliedAt)
      ORDER BY date ASC
    `,
    prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT ja.userId) as applicants,
        COUNT(DISTINCT u.id) as total_users,
        ROUND((COUNT(DISTINCT ja.userId) * 100.0 / COUNT(DISTINCT u.id)), 2) as conversion_rate
      FROM User u
      LEFT JOIN JobApplication ja ON u.id = ja.userId 
        AND ja.appliedAt >= ${dateFilter.gte} 
        AND ja.appliedAt <= ${dateFilter.lte}
      WHERE u.createdAt <= ${dateFilter.lte}
    `,
  ]);

  return {
    total,
    new: newApplications,
    trends: applicationTrends,
    conversionRate,
  };
}

async function getAIMetrics(dateFilter: any) {
  const [totalSessions, avgResponseTime, topQuestions, aiAssistanceRate] = await Promise.all([
    prisma.chatAnalytics.count({ where: { createdAt: dateFilter } }),
    prisma.chatAnalytics.aggregate({
      where: { createdAt: dateFilter, responseTime: { gt: 0 } },
      _avg: { responseTime: true },
    }),
    prisma.chatAnalytics.groupBy({
      by: ['question'],
      _count: { question: true },
      where: { createdAt: dateFilter },
      orderBy: { _count: { question: 'desc' } },
      take: 10,
    }),
    prisma.$queryRaw`
      SELECT 
        COUNT(CASE WHEN ja.source = 'ai_chat' THEN 1 END) as ai_assisted,
        COUNT(*) as total,
        ROUND((COUNT(CASE WHEN ja.source = 'ai_chat' THEN 1 END) * 100.0 / COUNT(*)), 2) as rate
      FROM JobApplication ja
      WHERE ja.appliedAt >= ${dateFilter.gte} AND ja.appliedAt <= ${dateFilter.lte}
    `,
  ]);

  return {
    totalSessions,
    avgResponseTime: avgResponseTime._avg.responseTime || 0,
    topQuestions,
    aiAssistanceRate,
  };
}

async function getTopPerformers(dateFilter: any) {
  const [topJobs, topEmployers, topCategories] = await Promise.all([
    prisma.job.findMany({
      where: { createdAt: dateFilter },
      select: {
        id: true,
        title: true,
        company: true,
        _count: { select: { jobApplications: true } },
      },
      orderBy: { jobApplications: { _count: 'desc' } },
      take: 10,
    }),
    prisma.user.findMany({
      where: {
        role: 'employer',
        employerJobs: { some: { createdAt: dateFilter } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { employerJobs: true } },
      },
      orderBy: { employerJobs: { _count: 'desc' } },
      take: 10,
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
      LIMIT 10
    `,
  ]);

  return {
    topJobs,
    topEmployers,
    topCategories,
  };
}

async function getSystemAlerts(dateFilter: any) {
  // This would fetch from your alerts system
  // For now, return a placeholder
  return {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  };
}

function generateInsights(data: any) {
  const insights = [];

  // User growth insights
  if (data.userMetrics.new > 0) {
    insights.push({
      type: 'positive',
      title: 'User Growth',
      description: `${data.userMetrics.new} new users joined this period`,
    });
  }

  // Job posting insights
  if (data.jobMetrics.new > 0) {
    insights.push({
      type: 'positive',
      title: 'Job Market Activity',
      description: `${data.jobMetrics.new} new jobs posted this period`,
    });
  }

  // AI usage insights
  if (data.aiMetrics.totalSessions > 0) {
    insights.push({
      type: 'info',
      title: 'AI Engagement',
      description: `${data.aiMetrics.totalSessions} AI chat sessions with avg response time of ${Math.round(data.aiMetrics.avgResponseTime)}ms`,
    });
  }

  return insights;
}

async function sendReportEmail(report: any, recipients: string[], reportType: string, includeCharts: boolean) {
  const resend = getResendClient();

  const subject = `209 Works ${report.periodName} Analytics Report - ${new Date().toLocaleDateString()}`;

  const htmlContent = generateReportHTML(report, includeCharts);

  try {
    await resend.emails.send({
      from: 'analytics@209.works',
      to: recipients,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: `analytics-report-${reportType}-${new Date().toISOString().split('T')[0]}.json`,
          content: Buffer.from(JSON.stringify(report, null, 2)),
        },
      ],
    });
  } catch (error) {
    console.error('Failed to send report email:', error);
    throw error;
  }
}

function generateReportHTML(report: any, includeCharts: boolean): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>209 Works Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .metric-label { color: #64748b; font-size: 0.9em; }
        .section { margin: 30px 0; }
        .section h2 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        .insight { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 10px 0; }
        .insight.warning { background: #fef3c7; border-left-color: #f59e0b; }
        .insight.error { background: #fee2e2; border-left-color: #ef4444; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; margin-top: 40px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>209 Works Analytics Report</h1>
        <p>${report.periodName} Report • ${new Date(report.dateRange.start).toLocaleDateString()} - ${new Date(report.dateRange.end).toLocaleDateString()}</p>
      </div>

      <div class="content">
        <div class="section">
          <h2>📊 Key Metrics Summary</h2>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-value">${report.summary.newUsers}</div>
              <div class="metric-label">New Users</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${report.summary.newJobs}</div>
              <div class="metric-label">New Jobs Posted</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${report.summary.newApplications}</div>
              <div class="metric-label">New Applications</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${report.summary.aiChatSessions}</div>
              <div class="metric-label">AI Chat Sessions</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>💡 Key Insights</h2>
          ${report.insights.map((insight: any) => `
            <div class="insight ${insight.type === 'warning' ? 'warning' : insight.type === 'error' ? 'error' : ''}">
              <strong>${insight.title}</strong><br>
              ${insight.description}
            </div>
          `).path.join('')}
        </div>

        <div class="section">
          <h2>👥 User Analytics</h2>
          <p><strong>Total Users:</strong> ${report.userMetrics.total}</p>
          <p><strong>New Users:</strong> ${report.userMetrics.new}</p>

          <h3>Users by Role</h3>
          <table>
            <thead>
              <tr><th>Role</th><th>Count</th></tr>
            </thead>
            <tbody>
              ${report.userMetrics.byRole.map((role: any) => `
                <tr><td>${role.role}</td><td>${role._count.role}</td></tr>
              `).path.join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>💼 Job Market Analytics</h2>
          <p><strong>Total Jobs:</strong> ${report.jobMetrics.total}</p>
          <p><strong>New Jobs:</strong> ${report.jobMetrics.new}</p>

          <h3>Top Job Categories</h3>
          <table>
            <thead>
              <tr><th>Category</th><th>Jobs Posted</th></tr>
            </thead>
            <tbody>
              ${report.jobMetrics.byCategory.slice(0, 5).map((cat: any) => `
                <tr><td>${cat.category}</td><td>${cat._count.category}</td></tr>
              `).path.join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🤖 AI Analytics</h2>
          <p><strong>Chat Sessions:</strong> ${report.aiMetrics.totalSessions}</p>
          <p><strong>Avg Response Time:</strong> ${Math.round(report.aiMetrics.avgResponseTime)}ms</p>

          <h3>Top Questions</h3>
          <table>
            <thead>
              <tr><th>Question</th><th>Frequency</th></tr>
            </thead>
            <tbody>
              ${report.aiMetrics.topQuestions.slice(0, 5).map((q: any) => `
                <tr><td>${q.question}</td><td>${q._count.question}</td></tr>
              `).path.join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>🏆 Top Performers</h2>

          <h3>Most Applied-to Jobs</h3>
          <table>
            <thead>
              <tr><th>Job Title</th><th>Company</th><th>Applications</th></tr>
            </thead>
            <tbody>
              ${report.topPerformers.topJobs.slice(0, 5).map((job: any) => `
                <tr><td>${job.title}</td><td>${job.company}</td><td>${job._count.applications}</td></tr>
              `).path.join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="footer">
        <p>Generated on ${new Date(report.generatedAt).toLocaleString()}</p>
        <p>209 Works Analytics System</p>
      </div>
    </body>
    </html>
  `;
}
