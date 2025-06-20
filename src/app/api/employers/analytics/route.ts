import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const employerId = userId;

    // Get date ranges for analytics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch comprehensive employer analytics
    const [
      totalJobs,
      activeJobs,
      featuredJobs,
      totalApplications,
      recentApplications,
      weeklyApplications,
      jobViews,
      credits
    ] = await Promise.all([
      // Total jobs posted
      prisma.job.count({
        where: { employerId }
      }),

      // Active jobs
      prisma.job.count({
        where: { 
          employerId,
          status: 'ACTIVE'
        }
      }),

      // Featured jobs
      prisma.job.count({
        where: { 
          employerId,
          featured: true,
          status: 'ACTIVE'
        }
      }),

      // Total applications
      prisma.application.count({
        where: {
          job: { employerId }
        }
      }),

      // Recent applications (30 days)
      prisma.application.count({
        where: {
          job: { employerId },
          createdAt: { gte: thirtyDaysAgo }
        }
      }),

      // Weekly applications (7 days)
      prisma.application.count({
        where: {
          job: { employerId },
          createdAt: { gte: sevenDaysAgo }
        }
      }),

      // Mock job views data (would come from analytics service)
      Promise.resolve(Math.floor(Math.random() * 1000) + 500),

      // Get credit information
      prisma.jobPostingCredit.count({
        where: {
          userId: employerId,
          isUsed: false,
          expiresAt: { gt: now }
        }
      })
    ]);

    // Get top performing jobs
    const topJobs = await prisma.job.findMany({
      where: { employerId },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        applications: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Get recent applications with details
    const recentApplicationsDetails = await prisma.application.findMany({
      where: {
        job: { employerId },
        createdAt: { gte: sevenDaysAgo }
      },
      include: {
        user: {
          select: {
            name: true,
            location: true
          }
        },
        job: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Calculate performance metrics
    const applicationRate = totalJobs > 0 ? totalApplications / totalJobs : 0;
    const weeklyGrowth = recentApplications > 0 && weeklyApplications > 0 ? 
      ((weeklyApplications / (recentApplications - weeklyApplications)) * 100) : 0;

    // Calculate conversion funnel
    const viewToApplicationRate = jobViews > 0 ? (totalApplications / jobViews) * 100 : 0;

    // Mock some additional metrics that would come from real analytics
    const mockMetrics = {
      profileViews: Math.floor(Math.random() * 200) + 50,
      emailOpens: Math.floor(Math.random() * 100) + 20,
      emailClicks: Math.floor(Math.random() * 50) + 10,
      socialShares: Math.floor(Math.random() * 25) + 5,
    };

    const analytics = {
      overview: {
        totalJobs,
        activeJobs,
        featuredJobs,
        totalApplications,
        recentApplications,
        weeklyApplications,
        jobViews,
        availableCredits: credits
      },
      performance: {
        applicationRate: Math.round(applicationRate * 100) / 100,
        weeklyGrowth: Math.round(weeklyGrowth * 100) / 100,
        viewToApplicationRate: Math.round(viewToApplicationRate * 100) / 100,
        averageApplicationsPerJob: totalJobs > 0 ? Math.round((totalApplications / totalJobs) * 100) / 100 : 0
      },
      engagement: {
        profileViews: mockMetrics.profileViews,
        emailOpens: mockMetrics.emailOpens,
        emailClicks: mockMetrics.emailClicks,
        socialShares: mockMetrics.socialShares,
        emailOpenRate: mockMetrics.emailOpens > 0 ? 
          Math.round((mockMetrics.emailClicks / mockMetrics.emailOpens) * 100) : 0
      },
      topPerformingJobs: topJobs.map(job => ({
        id: job.id,
        title: job.title,
        applications: job._count.applications,
        location: job.location,
        postedAt: job.postedAt,
        status: job.status,
        featured: job.featured
      })),
      recentActivity: recentApplicationsDetails.map(app => ({
        id: app.id,
        candidateName: app.user.name,
        candidateLocation: app.user.location,
        jobTitle: app.job.title,
        appliedAt: app.createdAt,
        status: app.status
      })),
      trends: {
        dailyApplications: generateDailyTrend(7, weeklyApplications),
        weeklyJobViews: generateWeeklyTrend(4, jobViews),
        monthlyPerformance: generateMonthlyTrend(3, totalApplications)
      }
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching employer analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions to generate trend data
function generateDailyTrend(days: number, total: number) {
  const trend = [];
  const baseValue = Math.floor(total / days);
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const value = baseValue + Math.floor(Math.random() * (baseValue * 0.5));
    
    trend.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, value)
    });
  }
  
  return trend;
}

function generateWeeklyTrend(weeks: number, total: number) {
  const trend = [];
  const baseValue = Math.floor(total / weeks);
  
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7));
    const value = baseValue + Math.floor(Math.random() * (baseValue * 0.3));
    
    trend.push({
      week: `Week ${weeks - i}`,
      value: Math.max(0, value)
    });
  }
  
  return trend;
}

function generateMonthlyTrend(months: number, total: number) {
  const trend = [];
  const baseValue = Math.floor(total / months);
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const value = baseValue + Math.floor(Math.random() * (baseValue * 0.4));
    
    trend.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      value: Math.max(0, value)
    });
  }
  
  return trend;
}
