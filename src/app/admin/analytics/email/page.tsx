// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import { redirect } from 'next/navigation';
import authOptions from '../../../api/auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  TrendingUp, 
  TrendingDown,
  Users,
  MousePointer,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Download
} from 'lucide-react';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export const metadata = {
  title: 'Email Analytics | Admin Dashboard',
  description: 'Track email campaign performance and engagement metrics',
};

export default async function EmailAnalyticsPage() {
  // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/analytics/email');
  }

  const userRole = session!.user?.role || 'guest';
  // TODO: Replace with Clerk permissions
  // if (!hasPermission(userRole, Permission.MANAGE_ADS)) {
  //   redirect('/admin');
  // }

  // Mock email analytics data (replace with real analytics)
  const emailData = {
    overview: {
      totalEmailsSent: 25420,
      deliveryRate: 98.2,
      openRate: 24.5,
      clickRate: 3.8,
      unsubscribeRate: 0.5,
      bounceRate: 1.8,
      spamComplaintRate: 0.1,
      avgTimeToOpen: 4.2 // hours
    },
    campaigns: [
      {
        id: 1,
        name: 'Weekly Job Alerts',
        type: 'job_alerts',
        sent: 8950,
        delivered: 8789,
        opened: 2156,
        clicked: 342,
        unsubscribed: 23,
        bounced: 161,
        sentDate: '2024-01-15T09:00:00Z',
        status: 'completed'
      },
      {
        id: 2,
        name: 'New Employer Welcome Series',
        type: 'onboarding',
        sent: 145,
        delivered: 143,
        opened: 89,
        clicked: 34,
        unsubscribed: 2,
        bounced: 2,
        sentDate: '2024-01-14T10:30:00Z',
        status: 'completed'
      },
      {
        id: 3,
        name: 'JobsGPT Feature Announcement',
        type: 'product_update',
        sent: 12456,
        delivered: 12234,
        opened: 3567,
        clicked: 567,
        unsubscribed: 45,
        bounced: 222,
        sentDate: '2024-01-12T14:00:00Z',
        status: 'completed'
      },
      {
        id: 4,
        name: 'Monthly Platform Newsletter',
        type: 'newsletter',
        sent: 3869,
        delivered: 3798,
        opened: 1234,
        clicked: 189,
        unsubscribed: 12,
        bounced: 71,
        sentDate: '2024-01-10T08:00:00Z',
        status: 'completed'
      }
    ],
    segmentPerformance: [
      {
        segment: 'Active Job Seekers',
        subscribers: 8950,
        openRate: 32.4,
        clickRate: 5.2,
        unsubscribeRate: 0.3,
        avgEngagement: 'High'
      },
      {
        segment: 'New Users (< 30 days)',
        subscribers: 2340,
        openRate: 28.7,
        clickRate: 4.8,
        unsubscribeRate: 0.8,
        avgEngagement: 'Medium'
      },
      {
        segment: 'Employers',
        subscribers: 456,
        openRate: 45.2,
        clickRate: 8.9,
        unsubscribeRate: 0.2,
        avgEngagement: 'High'
      },
      {
        segment: 'Inactive Users (> 90 days)',
        subscribers: 3456,
        openRate: 12.3,
        clickRate: 1.2,
        unsubscribeRate: 1.8,
        avgEngagement: 'Low'
      }
    ],
    topPerformingSubjects: [
      {
        subject: '🚀 New AI-Powered Job Search Feature!',
        openRate: 42.3,
        clickRate: 8.9,
        sent: 12456
      },
      {
        subject: '💼 5 New Jobs in Your Area',
        openRate: 38.7,
        clickRate: 6.2,
        sent: 8950
      },
      {
        subject: 'Welcome to 209 Works - Your Local Job Platform',
        openRate: 35.4,
        clickRate: 12.1,
        sent: 145
      },
      {
        subject: '📊 Your Monthly Job Market Update',
        openRate: 31.9,
        clickRate: 4.8,
        sent: 3869
      }
    ],
    deviceBreakdown: [
      { device: 'Mobile', percentage: 68.2, opens: 17345 },
      { device: 'Desktop', percentage: 28.4, opens: 7234 },
      { device: 'Tablet', percentage: 3.4, opens: 865 }
    ]
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const calculateRate = (numerator: number, denominator: number) => 
    denominator > 0 ? ((numerator / denominator) * 100).toFixed(1) : '0.0';

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'High': return 'bg-green-50 text-green-700';
      case 'Medium': return 'bg-yellow-50 text-yellow-700';
      case 'Low': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700';
      case 'sending': return 'bg-blue-50 text-blue-700';
      case 'scheduled': return 'bg-yellow-50 text-yellow-700';
      case 'draft': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Analytics</h1>
          <p className="text-muted-foreground">
            Track email campaign performance and subscriber engagement
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailData.overview.totalEmailsSent.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+15.2%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(emailData.overview.deliveryRate)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+0.3%</span>
              <span className="ml-1">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(emailData.overview.openRate)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+2.1%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(emailData.overview.clickRate)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+0.8%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribe Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(emailData.overview.unsubscribeRate)}</div>
            <p className="text-xs text-muted-foreground">
              Industry avg: 0.8%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(emailData.overview.bounceRate)}</div>
            <p className="text-xs text-muted-foreground">
              Industry avg: 2.5%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spam Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(emailData.overview.spamComplaintRate)}</div>
            <p className="text-xs text-muted-foreground">
              Industry avg: 0.3%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Open</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailData.overview.avgTimeToOpen}h</div>
            <p className="text-xs text-muted-foreground">
              Average time to first open
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Campaigns</CardTitle>
          <CardDescription>Performance metrics for recent email campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailData.campaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Sent {new Date(campaign.sentDate).toLocaleDateString()} • {campaign.type.replace('_', ' ')}
                    </p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{campaign.sent.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{calculateRate(campaign.delivered, campaign.sent)}%</div>
                    <div className="text-xs text-muted-foreground">Delivered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{calculateRate(campaign.opened, campaign.delivered)}%</div>
                    <div className="text-xs text-muted-foreground">Opened</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">{calculateRate(campaign.clicked, campaign.opened)}%</div>
                    <div className="text-xs text-muted-foreground">Clicked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{calculateRate(campaign.bounced, campaign.sent)}%</div>
                    <div className="text-xs text-muted-foreground">Bounced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-600">{calculateRate(campaign.unsubscribed, campaign.delivered)}%</div>
                    <div className="text-xs text-muted-foreground">Unsubscribed</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Segment Performance & Top Subjects */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Segment Performance</CardTitle>
            <CardDescription>Email performance by subscriber segments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emailData.segmentPerformance.map((segment, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{segment.segment}</h3>
                    <Badge variant="outline" className={getEngagementColor(segment.avgEngagement)}>
                      {segment.avgEngagement}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{segment.subscribers.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Subscribers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{formatPercentage(segment.openRate)}</div>
                      <div className="text-xs text-muted-foreground">Open Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{formatPercentage(segment.clickRate)}</div>
                      <div className="text-xs text-muted-foreground">Click Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{formatPercentage(segment.unsubscribeRate)}</div>
                      <div className="text-xs text-muted-foreground">Unsub Rate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Subject Lines</CardTitle>
            <CardDescription>Subject lines with highest engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emailData.topPerformingSubjects.map((subject, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <h3 className="font-medium text-sm mb-2">"{subject.subject}"</h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{subject.sent.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{formatPercentage(subject.openRate)}</div>
                      <div className="text-xs text-muted-foreground">Open Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-purple-600">{formatPercentage(subject.clickRate)}</div>
                      <div className="text-xs text-muted-foreground">Click Rate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Device Breakdown</CardTitle>
          <CardDescription>Email opens by device type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {emailData.deviceBreakdown.map((device, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatPercentage(device.percentage)}</div>
                <div className="text-sm font-medium">{device.device}</div>
                <div className="text-xs text-muted-foreground">{device.opens.toLocaleString()} opens</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
