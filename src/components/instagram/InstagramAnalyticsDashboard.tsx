import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/card';
import { DateRange } from '@/components/ui/card';
import { addDays, format } from 'date-fns';

'use client';

  import { Card } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Users,
  BarChart3,
  AlertTriangle,
  Calendar,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  id: string;
  postId: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  profileVisits: number;
  websiteClicks: number;
  engagementRate: number;
  clickThroughRate: number;
  recordedAt: string;
  post: {
    id: string;
    caption: string;
    type: string;
    publishedAt: string;
    hashtags: string[];
    job?: {
      id: string;
      title: string;
      company: string;
    };
  };
}

interface PerformanceInsights {
  totalPosts: number;
  totalImpressions: number;
  totalReach: number;
  totalEngagements: number;
  averageEngagementRate: number;
  bestPerformingPost: {
    id: string;
    caption: string;
    engagementRate: number;
    impressions: number;
  } | null;
  worstPerformingPost: {
    id: string;
    caption: string;
    engagementRate: number;
    impressions: number;
  } | null;
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
  topHashtags: Array<{
    hashtag: string;
    count: number;
    avgEngagementRate: number;
  }>;
}

interface InstagramAnalyticsDashboardProps {
  className?: string;
}

export default function InstagramAnalyticsDashboard({
  className
}: InstagramAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [insights, setInsights] = useState<PerformanceInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  const [postTypeFilter, setPostTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
    fetchInsights();
  }, [dateRange, postTypeFilter]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (dateRange?.from) {
        params.append('startDate', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('endDate', dateRange.to.toISOString());
      }
      if (postTypeFilter !== 'all') {
        params.append('postType', postTypeFilter);
      }

      const response = await fetch(`/api/instagram/analytics?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const params = new URLSearchParams();

      if (dateRange?.from) {
        params.append('startDate', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('endDate', dateRange.to.toISOString());
      }
      if (postTypeFilter !== 'all') {
        params.append('postType', postTypeFilter);
      }

      const response = await fetch(
        `/api/instagram/analytics/insights?${params}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch (err) {
      console.error('Error fetching insights:', err);
    }
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-500';
      case 'decreasing':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">Instagram Analytics</h1>
            <p className="text-gray-600">
              Track your Instagram post performance and engagement
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            <Select value={postTypeFilter} onValueChange={setPostTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="job_listing">Job Listings</SelectItem>
                <SelectItem value="company_highlight">
                  Company Highlights
                </SelectItem>
                <SelectItem value="industry_news">Industry News</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="animate-pulse">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded bg-gray-200"></div>
            ))}
          </div>
          <div className="h-96 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">Instagram Analytics</h1>
            <p className="text-gray-600">
              Track your Instagram post performance and engagement
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            <Select value={postTypeFilter} onValueChange={setPostTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="job_listing">Job Listings</SelectItem>
                <SelectItem value="company_highlight">
                  Company Highlights
                </SelectItem>
                <SelectItem value="industry_news">Industry News</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading analytics: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Instagram Analytics</h1>
          <p className="text-gray-600">
            Track your Instagram post performance and engagement
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          <Select value={postTypeFilter} onValueChange={setPostTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="job_listing">Job Listings</SelectItem>
              <SelectItem value="company_highlight">
                Company Highlights
              </SelectItem>
              <SelectItem value="industry_news">Industry News</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      {insights && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.totalPosts}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                {getTrendIcon(insights.engagementTrend)}
                <span className={getTrendColor(insights.engagementTrend)}>
                  {insights.engagementTrend}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Impressions
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(insights.totalImpressions)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(insights.totalReach)} reach
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Engagements
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(insights.totalEngagements)}
              </div>
              <p className="text-xs text-muted-foreground">
                {insights.averageEngagementRate.toFixed(2)}% avg rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Engagement Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {insights.averageEngagementRate.toFixed(2)}%
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                {getTrendIcon(insights.engagementTrend)}
                <span className={getTrendColor(insights.engagementTrend)}>
                  {insights.engagementTrend} trend
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Post Performance</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtag Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {insights && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Best Performing Post */}
              {insights.bestPerformingPost && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Best Performing Post
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="line-clamp-3 text-sm text-gray-600">
                        {insights.bestPerformingPost.caption}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {insights.bestPerformingPost.engagementRate.toFixed(
                            2
                          )}
                          % engagement
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatNumber(
                            insights.bestPerformingPost.impressions
                          )}{' '}
                          impressions
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Worst Performing Post */}
              {insights.worstPerformingPost && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Needs Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="line-clamp-3 text-sm text-gray-600">
                        {insights.worstPerformingPost.caption}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {insights.worstPerformingPost.engagementRate.toFixed(
                            2
                          )}
                          % engagement
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatNumber(
                            insights.worstPerformingPost.impressions
                          )}{' '}
                          impressions
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <div className="grid gap-4">
            {analytics.map(analytic => (
              <Card key={analytic.id}>
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                        {analytic.post.caption}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Badge variant="outline">{analytic.post.type}</Badge>
                        <span>
                          {format(
                            new Date(analytic.post.publishedAt),
                            'MMM d, yyyy'
                          )}
                        </span>
                        {analytic.post.job && (
                          <span>
                            • {analytic.post.job.title} at{' '}
                            {analytic.post.job.company}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        analytic.engagementRate > 3 ? 'default' : 'secondary'
                      }
                    >
                      {analytic.engagementRate.toFixed(2)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4 lg:grid-cols-8">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span>{formatNumber(analytic.impressions)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{formatNumber(analytic.reach)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4 text-red-400" />
                      <span>{formatNumber(analytic.likes)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-4 w-4 text-blue-400" />
                      <span>{formatNumber(analytic.comments)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share2 className="h-4 w-4 text-green-400" />
                      <span>{formatNumber(analytic.shares)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bookmark className="h-4 w-4 text-yellow-400" />
                      <span>{formatNumber(analytic.saves)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span>{formatNumber(analytic.profileVisits)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4 text-orange-400" />
                      <span>{analytic.clickThroughRate.toFixed(2)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hashtags" className="space-y-4">
          {insights && insights.topHashtags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Hashtags</CardTitle>
                <CardDescription>
                  Hashtags ranked by average engagement rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.topHashtags.map((hashtag, index) => (
                    <div
                      key={hashtag.hashtag}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">
                          #{index + 1}
                        </span>
                        <span className="font-medium">{hashtag.hashtag}</span>
                        <Badge variant="outline">{hashtag.count} posts</Badge>
                      </div>
                      <div className="text-sm font-medium">
                        {hashtag.avgEngagementRate.toFixed(2)}% avg engagement
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {insights.totalPosts}
                      </div>
                      <div className="text-sm text-gray-600">Total Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {formatNumber(insights.totalImpressions)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total Impressions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {insights.averageEngagementRate.toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        Avg Engagement Rate
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(insights.engagementTrend)}
                    <span
                      className={`font-medium ${getTrendColor(insights.engagementTrend)}`}
                    >
                      Your engagement is {insights.engagementTrend}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {insights.engagementTrend === 'increasing' &&
                      'Great job! Your content is resonating well with your audience.'}
                    {insights.engagementTrend === 'decreasing' &&
                      'Consider reviewing your content strategy and posting times.'}
                    {insights.engagementTrend === 'stable' &&
                      'Your engagement is consistent. Try experimenting with new content types.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
