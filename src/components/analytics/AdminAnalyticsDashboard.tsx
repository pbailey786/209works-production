'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminAnalytics {
  overview: {
    totalUsers: number;
    totalJobs: number;
    totalApplications: number;
    revenue: number;
  };
  userMetrics: {
    newUsers: number;
    activeUsers: number;
    userGrowthRate: number;
    usersByRole: Record<string, number>;
  };
  jobMetrics: {
    newJobs: number;
    activeJobs: number;
    jobGrowthRate: number;
    jobsByCategory: Record<string, number>;
  };
  platformMetrics: {
    searchQueries: number;
    chatSessions: number;
    applicationRate: number;
    conversionRate: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    revenueGrowth: number;
    averageRevenuePerUser: number;
    revenueBySource: Record<string, number>;
  };
}

interface AdminAnalyticsDashboardProps {
  className?: string;
}

export default function AdminAnalyticsDashboard({ className = '' }: AdminAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [region, setRegion] = useState('all');
  const { toast } = useToast();

  // Load analytics data
  useEffect(() => {
    loadAnalytics();
  }, [timeRange, region]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeRange,
        ...(region !== 'all' && { region })
      });

      const response = await fetch(`/api/analytics/dashboard?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        throw new Error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (value < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ];

  const regionOptions = [
    { value: 'all', label: 'All Regions' },
    { value: '209', label: '209 Area' },
    { value: '916', label: '916 Area' },
    { value: '510', label: '510 Area' },
    { value: '925', label: '925 Area' },
    { value: '559', label: '559 Area' },
  ];

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data</h3>
            <p className="text-gray-600 mb-4">Unable to load analytics data.</p>
            <Button onClick={loadAnalytics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Analytics</h2>
          <p className="text-gray-600">Comprehensive insights into platform performance and growth</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            {regionOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold">{analytics.overview.totalUsers.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                      <p className="text-3xl font-bold">{analytics.overview.totalJobs.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Briefcase className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Applications</p>
                      <p className="text-3xl font-bold">{analytics.overview.totalApplications.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Target className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Revenue</p>
                      <p className="text-3xl font-bold">{formatCurrency(analytics.overview.revenue)}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">New Users</h3>
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold mb-2">{analytics.userMetrics?.newUsers || 0}</div>
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon(analytics.userMetrics?.userGrowthRate || 0)}
                  <span className={getTrendColor(analytics.userMetrics?.userGrowthRate || 0)}>
                    {formatPercentage(analytics.userMetrics?.userGrowthRate || 0)}
                  </span>
                  <span className="text-gray-500">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Active Users</h3>
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold mb-2">{analytics.userMetrics?.activeUsers || 0}</div>
                <div className="text-sm text-gray-500">
                  {analytics.userMetrics?.activeUsers && analytics.overview.totalUsers ?
                    `${((analytics.userMetrics.activeUsers / analytics.overview.totalUsers) * 100).toFixed(1)}% of total users` :
                    'No data available'
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">User Distribution</h3>
                  <PieChart className="h-5 w-5 text-purple-500" />
                </div>
                <div className="space-y-2">
                  {analytics.userMetrics?.usersByRole ?
                    Object.entries(analytics.userMetrics.usersByRole).map(([role, count]) => (
                      <div key={role} className="flex justify-between text-sm">
                        <span className="capitalize">{role}s</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    )) :
                    <p className="text-sm text-gray-500">No role data available</p>
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          {/* Job Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">New Jobs</h3>
                  <Briefcase className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold mb-2">{analytics.jobMetrics?.newJobs || 0}</div>
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon(analytics.jobMetrics?.jobGrowthRate || 0)}
                  <span className={getTrendColor(analytics.jobMetrics?.jobGrowthRate || 0)}>
                    {formatPercentage(analytics.jobMetrics?.jobGrowthRate || 0)}
                  </span>
                  <span className="text-gray-500">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Active Jobs</h3>
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold mb-2">{analytics.jobMetrics?.activeJobs || 0}</div>
                <div className="text-sm text-gray-500">
                  {analytics.jobMetrics?.activeJobs && analytics.overview.totalJobs ?
                    `${((analytics.jobMetrics.activeJobs / analytics.overview.totalJobs) * 100).toFixed(1)}% of total jobs` :
                    'No data available'
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Job Categories</h3>
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                </div>
                <div className="space-y-2">
                  {analytics.jobMetrics?.jobsByCategory ?
                    Object.entries(analytics.jobMetrics.jobsByCategory).slice(0, 5).map(([category, count]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    )) :
                    <p className="text-sm text-gray-500">No category data available</p>
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platform" className="space-y-6">
          {/* Platform Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Search Queries</h3>
                  <Search className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">{analytics.platformMetrics?.searchQueries || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Chat Sessions</h3>
                  <MessageSquare className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold">{analytics.platformMetrics?.chatSessions || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Application Rate</h3>
                  <Target className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold">
                  {analytics.platformMetrics?.applicationRate ?
                    `${analytics.platformMetrics.applicationRate.toFixed(1)}%` :
                    '0%'
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Conversion Rate</h3>
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold">
                  {analytics.platformMetrics?.conversionRate ?
                    `${analytics.platformMetrics.conversionRate.toFixed(1)}%` :
                    '0%'
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Total Revenue</h3>
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold mb-2">
                  {formatCurrency(analytics.revenueMetrics?.totalRevenue || 0)}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon(analytics.revenueMetrics?.revenueGrowth || 0)}
                  <span className={getTrendColor(analytics.revenueMetrics?.revenueGrowth || 0)}>
                    {formatPercentage(analytics.revenueMetrics?.revenueGrowth || 0)}
                  </span>
                  <span className="text-gray-500">vs last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">ARPU</h3>
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold mb-2">
                  {formatCurrency(analytics.revenueMetrics?.averageRevenuePerUser || 0)}
                </div>
                <div className="text-sm text-gray-500">Average Revenue Per User</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Revenue Sources</h3>
                  <PieChart className="h-5 w-5 text-purple-500" />
                </div>
                <div className="space-y-2">
                  {analytics.revenueMetrics?.revenueBySource ?
                    Object.entries(analytics.revenueMetrics.revenueBySource).map(([source, amount]) => (
                      <div key={source} className="flex justify-between text-sm">
                        <span className="capitalize">{source}</span>
                        <span className="font-medium">{formatCurrency(amount)}</span>
                      </div>
                    )) :
                    <p className="text-sm text-gray-500">No revenue source data available</p>
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}