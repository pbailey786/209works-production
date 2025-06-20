import { useState, useEffect } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

'use client';

  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  DollarSign,
  Users,
  Calendar,
  Target,
  ArrowLeft,
  Download,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface AdAnalyticsProps {
  adId: string;
}

interface AnalyticsData {
  ad: {
    id: string;
    title: string;
    businessName: string;
    imageUrl: string;
    targetUrl: string;
    zipCodes: string;
    startDate: string;
    endDate: string;
    status: string;
    budget?: number;
    spent?: number;
  };
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
    costPerClick: number;
    costPerConversion: number;
    revenue: number;
    roi: number;
  };
  dailyMetrics: Array<{
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
  }>;
  demographics: {
    ageGroups: Array<{ range: string; percentage: number }>;
    locations: Array<{ location: string; clicks: number; percentage: number }>;
    devices: Array<{ device: string; percentage: number }>;
  };
  performance: {
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    bestPerformingDay: string;
    recommendations: string[];
  };
}

export default function AdAnalyticsDashboard({ adId }: AdAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [adId, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/ads/${adId}/analytics?range=${dateRange}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch(
        `/api/ads/${adId}/analytics/export?range=${dateRange}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ad-analytics-${adId}-${dateRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Error Loading Analytics
          </h3>
          <p className="mb-4 text-gray-500">
            {error || 'Failed to load analytics data'}
          </p>
          <Button onClick={fetchAnalytics}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/ads"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Ads
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ad Analytics</h1>
            <p className="text-muted-foreground">{data.ad.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={fetchAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Ad Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Advertisement Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {data.ad.imageUrl ? (
                <img
                  src={data.ad.imageUrl}
                  alt={data.ad.title}
                  className="h-20 w-20 rounded object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded bg-gray-200">
                  <BarChart3 className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{data.ad.title}</h3>
                  <p className="text-gray-600">{data.ad.businessName}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Target: {data.ad.zipCodes}
                  </p>
                </div>
                <Badge className={getStatusColor(data.ad.status)}>
                  {data.ad.status}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-500">Campaign Period</p>
                  <p className="font-medium">
                    {new Date(data.ad.startDate).toLocaleDateString()} -{' '}
                    {new Date(data.ad.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="font-medium">
                    {formatCurrency(data.ad.budget || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Spent</p>
                  <p className="font-medium">
                    {formatCurrency(data.ad.spent || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Remaining</p>
                  <p className="font-medium">
                    {formatCurrency(
                      (data.ad.budget || 0) - (data.ad.spent || 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Impressions</p>
                <p className="text-2xl font-bold">
                  {formatNumber(data.metrics.impressions)}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center">
              {data.performance.trend === 'up' ? (
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm ${data.performance.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatPercentage(data.performance.changePercent)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clicks</p>
                <p className="text-2xl font-bold">
                  {formatNumber(data.metrics.clicks)}
                </p>
              </div>
              <MousePointer className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-600">
                CTR: {formatPercentage(data.metrics.ctr)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversions</p>
                <p className="text-2xl font-bold">
                  {formatNumber(data.metrics.conversions)}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-600">
                Rate: {formatPercentage(data.metrics.conversionRate)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.metrics.revenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-600">
                ROI: {formatPercentage(data.metrics.roi)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Performance</CardTitle>
              <CardDescription>
                Track your ad performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center text-gray-500">
                {/* This would be replaced with an actual chart component */}
                <div className="text-center">
                  <BarChart3 className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                  <p>Performance chart would be displayed here</p>
                  <p className="text-sm">
                    Integration with charting library needed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cost Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost Per Click</span>
                  <span className="font-medium">
                    {formatCurrency(data.metrics.costPerClick)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost Per Conversion</span>
                  <span className="font-medium">
                    {formatCurrency(data.metrics.costPerConversion)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Spent</span>
                  <span className="font-medium">
                    {formatCurrency(data.ad.spent || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Best Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Best performing day:</p>
                  <p className="font-medium">
                    {data.performance.bestPerformingDay}
                  </p>
                  <p className="mt-4 text-sm text-gray-600">Current trend:</p>
                  <div className="flex items-center">
                    {data.performance.trend === 'up' ? (
                      <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        data.performance.trend === 'up'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {data.performance.trend === 'up'
                        ? 'Improving'
                        : 'Declining'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Age Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.demographics.ageGroups.map((group, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{group.range}</span>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-16 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${group.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {formatPercentage(group.percentage)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.demographics.locations.map((location, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{location.location}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatNumber(location.clicks)} clicks
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatPercentage(location.percentage)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.demographics.devices.map((device, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{device.device}</span>
                      <span className="text-sm font-medium">
                        {formatPercentage(device.percentage)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>
                AI-powered suggestions to improve your ad performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.performance.recommendations.map(
                  (recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 rounded-lg bg-blue-50 p-4"
                    >
                      <AlertCircle className="mt-0.5 h-5 w-5 text-blue-500" />
                      <p className="text-sm text-blue-900">{recommendation}</p>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
