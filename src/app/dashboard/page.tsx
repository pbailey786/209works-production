import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/database/prisma';
import DashboardClient from './DashboardClient';

// Type definitions for dashboard data
interface DashboardStats {
  savedJobs: number;
  totalAlerts: number;
  activeAlerts: number;
  searchHistory: number;
  applicationsSubmitted: number;
}

interface RecentSearch {
  id: string;
  query: string;
  filters: string | null;
  createdAt: Date;
}

interface RecentSavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  salaryMin: number | undefined;
  salaryMax: number | undefined;
  postedAt: Date;
  type: string;
  savedAt: Date;
}

interface RecentAlert {
  id: string;
  type: string;
  jobTitle: string;
  location: string;
  isActive: boolean;
  createdAt: Date;
  lastTriggered: Date | undefined;
}

interface DashboardData {
  stats: DashboardStats;
  recentSearches: RecentSearch[];
  recentSavedJobs: RecentSavedJob[];
  recentAlerts: RecentAlert[];
}

// Server-side data fetching with error handling for missing tables
async function getDashboardData(userId: string): Promise<DashboardData> {
  try {
    // Helper function to safely execute queries
    const safeQuery = async <T,>(queryFn: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await queryFn();
      } catch (error) {
        console.warn('Database query failed, using fallback:', error);
        return fallback;
      }
    };

    const [
      savedJobsCount,
      alertsCount,
      activeAlertsCount,
      searchHistoryCount,
      applicationsCount,
      recentSearches,
      recentSavedJobs,
      recentAlerts,
    ] = await Promise.all([
      // Count saved jobs
      safeQuery(() => prisma.savedJob.count({
        where: { userId },
      }), 0),

      // Count total alerts
      safeQuery(() => prisma.alert.count({
        where: { userId },
      }), 0),

      // Count active alerts
      safeQuery(() => prisma.alert.count({
        where: {
          userId,
          isActive: true,
        },
      }), 0),

      // Count search history
      safeQuery(() => prisma.searchHistory.count({
        where: { userId },
      }), 0),

      // Count applications submitted
      safeQuery(() => prisma.jobApplication.count({
        where: {
          userId,
          status: { not: 'saved' }, // Exclude saved jobs, only count actual applications
        },
      }), 0),

      // Get recent searches (last 5)
      safeQuery(() => prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          query: true,
          filters: true,
          createdAt: true,
        },
      }), []),

      // Get recent saved jobs
      safeQuery(() => prisma.savedJob.findMany({
        where: { userId },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              jobType: true,
              salaryMin: true,
              salaryMax: true,
              postedAt: true,
            },
          },
        },
        orderBy: { savedAt: 'desc' },
        take: 3,
      }), []),

      // Get recent alerts
      safeQuery(() => prisma.alert.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          type: true,
          jobTitle: true,
          location: true,
          isActive: true,
          createdAt: true,
          lastTriggered: true,
        },
      }), []),
    ]);

    return {
      stats: {
        savedJobs: savedJobsCount,
        totalAlerts: alertsCount,
        activeAlerts: activeAlertsCount,
        searchHistory: searchHistoryCount,
        applicationsSubmitted: applicationsCount,
      },
      recentSearches,
      recentSavedJobs: recentSavedJobs.map(savedJob => ({
        ...savedJob.job,
        type: savedJob.job.jobType,
        salaryMin: savedJob.job.salaryMin ?? undefined,
        salaryMax: savedJob.job.salaryMax ?? undefined,
        savedAt: savedJob.savedAt,
      })),
      recentAlerts: recentAlerts.map(alert => ({
        ...alert,
        type: alert.type || 'General',
        jobTitle: alert.jobTitle || 'Untitled Alert',
        location: alert.location || 'Not specified',
        lastTriggered: alert.lastTriggered ?? undefined,
      })),
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      stats: {
        savedJobs: 0,
        totalAlerts: 0,
        activeAlerts: 0,
        searchHistory: 0,
        applicationsSubmitted: 0,
      },
      recentSearches: [],
      recentSavedJobs: [],
      recentAlerts: [],
    };
  }
}

