'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from 'lucide-react';
import {
  AnalyticsTimeRange,
  UserBehaviorMetrics,
  JobPerformanceMetrics,
  BusinessIntelligence,
  RegionalAnalytics,
  AIAnalytics
} from '@/lib/analytics/advanced-analytics';

interface AnalyticsData {
  userBehavior: UserBehaviorMetrics;
  jobPerformance: JobPerformanceMetrics;
  businessIntelligence: BusinessIntelligence;
  regionalAnalytics: RegionalAnalytics;
  aiAnalytics: AIAnalytics;
  generatedAt: string;
}

interface AdvancedAnalyticsDashboardProps {
  initialData?: AnalyticsData;
  userRole: 'admin' | 'employer';
  region?: string;
}

export default function AdvancedAnalyticsDashboard({
  initialData,
  userRole,
  region
}: AdvancedAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [selectedRegion, setSelectedRegion] = useState<string>(region || 'all');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/comprehensive?timeRange=${timeRange}&region=${selectedRegion === 'all' ? '' : selectedRegion}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchAnalytics();
    }
  }, [timeRange, selectedRegion]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No analytics data available</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">
            Comprehensive insights and business intelligence
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          {userRole === 'admin' && (
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[140px]">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="209">209 Area</SelectItem>
                <SelectItem value="916">916 Area</SelectItem>
                <SelectItem value="510">510 Area</SelectItem>
                <SelectItem value="925">925 Area</SelectItem>
                <SelectItem value="559">559 Area</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{formatNumber(data.userBehavior.totalUsers)}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{data.userBehavior.newUsers} new
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold">{formatNumber(data.jobPerformance.activeJobs)}</p>
                <p className="text-xs text-blue-600 mt-1">
                  +{data.jobPerformance.jobsPostedToday} today
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(data.businessIntelligence.revenue.total)}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{formatPercentage(data.businessIntelligence.revenue.growth)} growth
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Sessions</p>
                <p className="text-2xl font-bold">{formatNumber(data.aiAnalytics.jobsGPT.totalSessions)}</p>
                <p className="text-xs text-purple-600 mt-1">
                  {formatPercentage(data.aiAnalytics.jobsGPT.successRate)} success rate
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="ai">AI Features</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Engagement Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  User Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="font-semibold">{formatNumber(data.userBehavior.activeUsers)}</span>
                </div>
                <Progress value={(data.userBehavior.activeUsers / data.userBehavior.totalUsers) * 100} />

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="font-semibold">{formatPercentage(data.userBehavior.conversionRate)}</span>
                </div>
                <Progress value={data.userBehavior.conversionRate} />

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Retention Rate</span>
                  <span className="font-semibold">{formatPercentage(data.userBehavior.userRetentionRate)}</span>
                </div>
                <Progress value={data.userBehavior.userRetentionRate} />
              </CardContent>
            </Card>

            {/* Regional Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Regional Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.regionalAnalytics.regions.slice(0, 5).map((region) => (
                    <div key={region.region} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{region.domain}</Badge>
                        <span className="text-sm">{formatNumber(region.users)} users</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatCurrency(region.revenue)}</div>
                        <div className="text-xs text-green-600">+{formatPercentage(region.growth)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Highlights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Performance Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPercentage(data.aiAnalytics.jobsGPT.successRate)}
                  </div>
                  <div className="text-sm text-gray-600">AI Success Rate</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(data.jobPerformance.topPerformingJobs.length)}
                  </div>
                  <div className="text-sm text-gray-600">Top Performing Jobs</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(data.businessIntelligence.revenue.arpu)}
                  </div>
                  <div className="text-sm text-gray-600">ARPU</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
                <CardDescription>Detailed user behavior and engagement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.userBehavior.totalUsers)}</div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.userBehavior.newUsers)}</div>
                    <div className="text-sm text-gray-600">New Users</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.userBehavior.activeUsers)}</div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.userBehavior.returningUsers)}</div>
                    <div className="text-sm text-gray-600">Returning Users</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Session Duration</span>
                    <span className="font-semibold">{Math.round(data.userBehavior.averageSessionDuration / 60)}m</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Page Views</span>
                    <span className="font-semibold">{formatNumber(data.userBehavior.pageViews)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Seeker Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Job Seeker Insights</CardTitle>
                <CardDescription>Job seeker behavior and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.businessIntelligence.jobSeekers.total)}</div>
                    <div className="text-sm text-gray-600">Total Job Seekers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.businessIntelligence.jobSeekers.active)}</div>
                    <div className="text-sm text-gray-600">Active Job Seekers</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Profile Completion</span>
                      <span className="text-sm font-semibold">{formatPercentage(data.businessIntelligence.jobSeekers.profileCompletionRate)}</span>
                    </div>
                    <Progress value={data.businessIntelligence.jobSeekers.profileCompletionRate} />
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600 mb-2">Avg. Applications per User</div>
                    <div className="text-xl font-bold">{data.businessIntelligence.jobSeekers.averageApplicationsPerUser.toFixed(1)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Job Performance</CardTitle>
                <CardDescription>Job posting and application metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.jobPerformance.totalJobs)}</div>
                    <div className="text-sm text-gray-600">Total Jobs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.jobPerformance.activeJobs)}</div>
                    <div className="text-sm text-gray-600">Active Jobs</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Application Rate</span>
                      <span className="text-sm font-semibold">{formatPercentage(data.jobPerformance.applicationRate)}</span>
                    </div>
                    <Progress value={data.jobPerformance.applicationRate} />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">View to Application</span>
                      <span className="text-sm font-semibold">{formatPercentage(data.jobPerformance.viewToApplicationRate)}</span>
                    </div>
                    <Progress value={data.jobPerformance.viewToApplicationRate} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Jobs</CardTitle>
                <CardDescription>Jobs with highest engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.jobPerformance.topPerformingJobs.slice(0, 5).map((job, index) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{job.title}</div>
                        <div className="text-xs text-gray-600">{job.company}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{job.applications} apps</div>
                        <div className="text-xs text-gray-600">{formatPercentage(job.conversionRate)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Categories and Locations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Jobs by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.jobPerformance.jobsByCategory.slice(0, 8).map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <span className="text-sm">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{category.count}</span>
                        <span className="text-xs text-gray-600">({formatPercentage(category.percentage)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jobs by Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.jobPerformance.jobsByLocation.slice(0, 8).map((location) => (
                    <div key={location.location} className="flex items-center justify-between">
                      <span className="text-sm">{location.location}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{location.count}</span>
                        <span className="text-xs text-gray-600">({formatPercentage(location.percentage)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{formatCurrency(data.businessIntelligence.revenue.total)}</div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatCurrency(data.businessIntelligence.revenue.recurring)}</div>
                    <div className="text-sm text-gray-600">Recurring Revenue</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ARPU</span>
                    <span className="font-semibold">{formatCurrency(data.businessIntelligence.revenue.arpu)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">LTV</span>
                    <span className="font-semibold">{formatCurrency(data.businessIntelligence.revenue.ltv)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Growth Rate</span>
                    <span className="font-semibold text-green-600">+{formatPercentage(data.businessIntelligence.revenue.growth)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employer Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Employer Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.businessIntelligence.employers.total)}</div>
                    <div className="text-sm text-gray-600">Total Employers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.businessIntelligence.employers.active)}</div>
                    <div className="text-sm text-gray-600">Active Employers</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Jobs per Employer</span>
                    <span className="font-semibold">{data.businessIntelligence.employers.averageJobsPerEmployer.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Churn Rate</span>
                    <span className="font-semibold">{formatPercentage(data.businessIntelligence.employers.churnRate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Spenders */}
          <Card>
            <CardHeader>
              <CardTitle>Top Spending Employers</CardTitle>
              <CardDescription>Highest revenue generating employers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.businessIntelligence.employers.topSpenders.slice(0, 8).map((spender, index) => (
                  <div key={spender.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{spender.companyName}</div>
                        <div className="text-xs text-gray-600">{spender.jobsPosted} jobs posted</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(spender.totalSpent)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* JobsGPT Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  JobsGPT Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.aiAnalytics.jobsGPT.totalSessions)}</div>
                    <div className="text-sm text-gray-600">Total Sessions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.aiAnalytics.jobsGPT.totalQuestions)}</div>
                    <div className="text-sm text-gray-600">Questions Asked</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="text-sm font-semibold">{formatPercentage(data.aiAnalytics.jobsGPT.successRate)}</span>
                    </div>
                    <Progress value={data.aiAnalytics.jobsGPT.successRate} />
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Response Time</span>
                    <span className="font-semibold">{data.aiAnalytics.jobsGPT.averageResponseTime.toFixed(1)}s</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">User Satisfaction</span>
                    <span className="font-semibold">{data.aiAnalytics.jobsGPT.userSatisfactionScore}/5.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Should I Apply Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Should I Apply Feature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.aiAnalytics.shouldIApply.totalUsage)}</div>
                    <div className="text-sm text-gray-600">Total Usage</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{data.aiAnalytics.shouldIApply.averageMatchScore}</div>
                    <div className="text-sm text-gray-600">Avg Match Score</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                    <span className="font-semibold">{formatPercentage(data.aiAnalytics.shouldIApply.applicationConversionRate)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-sm font-medium text-gray-700 mb-2">Top Recommendation Reasons</div>
                  <div className="space-y-1">
                    {data.aiAnalytics.shouldIApply.topRecommendationReasons.slice(0, 3).map((reason) => (
                      <div key={reason.reason} className="flex justify-between text-sm">
                        <span className="text-gray-600">{reason.reason}</span>
                        <span className="font-medium">{reason.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Intent Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>AI Intent Analysis</CardTitle>
              <CardDescription>Most common user intents and queries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.aiAnalytics.jobsGPT.topIntents.map((intent) => (
                  <div key={intent.intent} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium capitalize">{intent.intent.replace('_', ' ')}</span>
                      <Badge variant="secondary">{formatPercentage(intent.percentage)}</Badge>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(intent.count)}</div>
                    <Progress value={intent.percentage} className="mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resume Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Resume Analysis Insights</CardTitle>
              <CardDescription>AI-powered resume analysis performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(data.aiAnalytics.resumeAnalysis.totalAnalyses)}</div>
                    <div className="text-sm text-gray-600">Total Analyses</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{data.aiAnalytics.resumeAnalysis.averageScore}</div>
                    <div className="text-sm text-gray-600">Average Score</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">Top Improvement Suggestions</div>
                  <div className="space-y-2">
                    {data.aiAnalytics.resumeAnalysis.topImprovementSuggestions.map((suggestion) => (
                      <div key={suggestion.suggestion} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{suggestion.suggestion}</span>
                        <Badge variant="outline">{suggestion.frequency}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
