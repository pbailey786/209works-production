import { getServerSession } from 'next-auth/next';
import authOptions from '../../api/auth/authOptions';
import { prisma } from '../../api/auth/prisma';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Mail,
  Search,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import AnalyticsExportButton from '@/components/admin/AnalyticsExportButton';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  // Get date ranges for analytics
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Fetch analytics data
  const [
    totalUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    totalJobs,
    newJobsThisMonth,
    newJobsLastMonth,
    totalApplications,
    applicationsThisMonth,
    applicationsLastMonth,
    totalAlerts,
    activeAlerts,
    userGrowthData,
    jobPostingData,
    applicationData,
  ] = await Promise.all([
    // User metrics
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    }),

    // Job metrics
    prisma.job.count(),
    prisma.job.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.job.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    }),

    // Application metrics
    prisma.jobApplication.count(),
    prisma.jobApplication.count({
      where: { appliedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.jobApplication.count({
      where: {
        appliedAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    }),

    // Alert metrics
    prisma.jobAlert.count(),
    prisma.jobAlert.count({ where: { isActive: true } }),

    // Growth data (simplified for demo)
    Promise.resolve([
      { date: '2024-01-01', users: 1200, jobs: 450, applications: 890 },
      { date: '2024-01-02', users: 1250, jobs: 465, applications: 920 },
      { date: '2024-01-03', users: 1280, jobs: 480, applications: 950 },
      { date: '2024-01-04', users: 1320, jobs: 495, applications: 980 },
      { date: '2024-01-05', users: 1350, jobs: 510, applications: 1010 },
    ]),

    // Job posting trends
    Promise.resolve([
      { category: 'Technology', count: 245, growth: 12.5 },
      { category: 'Healthcare', count: 189, growth: 8.3 },
      { category: 'Finance', count: 156, growth: -2.1 },
      { category: 'Education', count: 134, growth: 15.7 },
      { category: 'Retail', count: 98, growth: 5.2 },
    ]),

    // Application data
    Promise.resolve([
      { status: 'Applied', count: 1245, percentage: 45.2 },
      { status: 'Under Review', count: 892, percentage: 32.4 },
      { status: 'Interview', count: 456, percentage: 16.6 },
      { status: 'Hired', count: 167, percentage: 6.1 },
    ]),
  ]);

  // Calculate growth percentages
  const userGrowth =
    newUsersLastMonth > 0
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
      : 0;

  const jobGrowth =
    newJobsLastMonth > 0
      ? ((newJobsThisMonth - newJobsLastMonth) / newJobsLastMonth) * 100
      : 0;

  const applicationGrowth =
    applicationsLastMonth > 0
      ? ((applicationsThisMonth - applicationsLastMonth) /
          applicationsLastMonth) *
        100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-gray-600">
            Track platform performance and user engagement metrics
          </p>
        </div>

        <div className="flex space-x-3">
          <Select defaultValue="30d">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <AnalyticsExportButton type="overview" />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsers.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {userGrowth >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span
                className={userGrowth >= 0 ? 'text-green-500' : 'text-red-500'}
              >
                {Math.abs(userGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalJobs.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {jobGrowth >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span
                className={jobGrowth >= 0 ? 'text-green-500' : 'text-red-500'}
              >
                {Math.abs(jobGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalApplications.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {applicationGrowth >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span
                className={
                  applicationGrowth >= 0 ? 'text-green-500' : 'text-red-500'
                }
              >
                {Math.abs(applicationGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeAlerts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalAlerts.toLocaleString()} total alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="jobs">Job Analytics</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Growth Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Growth</CardTitle>
                <CardDescription>
                  User and job posting trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[300px] items-center justify-center rounded-lg bg-gray-50">
                  <div className="text-center">
                    <BarChart3 className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                    <p className="text-gray-500">Growth chart visualization</p>
                    <p className="text-sm text-gray-400">
                      Chart component would go here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Application Status Distribution</CardTitle>
                <CardDescription>
                  Current status of all job applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applicationData.map(item => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium">
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {item.count.toLocaleString()}
                        </span>
                        <Badge variant="outline">{item.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Registration Trends</CardTitle>
                <CardDescription>New user signups over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[300px] items-center justify-center rounded-lg bg-gray-50">
                  <div className="text-center">
                    <Users className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                    <p className="text-gray-500">User registration chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
                <CardDescription>
                  Breakdown by user type and location
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Job Seekers</span>
                    <Badge>75%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Employers</span>
                    <Badge>23%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Admins</span>
                    <Badge>2%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Posting Trends by Category</CardTitle>
              <CardDescription>
                Most popular job categories and their growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobPostingData.map(category => (
                  <div
                    key={category.category}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium">{category.category}</span>
                      <p className="text-sm text-gray-500">
                        {category.count} jobs
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {category.growth >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm ${category.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}
                      >
                        {category.growth > 0 ? '+' : ''}
                        {category.growth}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Search Analytics</CardTitle>
                <CardDescription>
                  Most popular search terms and filters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[300px] items-center justify-center rounded-lg bg-gray-50">
                  <div className="text-center">
                    <Search className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                    <p className="text-gray-500">
                      Search analytics visualization
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Performance</CardTitle>
                <CardDescription>
                  Alert emails and newsletter metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Open Rate</span>
                    <Badge variant="outline">24.5%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Click Rate</span>
                    <Badge variant="outline">3.2%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Unsubscribe Rate</span>
                    <Badge variant="outline">0.8%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
