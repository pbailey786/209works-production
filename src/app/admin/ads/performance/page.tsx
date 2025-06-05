import { getServerSession } from 'next-auth/next';
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
import type { Session } from 'next-auth';

export const metadata = {
  title: 'Ad Performance | Admin Dashboard',
  description: 'View advertising performance metrics and analytics',
};

export default async function AdPerformancePage() {
  const session = await getServerSession(authOptions) as Session | null;

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/ads/performance');
  }

  const userRole = session!.user?.role || 'guest';
  if (!hasPermission(userRole, Permission.VIEW_AD_PERFORMANCE)) {
    redirect('/admin');
  }

  // Mock performance data (replace with real analytics)
  const performanceData = {
    overview: {
      totalSpend: 1177.50,
      totalImpressions: 30040,
      totalClicks: 1571,
      totalConversions: 146,
      averageCTR: 5.23,
      averageCPC: 0.75,
      conversionRate: 9.29,
      roas: 3.45 // Return on Ad Spend
    },
    dailyMetrics: [
      { date: '2024-01-15', impressions: 2150, clicks: 112, spend: 84.50, conversions: 8 },
      { date: '2024-01-14', impressions: 1980, clicks: 98, spend: 73.25, conversions: 6 },
      { date: '2024-01-13', impressions: 2340, clicks: 125, spend: 93.75, conversions: 12 },
      { date: '2024-01-12', impressions: 1850, clicks: 89, spend: 66.75, conversions: 5 },
      { date: '2024-01-11', impressions: 2100, clicks: 108, spend: 81.00, conversions: 9 },
      { date: '2024-01-10', impressions: 1920, clicks: 95, spend: 71.25, conversions: 7 },
      { date: '2024-01-09', impressions: 2200, clicks: 118, spend: 88.50, conversions: 11 }
    ],
    topPerformingCampaigns: [
      { name: 'JobsGPT AI Feature Promotion', impressions: 5670, clicks: 445, ctr: 7.85, spend: 156.75, conversions: 89 },
      { name: 'Featured Job Placements - Q1 2024', impressions: 15420, clicks: 892, ctr: 5.78, spend: 342.50, conversions: 45 },
      { name: 'Employer Acquisition Campaign', impressions: 8950, clicks: 234, ctr: 2.61, spend: 678.25, conversions: 12 }
    ],
    audienceInsights: [
      { segment: 'Job Seekers 25-34', impressions: 12500, clicks: 675, conversions: 78, spend: 485.25 },
      { segment: 'HR Managers', impressions: 8200, clicks: 234, conversions: 28, spend: 312.50 },
      { segment: 'Business Owners', impressions: 6800, clicks: 445, conversions: 25, spend: 245.75 },
      { segment: 'Recent Graduates', impressions: 2540, clicks: 217, conversions: 15, spend: 134.00 }
    ]
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
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+12.5%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.overview.totalImpressions.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+8.3%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(performanceData.overview.averageCTR)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+0.8%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(performanceData.overview.conversionRate)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+1.2%</span>
              <span className="ml-1">from last month</span>
            </div>
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
              {formatCurrency(performanceData.overview.averageCPC)} avg CPC
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
              {formatCurrency(performanceData.overview.totalSpend / performanceData.overview.totalConversions)} cost per conversion
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
              Revenue per dollar spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 paused campaigns
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
          <div className="space-y-4">
            {performanceData.topPerformingCampaigns.map((campaign, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{campaign.name}</h3>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    #{index + 1} performer
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{campaign.impressions.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Impressions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{campaign.clicks}</div>
                    <div className="text-xs text-muted-foreground">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{formatPercentage(campaign.ctr)}</div>
                    <div className="text-xs text-muted-foreground">CTR</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">{campaign.conversions}</div>
                    <div className="text-xs text-muted-foreground">Conversions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{formatCurrency(campaign.spend)}</div>
                    <div className="text-xs text-muted-foreground">Spend</div>
                  </div>
                </div>
              </div>
            ))}
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
          <div className="space-y-4">
            {performanceData.audienceInsights.map((audience, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{audience.segment}</h3>
                  <Badge variant="outline">
                    {formatPercentage((audience.clicks / audience.impressions) * 100)} CTR
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{audience.impressions.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Impressions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{audience.clicks}</div>
                    <div className="text-xs text-muted-foreground">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{audience.conversions}</div>
                    <div className="text-xs text-muted-foreground">Conversions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{formatCurrency(audience.spend)}</div>
                    <div className="text-xs text-muted-foreground">Spend</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ad Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(performanceData.overview.totalSpend)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+12.5%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.overview.totalImpressions.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+8.3%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(performanceData.overview.averageCTR)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+0.8%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(performanceData.overview.conversionRate)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">+1.2%</span>
              <span className="ml-1">from last month</span>
            </div>
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
              {formatCurrency(performanceData.overview.averageCPC)} avg CPC
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
              {formatCurrency(performanceData.overview.totalSpend / performanceData.overview.totalConversions)} cost per conversion
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
              Revenue per dollar spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 paused campaigns
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
          <div className="space-y-4">
            {performanceData.topPerformingCampaigns.map((campaign, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{campaign.name}</h3>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    #{index + 1} performer
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{campaign.impressions.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Impressions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{campaign.clicks}</div>
                    <div className="text-xs text-muted-foreground">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{formatPercentage(campaign.ctr)}</div>
                    <div className="text-xs text-muted-foreground">CTR</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">{campaign.conversions}</div>
                    <div className="text-xs text-muted-foreground">Conversions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{formatCurrency(campaign.spend)}</div>
                    <div className="text-xs text-muted-foreground">Spend</div>
                  </div>
                </div>
              </div>
            ))}
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
          <div className="space-y-4">
            {performanceData.audienceInsights.map((audience, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{audience.segment}</h3>
                  <Badge variant="outline">
                    {formatPercentage((audience.clicks / audience.impressions) * 100)} CTR
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{audience.impressions.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Impressions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{audience.clicks}</div>
                    <div className="text-xs text-muted-foreground">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{audience.conversions}</div>
                    <div className="text-xs text-muted-foreground">Conversions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{formatCurrency(audience.spend)}</div>
                    <div className="text-xs text-muted-foreground">Spend</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
