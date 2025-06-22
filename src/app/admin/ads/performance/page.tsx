// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import { redirect } from 'next/navigation';
import authOptions from '../../../api/auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  MousePointer,
  Target,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export const metadata = {
  title: 'Ad Performance | Admin Dashboard',
  description: 'View advertising performance metrics and analytics',
};

export default async function AdPerformancePage() {
  // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/ads/performance');
  }

  const userRole = session!.user?.role || 'guest';
  // TODO: Replace with Clerk permissions
  // if (!hasPermission(userRole, Permission.MANAGE_ADS)) {
  //   redirect('/admin');
  // }

  // Real performance data (currently no advertising campaigns active)
  const performanceData = {
    overview: {
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      averageCTR: 0,
      averageCPC: 0,
      conversionRate: 0,
      roas: 0 // Return on Ad Spend
    },
    dailyMetrics: [],
    topPerformingCampaigns: [],
    audienceInsights: []
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ad Performance</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and performance metrics for all campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ad Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(performanceData.overview.totalSpend)}</div>
            <p className="text-xs text-muted-foreground">
              No advertising campaigns active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.overview.totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              No ad impressions yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(performanceData.overview.averageCTR)}</div>
            <p className="text-xs text-muted-foreground">
              No click data available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(performanceData.overview.conversionRate)}</div>
            <p className="text-xs text-muted-foreground">
              No conversion data yet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.overview.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              No clicks recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.overview.totalConversions}</div>
            <p className="text-xs text-muted-foreground">
              No conversions tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Return on Ad Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.overview.roas.toFixed(2)}x</div>
            <p className="text-xs text-muted-foreground">
              No revenue data available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No campaigns created yet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
          <CardDescription>Campaigns ranked by conversion performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns Yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first advertising campaign to start tracking performance metrics.
            </p>
            <Button>Create Campaign</Button>
          </div>
        </CardContent>
      </Card>

      {/* Audience Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Audience Performance</CardTitle>
          <CardDescription>Performance breakdown by audience segments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Audience Data</h3>
            <p className="text-gray-500 mb-4">
              Audience insights will appear here once you start running advertising campaigns.
            </p>
            <Button variant="outline">Learn About Targeting</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
