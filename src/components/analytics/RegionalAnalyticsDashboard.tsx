import React, { useState, useEffect } from '@/components/ui/card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';



  /**
 * Regional Analytics Dashboard
 * Dashboard for viewing PostHog analytics with regional insights
 */
'use client';
import {
  import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/card';
import {
  import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from '@/components/ui/card';
import {
  import {
  TrendingUp,
  Users,
  Search,
  MapPin,
  Briefcase,
  Eye,
  MousePointer,
  UserPlus,
  Calendar,
  Filter,
  Download
} from 'lucide-react';

interface AnalyticsData {
  pageViews: Array<{ date: string; views: number; region: string }>;
  jobSearches: Array<{ date: string; searches: number; region: string }>;
  jobViews: Array<{ date: string; views: number; region: string }>;
  userRegistrations: Array<{
    date: string;
    registrations: number;
    region: string;
  }>;
  regionalBreakdown: Array<{
    region: string;
    users: number;
    percentage: number;
  }>;
  topSearchTerms: Array<{ term: string; count: number; region: string }>;
  conversionFunnel: Array<{ step: string; count: number; percentage: number }>;
}

interface RegionalAnalyticsDashboardProps {
  className?: string;
}

const COLORS = ['#2d4a3e', '#F59E0B', '#0EA5E9', '#CA8A04', '#DC2626'];

const REGIONS = [
  { value: 'all', label: 'All Regions' },
  { value: '209', label: 'Central Valley (209)' },
  { value: '916', label: 'Sacramento Metro (916)' },
  { value: '510', label: 'East Bay (510)' },
  { value: 'norcal', label: 'Northern California' },
];

const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
];

export default function RegionalAnalyticsDashboard({
  className = '',
}: RegionalAnalyticsDashboardProps) {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedRegion, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would fetch from PostHog API
      // For now, we'll simulate the data structure
      const mockData: AnalyticsData = {
        pageViews: generatePageViewsData(timeRange),
        jobSearches: generateJobSearchesData(timeRange),
        jobViews: generateJobViewsData(timeRange),
        userRegistrations: generateUserRegistrationsData(timeRange),
        regionalBreakdown: [
          { region: '209', users: 1250, percentage: 35 },
          { region: '916', users: 980, percentage: 28 },
          { region: '510', users: 850, percentage: 24 },
          { region: 'norcal', users: 420, percentage: 13 },
        ],
        topSearchTerms: [
          { term: 'software engineer', count: 450, region: selectedRegion },
          { term: 'data analyst', count: 320, region: selectedRegion },
          { term: 'project manager', count: 280, region: selectedRegion },
          { term: 'sales representative', count: 240, region: selectedRegion },
          { term: 'customer service', count: 190, region: selectedRegion },
        ],
        conversionFunnel: [
          { step: 'Page Views', count: 10000, percentage: 100 },
          { step: 'Job Searches', count: 3500, percentage: 35 },
          { step: 'Job Views', count: 1800, percentage: 18 },
          { step: 'Applications', count: 450, percentage: 4.5 },
          { step: 'Registrations', count: 180, percentage: 1.8 },
        ],
      };

      setAnalyticsData(mockData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generatePageViewsData = (range: string) => {
    const days =
      range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const randomVariation = Math.random() * 0.4 + 0.8; // 80% to 120% of base
      const value = Math.floor(500 * randomVariation);

      data.push({
        date: date.toISOString().split('T')[0],
        views: value,
        region: selectedRegion,
      });
    }

    return data;
  };

  const generateJobSearchesData = (range: string) => {
    const days =
      range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const randomVariation = Math.random() * 0.4 + 0.8; // 80% to 120% of base
      const value = Math.floor(150 * randomVariation);

      data.push({
        date: date.toISOString().split('T')[0],
        searches: value,
        region: selectedRegion,
      });
    }

    return data;
  };

  const generateJobViewsData = (range: string) => {
    const days =
      range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const randomVariation = Math.random() * 0.4 + 0.8; // 80% to 120% of base
      const value = Math.floor(80 * randomVariation);

      data.push({
        date: date.toISOString().split('T')[0],
        views: value,
        region: selectedRegion,
      });
    }

    return data;
  };

  const generateUserRegistrationsData = (range: string) => {
    const days =
      range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const randomVariation = Math.random() * 0.4 + 0.8; // 80% to 120% of base
      const value = Math.floor(10 * randomVariation);

      data.push({
        date: date.toISOString().split('T')[0],
        registrations: value,
        region: selectedRegion,
      });
    }

    return data;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const calculateTotalMetric = (data: any[], key: string) => {
    return data.reduce((sum, item) => sum + (item[key] || 0), 0);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded bg-gray-200"></div>
            ))}
          </div>
          <div className="h-96 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-12 text-center ${className}`}>
        <div className="mb-4 text-red-600">{error}</div>
        <Button onClick={fetchAnalyticsData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Regional Analytics
          </h1>
          <p className="text-gray-600">
            PostHog insights for regional job board performance
          </p>
        </div>

        <div className="flex gap-3">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map(region => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Page Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData
                    ? formatNumber(
                        calculateTotalMetric(analyticsData.pageViews, 'views')
                      )
                    : '0'}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
            <p className="mt-2 text-xs text-green-600">
              ↗ +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Job Searches
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData
                    ? formatNumber(
                        calculateTotalMetric(
                          analyticsData.jobSearches,
                          'searches'
                        )
                      )
                    : '0'}
                </p>
              </div>
              <Search className="h-8 w-8 text-green-600" />
            </div>
            <p className="mt-2 text-xs text-green-600">
              ↗ +8% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Job Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData
                    ? formatNumber(
                        calculateTotalMetric(analyticsData.jobViews, 'views')
                      )
                    : '0'}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-purple-600" />
            </div>
            <p className="mt-2 text-xs text-green-600">
              ↗ +15% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData
                    ? formatNumber(
                        calculateTotalMetric(
                          analyticsData.userRegistrations,
                          'registrations'
                        )
                      )
                    : '0'}
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-orange-600" />
            </div>
            <p className="mt-2 text-xs text-green-600">
              ↗ +22% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="regional">Regional Breakdown</TabsTrigger>
          <TabsTrigger value="search">Search Analytics</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Views Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData?.pageViews || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#2d4a3e"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Searches</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData?.jobSearches || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="searches" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analyticsData?.userRegistrations || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="registrations"
                      stroke="#F59E0B"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="regional">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.regionalBreakdown || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ region, percentage }) =>
                        `${region} (${percentage}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="users"
                    >
                      {analyticsData?.regionalBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.regionalBreakdown.map((region, index) => (
                    <div
                      key={region.region}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="font-medium">{region.region}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatNumber(region.users)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {region.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Top Search Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData?.topSearchTerms.map((term, index) => (
                  <div
                    key={term.term}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{term.term}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatNumber(term.count)}
                      </div>
                      <div className="text-sm text-gray-500">searches</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.conversionFunnel.map((step, index) => (
                  <div key={step.step} className="relative">
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                          {index + 1}
                        </div>
                        <span className="font-medium">{step.step}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatNumber(step.count)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {step.percentage}%
                        </div>
                      </div>
                    </div>
                    {index < analyticsData.conversionFunnel.length - 1 && (
                      <div className="ml-8 mt-2 h-4 w-px bg-gray-300"></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
