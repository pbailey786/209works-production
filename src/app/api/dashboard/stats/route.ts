import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { ensureUserExists } from '@/lib/auth/user-sync';

export async function GET(req: NextRequest) {
  try {
    // Ensure user exists in database (auto-sync with Clerk)
    const user = await ensureUserExists();
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
