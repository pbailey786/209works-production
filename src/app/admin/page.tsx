import { Metadata } from 'next';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../api/auth/authOptions';
import { prisma } from '../api/auth/prisma';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building2,
  Briefcase,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Award,
  BarChart3,
  UserCheck,
  Crown,
  Target,
  MessageSquare,
  Search,
} from 'lucide-react';
import Link from 'next/link';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export const metadata: Metadata = {
  title: 'Admin Dashboard | 209 Works',
  description: 'Administrative dashboard for managing the 209 Works platform.',
};

// Force dynamic rendering for admin dashboard
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export default async function AdminDashboard() {
  try {
    // Get session for user info
    // TODO: Replace with Clerk
    const session = { user: { role: "admin", name: "Admin User", email: "admin@209.works" } }; // Mock session

    // Check if we're in build mode or if database is not available
    if (!process.env.DATABASE_URL) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mb-4">
              Database connection not available. Please configure environment variables.
            </p>
            <p className="text-sm text-gray-500">
              This page requires a DATABASE_URL environment variable to be set.
            </p>
          </div>
        </div>
      );
    }

    // Date calculations for analytics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch real analytics data with error handling
  let totalUsers = 0;
  let newUsersThisMonth = 0;
  let newUsersLastMonth = 0;
  let totalEmployers = 0;
  let activeEmployers = 0;
  let totalJobs = 0;
  let activeJobs = 0;
  let newJobsThisMonth = 0;
  let totalApplications = 0;
  let applicationsThisMonth = 0;
  let totalChatSessions = 0;
  let chatSessionsThisWeek = 0;
  let premiumUsers = 0;
  let recentActivity: any[] = [];
  let dailyJobPosts: any[] = [];
  let topJobsByApplications: any[] = [];
  let topJobCategories: any[] = [];
  let activeEmployersDetailed: any[] = [];

  try {
    const results: any[] = await Promise.all([
    // User metrics
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      }
    }),

    // Employer metrics
    prisma.user.count({ where: { role: 'employer' } }),
    prisma.user.count({
      where: {
        role: 'employer',
        lastLoginAt: { gte: thirtyDaysAgo }
      }
    }),

    // Job metrics
    prisma.job.count(),
    prisma.job.count({ where: { status: 'active' } }),
    prisma.job.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

    // Application metrics
    prisma.jobApplication.count(),
    prisma.jobApplication.count({ where: { appliedAt: { gte: thirtyDaysAgo } } }),

    // Chat metrics (using ChatAnalytics)
    prisma.chatAnalytics.count(),
    prisma.chatAnalytics.count({ where: { createdAt: { gte: sevenDaysAgo } } }),

    // Premium users (assuming there's a subscription field)
    prisma.user.count({ where: { role: 'jobseeker' } }), // Placeholder for premium logic

    // Recent activity
    prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),

    // Enhanced metrics for Phase 1
    // Daily job posts (last 7 days)
    prisma.$queryRaw`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM Job
      WHERE createdAt >= ${sevenDaysAgo}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `,

    // Applications per job ratio
    prisma.$queryRaw`
      SELECT
        j.id,
        j.title,
        j.company,
        COUNT(ja.id) as application_count
      FROM Job j
      LEFT JOIN JobApplication ja ON j.id = ja.jobId
      WHERE j.createdAt >= ${thirtyDaysAgo}
      GROUP BY j.id, j.title, j.company
      ORDER BY application_count DESC
      LIMIT 10
    `,

    // Top job categories (using categories array)
    prisma.$queryRaw`
      SELECT
        UNNEST(categories) as category,
        COUNT(*) as count
      FROM Job
      WHERE createdAt >= ${thirtyDaysAgo}
      AND array_length(categories, 1) > 0
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `,

    // Active employers (posted jobs in last 30 days)
    prisma.$queryRaw`
      SELECT
        u.id,
        u.name,
        u.email,
        COUNT(j.id) as job_count,
        MAX(j.createdAt) as last_job_posted
      FROM User u
      INNER JOIN Job j ON u.id = j.employerId
      WHERE j.createdAt >= ${thirtyDaysAgo}
      AND u.role = 'employer'
      GROUP BY u.id, u.name, u.email
      ORDER BY job_count DESC
      LIMIT 10
    `,
    ]);

    // Assign results to variables
    totalUsers = results[0];
    newUsersThisMonth = results[1];
    newUsersLastMonth = results[2];
    totalEmployers = results[3];
    activeEmployers = results[4];
    totalJobs = results[5];
    activeJobs = results[6];
    newJobsThisMonth = results[7];
    totalApplications = results[8];
    applicationsThisMonth = results[9];
    totalChatSessions = results[10];
    chatSessionsThisWeek = results[11];
    premiumUsers = results[12];
    recentActivity = results[13];
    dailyJobPosts = results[14];
    topJobsByApplications = results[15];
    topJobCategories = results[16];
    activeEmployersDetailed = results[17];
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    // Use default values if database queries fail
  }

  // Calculate growth percentages
  const userGrowth = newUsersLastMonth > 0
    ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of 209 Works platform performance and key metrics
          </p>
          <p className="text-sm text-gray-500">
            Welcome back, {session?.user?.name || session?.user?.email}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {userGrowth >= 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span className={userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {userGrowth >= 0 ? '+' : ''}{userGrowth.toFixed(1)}%
                </span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Employers
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEmployers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {totalEmployers.toLocaleString()} total employers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeJobs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {totalJobs.toLocaleString()} total jobs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                JobsGPT Sessions
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalChatSessions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-blue-600">+{chatSessionsThisWeek}</span> this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Analytics - Phase 1 */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Job Posts</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Array.isArray(dailyJobPosts) && dailyJobPosts.length > 0
                  ? (dailyJobPosts as any[]).reduce((sum, day) => sum + Number(day.count), 0)
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 7 days total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Applications/Job</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalJobs > 0 ? (totalApplications / totalJobs).toFixed(1) : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Platform average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Category</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Array.isArray(topJobCategories) && topJobCategories.length > 0
                  ? (topJobCategories as any[])[0]?.category || 'N/A'
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {Array.isArray(topJobCategories) && topJobCategories.length > 0
                  ? `${(topJobCategories as any[])[0]?.count || 0} jobs`
                  : 'No data'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Array.isArray(activeEmployersDetailed) ? activeEmployersDetailed.length : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Posted jobs this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers Section */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Jobs by Applications</CardTitle>
              <CardDescription>Most popular job postings this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(topJobsByApplications) && topJobsByApplications.length > 0 ? (
                  (topJobsByApplications as any[]).slice(0, 5).map((job, index) => (
                    <div key={job.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.company}</p>
                      </div>
                      <Badge variant="outline">{job.application_count} apps</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No application data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Job Categories</CardTitle>
              <CardDescription>Most active job categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(topJobCategories) && topJobCategories.length > 0 ? (
                  (topJobCategories as any[]).slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.category}</span>
                      <Badge variant="outline">{category.count} jobs</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No category data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Platform Metrics */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Job Seekers
              </CardTitle>
              <CardDescription>Platform users looking for work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-3xl font-bold text-blue-600">
                {premiumUsers.toLocaleString()}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>New this month:</span>
                  <span className="font-medium">{newUsersThisMonth}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Growth rate:</span>
                  <span className="font-medium">
                    {userGrowth >= 0 ? '+' : ''}{userGrowth.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total registered:</span>
                  <span className="font-medium">{totalUsers.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                Employers
              </CardTitle>
              <CardDescription>Companies posting jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-3xl font-bold text-green-600">
                {totalEmployers.toLocaleString()}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active this month:</span>
                  <span className="font-medium">{activeEmployers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Posted jobs:</span>
                  <span className="font-medium">
                    {Array.isArray(activeEmployersDetailed) ? activeEmployersDetailed.length : 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total jobs:</span>
                  <span className="font-medium">{totalJobs.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                AI Interactions
              </CardTitle>
              <CardDescription>JobsGPT usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-3xl font-bold text-purple-600">
                {totalChatSessions.toLocaleString()}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>This week:</span>
                  <span className="font-medium">+{chatSessionsThisWeek}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Applications:</span>
                  <span className="font-medium">{totalApplications.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>This month:</span>
                  <span className="font-medium">{applicationsThisMonth}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        user.role === 'employer' ? 'bg-blue-500' :
                        user.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          New {user.role} signup
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.name || user.email?.split('@')[0]} joined
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.floor((now.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60))}h ago
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}

                {/* Add some static activity for demo */}
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">JobsGPT sessions</p>
                    <p className="text-xs text-gray-500">
                      +{chatSessionsThisWeek} new conversations this week
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">ongoing</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Job applications</p>
                    <p className="text-xs text-gray-500">
                      {applicationsThisMonth} applications this month
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">monthly</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/users">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Manage Users</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/analytics">
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Analytics</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/moderation">
                    <UserCheck className="h-6 w-6" />
                    <span className="text-sm">Moderation</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/reports">
                    <Target className="h-6 w-6" />
                    <span className="text-sm">Reports</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/settings">
                    <CheckCircle className="h-6 w-6" />
                    <span className="text-sm">Settings</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/health">
                    <TrendingUp className="h-6 w-6" />
                    <span className="text-sm">System Health</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/jobsgpt-analytics">
                    <MessageSquare className="h-6 w-6" />
                    <span className="text-sm">JobsGPT Analytics</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col items-center gap-2 p-4"
                >
                  <Link href="/admin/audit">
                    <Search className="h-6 w-6" />
                    <span className="text-sm">Audit Logs</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Platform Overview
            </CardTitle>
            <CardDescription>
              Current 209 Works platform statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalUsers}</div>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{activeJobs}</div>
                <p className="text-sm text-gray-600">Active Jobs</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{totalChatSessions}</div>
                <p className="text-sm text-gray-600">AI Conversations</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{totalApplications}</div>
                <p className="text-sm text-gray-600">Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error loading admin dashboard:', error);

    // Check if it's a database connection error
    const isDatabaseError = error instanceof Error && (
      error.message.includes('DATABASE_URL') ||
      error.message.includes('connect ECONNREFUSED') ||
      error.message.includes('Environment variable not found')
    );

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Admin Dashboard Error
          </h1>
          <p className="text-gray-600 mb-4">
            {isDatabaseError
              ? 'Database connection not available. Please configure your environment variables in Netlify.'
              : 'There was an error loading the dashboard.'
            }
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          {isDatabaseError && (
            <div className="text-left bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Required Environment Variables:</h3>
              <ul className="text-sm space-y-1">
                <li>• DATABASE_URL</li>
                <li>• NEXTAUTH_SECRET</li>
                <li>• NEXTAUTH_URL</li>
                <li>• NEXT_PUBLIC_APP_URL</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }
}
