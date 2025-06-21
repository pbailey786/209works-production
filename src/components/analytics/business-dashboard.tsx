import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/card';
import {
  useBusinessMetrics,
  DashboardData,
  BusinessInsight,
  JobBoardKPIs
} from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  onClick?: () => void;
}

function KPICard({
  title,
  value,
  change,
  changePercent,
  trend,
  icon,
  format = 'number',
  onClick
}: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percentage':
        return `${(val * 100).toFixed(1)}%`;
      case 'duration':
        return `${Math.floor(val / 60)}m ${val % 60}s`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    if (!trend || trend === 'stable') return null;
    return trend === 'up' ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    );
  };

  const getTrendColor = () => {
    if (!trend || trend === 'stable') return 'text-gray-500';
    return trend === 'up' ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card
      className={`transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-blue-50 p-2">{icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatValue(value)}
              </p>
            </div>
          </div>
          {(change !== undefined || changePercent !== undefined) && (
            <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {changePercent !== undefined
                  ? `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`
                  : change !== undefined
                    ? `${change > 0 ? '+' : ''}${change}`
                    : ''}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface InsightCardProps {
  insight: BusinessInsight;
  onInteraction: (action: 'view' | 'dismiss' | 'act') => void;
}

function InsightCard({ insight, onInteraction }: InsightCardProps) {
  const getInsightIcon = () => {
    switch (insight.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'opportunity':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getInsightColor = () => {
    switch (insight.type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'opportunity':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className={`${getInsightColor()} border-l-4`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getInsightIcon()}
            <div className="flex-1">
              <div className="mb-1 flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {insight.impact} impact
                </Badge>
              </div>
              <p className="mb-2 text-sm text-gray-600">
                {insight.description}
              </p>
              {insight.recommendation && (
                <p className="text-sm font-medium text-gray-700">
                  💡 {insight.recommendation}
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-1">
            {insight.actionable && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onInteraction('act')}
                className="text-xs"
              >
                Act
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onInteraction('dismiss')}
              className="text-xs"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TrendChartProps {
  data: Array<{ period: string; value: number }>;
  title: string;
  color?: string;
}

function TrendChart({ data, title, color = '#3b82f6' }: TrendChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      <div className="flex h-20 items-end space-x-1">
        {data.slice(-14).map((point, index) => {
          const height =
            range > 0 ? ((point.value - minValue) / range) * 100 : 50;
          return (
            <div
              key={index}
              className="flex-1 rounded-t bg-blue-200"
              style={{
                height: `${Math.max(height, 5)}%`,
                backgroundColor: color,
                opacity: 0.7
              }}
              title={`${point.period}: ${point.value.toLocaleString()}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function BusinessDashboard() {
  const {
    getDashboardData,
    trackDashboardView,
    trackInsightInteraction,
    trackKPIDrillDown,
    exportDashboardData,
    isInitialized
  } = useBusinessMetrics();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedSection, setSelectedSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const data = getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    trackDashboardView(selectedSection);
  }, [selectedTimeRange, selectedSection]);

  const handleKPIClick = (metric: string, value: number) => {
    trackKPIDrillDown(metric, value);
    // In a real app, this would navigate to a detailed view
    console.log(`Drilling down into ${metric}: ${value}`);
  };

  const handleInsightInteraction = (
    insight: BusinessInsight,
    action: 'view' | 'dismiss' | 'act'
  ) => {
    trackInsightInteraction(insight, action);
    if (action === 'dismiss') {
      // Remove insight from view
      setDashboardData(prev =>
        prev
          ? {
              ...prev,
              insights: prev.insights.filter(i => i.id !== insight.id)
            }
          : null
      );
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-gray-500">Analytics not initialized</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { kpis, trends, insights } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Business Dashboard
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select
            value={selectedTimeRange}
            onValueChange={setSelectedTimeRange}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => exportDashboardData('json')}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button
            variant="outline"
            onClick={loadDashboardData}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      <Tabs value={selectedSection} onValueChange={setSelectedSection}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Users"
              value={kpis.totalUsers}
              change={trends.users.change}
              changePercent={trends.users.changePercent}
              trend={trends.users.trend}
              icon={<Users className="h-5 w-5 text-blue-500" />}
              onClick={() => handleKPIClick('totalUsers', kpis.totalUsers)}
            />
            <KPICard
              title="Active Jobs"
              value={kpis.activeJobs}
              change={trends.jobs.change}
              changePercent={trends.jobs.changePercent}
              trend={trends.jobs.trend}
              icon={<Briefcase className="h-5 w-5 text-green-500" />}
              onClick={() => handleKPIClick('activeJobs', kpis.activeJobs)}
            />
            <KPICard
              title="Applications"
              value={kpis.applicationsThisMonth}
              change={trends.applications.change}
              changePercent={trends.applications.changePercent}
              trend={trends.applications.trend}
              icon={<Send className="h-5 w-5 text-purple-500" />}
              onClick={() =>
                handleKPIClick('applications', kpis.applicationsThisMonth)
              }
            />
            <KPICard
              title="Monthly Revenue"
              value={kpis.revenueThisMonth}
              change={trends.revenue.change}
              changePercent={trends.revenue.changePercent}
              trend={trends.revenue.trend}
              icon={<DollarSign className="h-5 w-5 text-yellow-500" />}
              format="currency"
              onClick={() => handleKPIClick('revenue', kpis.revenueThisMonth)}
            />
          </div>

          {/* Conversion Metrics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KPICard
              title="Application Conversion"
              value={kpis.applicationConversionRate}
              icon={<Target className="h-5 w-5 text-red-500" />}
              format="percentage"
            />
            <KPICard
              title="Job Fill Rate"
              value={kpis.jobFillRate}
              icon={<CheckCircle className="h-5 w-5 text-green-500" />}
              format="percentage"
            />
            <KPICard
              title="User Retention"
              value={kpis.userRetentionRate}
              icon={<RefreshCw className="h-5 w-5 text-blue-500" />}
              format="percentage"
            />
          </div>

          {/* Trend Charts */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <TrendChart
                  data={trends.users.data}
                  title="User Growth"
                  color="#3b82f6"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <TrendChart
                  data={trends.jobs.data}
                  title="Job Postings"
                  color="#10b981"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <TrendChart
                  data={trends.applications.data}
                  title="Applications"
                  color="#8b5cf6"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <TrendChart
                  data={trends.revenue.data}
                  title="Revenue"
                  color="#f59e0b"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <KPICard
              title="Total Users"
              value={kpis.totalUsers}
              icon={<Users className="h-5 w-5 text-blue-500" />}
            />
            <KPICard
              title="Active Users"
              value={kpis.activeUsers}
              icon={<Activity className="h-5 w-5 text-green-500" />}
            />
            <KPICard
              title="New Users Today"
              value={kpis.newUsersToday}
              icon={<UserPlus className="h-5 w-5 text-purple-500" />}
            />
            <KPICard
              title="User Growth Rate"
              value={kpis.userGrowthRate}
              icon={<TrendingUp className="h-5 w-5 text-green-500" />}
              format="percentage"
            />
            <KPICard
              title="Avg Session Duration"
              value={kpis.averageSessionDuration}
              icon={<Clock className="h-5 w-5 text-blue-500" />}
              format="duration"
            />
            <KPICard
              title="Bounce Rate"
              value={kpis.bounceRate}
              icon={<MousePointer className="h-5 w-5 text-red-500" />}
              format="percentage"
            />
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <KPICard
              title="Total Jobs"
              value={kpis.totalJobs}
              icon={<Briefcase className="h-5 w-5 text-blue-500" />}
            />
            <KPICard
              title="Active Jobs"
              value={kpis.activeJobs}
              icon={<Activity className="h-5 w-5 text-green-500" />}
            />
            <KPICard
              title="New Jobs Today"
              value={kpis.newJobsToday}
              icon={<Plus className="h-5 w-5 text-purple-500" />}
            />
            <KPICard
              title="Job Fill Rate"
              value={kpis.jobFillRate}
              icon={<Target className="h-5 w-5 text-green-500" />}
              format="percentage"
            />
            <KPICard
              title="Avg Time to Fill"
              value={`${kpis.averageTimeToFill} days`}
              icon={<Clock className="h-5 w-5 text-blue-500" />}
            />
            <KPICard
              title="Job Quality Score"
              value={`${kpis.jobQualityScore.toFixed(1)}/10`}
              icon={<Star className="h-5 w-5 text-yellow-500" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <KPICard
              title="Total Revenue"
              value={kpis.totalRevenue}
              icon={<DollarSign className="h-5 w-5 text-green-500" />}
              format="currency"
            />
            <KPICard
              title="Monthly Revenue"
              value={kpis.revenueThisMonth}
              icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
              format="currency"
            />
            <KPICard
              title="Revenue Today"
              value={kpis.revenueToday}
              icon={<Activity className="h-5 w-5 text-purple-500" />}
              format="currency"
            />
            <KPICard
              title="ARPU"
              value={kpis.averageRevenuePerUser}
              icon={<Users className="h-5 w-5 text-blue-500" />}
              format="currency"
            />
            <KPICard
              title="Customer LTV"
              value={kpis.customerLifetimeValue}
              icon={<Star className="h-5 w-5 text-yellow-500" />}
              format="currency"
            />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Business Insights</h2>
              <Badge variant="outline">{insights.length} insights</Badge>
            </div>

            {insights.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Lightbulb className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    No insights available
                  </h3>
                  <p className="text-gray-500">
                    Check back later for business insights and recommendations.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {insights.map(insight => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onInteraction={action =>
                      handleInsightInteraction(insight, action)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