export default async function DashboardPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

  if (!user?.email) {
    redirect('/signin');
  }

  // Get user by email since user?.id doesn't exist by default
  const dbUser = await prisma.user.findUnique({
    where: { email: user?.email },
    select: {
      id: true,
      role: true,
      onboardingCompleted: true,
    },
  });

  if (!user) {
    redirect('/signin');
  }

  // Check if user needs to complete onboarding
  if (!user.onboardingCompleted) {
    redirect('/onboarding');
  }

  // Role-based access control
  if (user.role === 'employer') {
    redirect('/employers/dashboard');
  }

  // Only allow job seekers and admins to access this dashboard
  if (user.role !== 'jobseeker' && user.role !== 'admin') {
    redirect('/');
  }

  const dashboardData = await getDashboardData(user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
            Welcome back, {user?.name || user?.email}
          </h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Here's an overview of your job search activity.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4 min-w-0 flex-1 sm:ml-5">
                <p className="truncate text-sm font-medium text-gray-500">
                  Search History
                </p>
                <p className="text-xl font-semibold text-gray-900 sm:text-2xl">
                  {dashboardData.stats.searchHistory}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4 min-w-0 flex-1 sm:ml-5">
                <p className="truncate text-sm font-medium text-gray-500">
                  Saved Jobs
                </p>
                <p className="text-xl font-semibold text-gray-900 sm:text-2xl">
                  {dashboardData.stats.savedJobs}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-5 5v-5zM21 7H3a2 2 0 00-2 2v10a2 2 0 002 2h8"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4 min-w-0 flex-1 sm:ml-5">
                <p className="truncate text-sm font-medium text-gray-500">
                  Active Alerts
                </p>
                <p className="text-xl font-semibold text-gray-900 sm:text-2xl">
                  {dashboardData.stats.activeAlerts}
                </p>
                <p className="text-xs text-gray-400">
                  of {dashboardData.stats.totalAlerts} total
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4 min-w-0 flex-1 sm:ml-5">
                <p className="truncate text-sm font-medium text-gray-500">
                  Applications Submitted
                </p>
                <p className="text-xl font-semibold text-gray-900 sm:text-2xl">
                  {dashboardData.stats.applicationsSubmitted}
                </p>
                <p className="text-xs text-gray-400">total applications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pass data to client component for interactive features */}
        <DashboardClient
          recentSavedJobs={dashboardData.recentSavedJobs}
          recentSearches={dashboardData.recentSearches}
          recentAlerts={dashboardData.recentAlerts}
        />

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <Link
            href="/jobs"
            className="flex items-center rounded-lg border border-gray-200 bg-white p-4 shadow transition-shadow hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                Search Jobs
              </p>
              <p className="truncate text-sm text-gray-500">
                Find new opportunities
              </p>
            </div>
          </Link>

          <Link
            href="/profile"
            className="flex items-center rounded-lg border border-gray-200 bg-white p-4 shadow transition-shadow hover:border-green-300 hover:shadow-md"
          >
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                Update Profile
              </p>
              <p className="truncate text-sm text-gray-500">
                Keep your info current
              </p>
            </div>
          </Link>

          <Link
            href="/alerts"
            className="flex items-center rounded-lg border border-gray-200 bg-white p-4 shadow transition-shadow hover:border-yellow-300 hover:shadow-md"
          >
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-100">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-5 5v-5zM21 7H3a2 2 0 00-2 2v10a2 2 0 002 2h8"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                Job Alerts
              </p>
              <p className="truncate text-sm text-gray-500">
                Set up notifications
              </p>
            </div>
          </Link>

          <Link
            href="/profile/applications?tab=saved"
            className="flex items-center rounded-lg border border-gray-200 bg-white p-4 shadow transition-shadow hover:border-purple-300 hover:shadow-md"
          >
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-100">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                Saved Jobs
              </p>
              <p className="truncate text-sm text-gray-500">
                View your saved jobs
              </p>
            </div>
          </Link>
        </div>

        {/* Getting Started Section */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-green-50 p-4 sm:mt-8 sm:p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-blue-500 to-green-500">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4 min-w-0 flex-1 sm:ml-5">
              <h3 className="text-base font-medium text-gray-900 sm:text-lg">
                🎉 Welcome to 209.works!
              </h3>
              <p className="mt-1 text-sm text-gray-700 sm:text-base">
                Your account is set up and ready to go. Here's what you can do
                next:
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  href="/jobs"
                  className="group flex items-center rounded-lg border border-blue-200 bg-white p-3 transition-colors hover:border-blue-300"
                >
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 transition-colors group-hover:bg-blue-200">
                    <svg
                      className="h-4 w-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Start Job Search
                    </p>
                    <p className="text-xs text-gray-600">
                      Find opportunities in the 209
                    </p>
                  </div>
                </Link>
                <Link
                  href="/alerts"
                  className="group flex items-center rounded-lg border border-green-200 bg-white p-3 transition-colors hover:border-green-300"
                >
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 transition-colors group-hover:bg-green-200">
                    <svg
                      className="h-4 w-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 17h5l-5 5v-5zM21 7H3a2 2 0 00-2 2v10a2 2 0 002 2h8"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Set Up Alerts
                    </p>
                    <p className="text-xs text-gray-600">
                      Get notified of new jobs
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
