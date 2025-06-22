// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import { redirect } from 'next/navigation';
import authOptions from '../../../api/auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Clock, 
  MousePointer,
  Eye,
  MessageSquare,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity
} from 'lucide-react';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export const metadata = {
  title: 'User Engagement Analytics | Admin Dashboard',
  description: 'Track user engagement and platform usage metrics',
};

export default async function UserEngagementPage() {
  // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/analytics/engagement');
  }

  const userRole = session!.user?.role || 'guest';
  // TODO: Replace with Clerk permissions
  // if (!hasPermission(userRole, Permission.MANAGE_ADS)) {
  //   redirect('/admin');
  // }

  // Mock engagement data (replace with real analytics)
  const engagementData = {
    overview: {
      dailyActiveUsers: 1247,
      weeklyActiveUsers: 3892,
      monthlyActiveUsers: 12456,
      averageSessionDuration: 8.5, // minutes
      bounceRate: 23.4, // percentage
      pageViewsPerSession: 4.2,
      returnUserRate: 67.8 // percentage
    },
    userBehavior: {
      topPages: [
        { page: '/jobs', views: 15420, avgTime: '3:45', bounceRate: 18.2 },
        { page: '/jobsgpt', views: 8950, avgTime: '6:12', bounceRate: 12.5 },
        { page: '/profile', views: 5670, avgTime: '2:30', bounceRate: 35.8 },
        { page: '/employers', views: 3240, avgTime: '4:15', bounceRate: 28.9 },
        { page: '/contact', views: 1890, avgTime: '1:45', bounceRate: 45.2 }
      ],
      userActions: [
        { action: 'Job Search', count: 2340, trend: 'up', change: 12.5 },
        { action: 'JobsGPT Chat', count: 1890, trend: 'up', change: 23.8 },
        { action: 'Job Application', count: 567, trend: 'up', change: 8.9 },
        { action: 'Profile Update', count: 445, trend: 'down', change: -5.2 },
        { action: 'Job Save', count: 1234, trend: 'up', change: 15.7 }
      ]
    },
    demographics: {
      ageGroups: [
        { range: '18-24', users: 2340, percentage: 18.8 },
        { range: '25-34', users: 4567, percentage: 36.7 },
        { range: '35-44', users: 3456, percentage: 27.8 },
        { range: '45-54', users: 1678, percentage: 13.5 },
        { range: '55+', users: 415, percentage: 3.3 }
      ],
      locations: [
        { city: 'Stockton', users: 3456, percentage: 27.8 },
        { city: 'Modesto', users: 2890, percentage: 23.2 },
        { city: 'Fresno', users: 2234, percentage: 17.9 },
        { city: 'Merced', users: 1567, percentage: 12.6 },
        { city: 'Tracy', users: 1234, percentage: 9.9 },
        { city: 'Other 209 Areas', users: 1075, percentage: 8.6 }
      ]
    },
    timeBasedMetrics: {
      hourlyActivity: [
        { hour: '6 AM', activity: 45 },
        { hour: '7 AM', activity: 89 },
        { hour: '8 AM', activity: 156 },
        { hour: '9 AM', activity: 234 },
        { hour: '10 AM', activity: 289 },
        { hour: '11 AM', activity: 312 },
        { hour: '12 PM', activity: 345 },
        { hour: '1 PM', activity: 298 },
        { hour: '2 PM', activity: 267 },
        { hour: '3 PM', activity: 234 },
        { hour: '4 PM', activity: 198 },
        { hour: '5 PM', activity: 167 },
        { hour: '6 PM', activity: 134 },
        { hour: '7 PM', activity: 98 },
        { hour: '8 PM', activity: 67 },
        { hour: '9 PM', activity: 45 }
      ]
    }
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Engagement Analytics</h1>
        <p className="text-muted-foreground">
          Track user behavior, engagement patterns, and platform usage metrics
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementData.overview.dailyActiveUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+8.2%</span>
              <span className="ml-1">from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(engagementData.overview.averageSessionDuration)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+12.5%</span>
              <span className="ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementData.overview.bounceRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">-3.1%</span>
              <span className="ml-1">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Return User Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementData.overview.returnUserRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+5.7%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementData.overview.weeklyActiveUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((engagementData.overview.dailyActiveUsers / engagementData.overview.weeklyActiveUsers) * 100).toFixed(1)}% daily/weekly ratio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementData.overview.monthlyActiveUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((engagementData.overview.weeklyActiveUsers / engagementData.overview.monthlyActiveUsers) * 100).toFixed(1)}% weekly/monthly ratio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages per Session</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementData.overview.pageViewsPerSession}</div>
            <p className="text-xs text-muted-foreground">
              Average page views per user session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Pages by Engagement</CardTitle>
          <CardDescription>Most visited pages and their engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {engagementData.userBehavior.topPages.map((page, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{page.page}</h3>
                  <Badge variant="outline" className={page.bounceRate < 25 ? 'bg-green-50 text-green-700' : page.bounceRate < 40 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}>
                    {page.bounceRate}% bounce rate
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{page.views.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Page Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{page.avgTime}</div>
                    <div className="text-xs text-muted-foreground">Avg Time on Page</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{page.bounceRate}%</div>
                    <div className="text-xs text-muted-foreground">Bounce Rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Actions */}
      <Card>
        <CardHeader>
          <CardTitle>User Actions & Trends</CardTitle>
          <CardDescription>Most common user actions and their trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {engagementData.userBehavior.userActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {action.action === 'Job Search' && <Briefcase className="h-5 w-5 text-blue-600" />}
                  {action.action === 'JobsGPT Chat' && <MessageSquare className="h-5 w-5 text-purple-600" />}
                  {action.action === 'Job Application' && <Users className="h-5 w-5 text-green-600" />}
                  {action.action === 'Profile Update' && <Users className="h-5 w-5 text-orange-600" />}
                  {action.action === 'Job Save' && <Eye className="h-5 w-5 text-indigo-600" />}
                  <div>
                    <h3 className="font-medium">{action.action}</h3>
                    <p className="text-sm text-muted-foreground">{action.count.toLocaleString()} actions this month</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {action.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${action.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {action.trend === 'up' ? '+' : ''}{action.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demographics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Age Demographics</CardTitle>
            <CardDescription>User distribution by age groups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {engagementData.demographics.ageGroups.map((group, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{group.range}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${group.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground w-12">{group.percentage}%</span>
                    <span className="text-sm font-medium w-16">{group.users.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>User distribution across 209 area cities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {engagementData.demographics.locations.map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{location.city}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${location.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground w-12">{location.percentage}%</span>
                    <span className="text-sm font-medium w-16">{location.users.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
