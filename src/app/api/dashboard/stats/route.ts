import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

export async function GET(req: NextRequest) {
  try {
    // Check authentication with Clerk
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
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
      applicationsCount,
      recentSearches,
      recentActivity,
    ] = await Promise.all([
      // Count saved jobs
      prisma.savedJob.count({
        where: {
          userId,
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

      // Count applications submitted
      prisma.jobApplication.count({
        where: {
          userId,
          status: { not: 'saved' }, // Exclude saved jobs, only count actual applications
        },
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
      prisma.savedJob.findMany({
        where: {
          userId,
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
        orderBy: { savedAt: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      stats: {
        savedJobs: savedJobsCount,
        totalAlerts: alertsCount,
        activeAlerts: activeAlertsCount,
        searchHistory: searchHistoryCount,
        applicationsSubmitted: applicationsCount,
      },
      recentSearches,
      recentActivity: recentActivity.map(savedJob => ({
        type: 'saved_job',
        id: savedJob.id,
        title: `Saved ${savedJob.job.title} at ${savedJob.job.company}`,
        timestamp: savedJob.savedAt,
        jobId: savedJob.job.id,
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
