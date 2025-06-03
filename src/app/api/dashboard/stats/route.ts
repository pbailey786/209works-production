import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/app/api/auth/prisma';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    // Get dashboard statistics in parallel
    const [
      savedJobsCount,
      alertsCount,
      activeAlertsCount,
      searchHistoryCount,
      recentSearches,
      recentActivity,
    ] = await Promise.all([
      // Count saved jobs
      prisma.jobApplication.count({
        where: {
          userId,
          status: 'saved',
        },
      }),

      // Count total alerts
      prisma.alert.count({
        where: { userId },
      }),

      // Count active alerts
      prisma.alert.count({
        where: {
          userId,
          isActive: true,
        },
      }),

      // Count search history
      prisma.searchHistory.count({
        where: { userId },
      }),

      // Get recent searches (last 5)
      prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          query: true,
          filters: true,
          createdAt: true,
        },
      }),

      // Get recent activity (saved jobs and alerts)
      prisma.jobApplication.findMany({
        where: {
          userId,
          status: 'saved',
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      stats: {
        savedJobs: savedJobsCount,
        totalAlerts: alertsCount,
        activeAlerts: activeAlertsCount,
        searchHistory: searchHistoryCount,
      },
      recentSearches,
      recentActivity: recentActivity.map(app => ({
        type: 'saved_job',
        id: app.id,
        title: `Saved ${app.job.title} at ${app.job.company}`,
        timestamp: app.appliedAt,
        jobId: app.job.id,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
