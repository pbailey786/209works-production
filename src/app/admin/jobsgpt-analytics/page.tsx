'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Search,
  TrendingUp,
  MessageSquare,
  Users,
  Calendar,
  Download,
  Eye,
  Bot,
} from 'lucide-react';

interface ChatAnalytics {
  id: string;
  userId: string;
  userEmail: string;
  question: string;
  response: string;
  timestamp: string;
  sessionId: string;
  jobsFound: number;
  responseTime: number;
}

interface AnalyticsStats {
  totalQuestions: number;
  uniqueUsers: number;
  avgResponseTime: number;
  topQuestions: { question: string; count: number }[];
  questionsToday: number;
  questionsThisWeek: number;
}

export default function JobsGPTAnalyticsPage() {
  const { user, isLoaded } = useUser();
  const [analytics, setAnalytics] = useState<ChatAnalytics[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('7d');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Check if user is admin
  const isAdmin =
    (user as any)?.role === 'admin' ||
    user?.emailAddresses?.[0]?.emailAddress === 'admin@209jobs.com';

  useEffect(() => {
    if (isLoaded && user && isAdmin) {
      fetchAnalytics();
      fetchStats();
    }
  }, [isLoaded, user, isAdmin, page, dateFilter, searchTerm]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        dateFilter,
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/jobsgpt-analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `/api/admin/jobsgpt-stats?dateFilter=${dateFilter}`
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch(
        `/api/admin/export-jobsgpt-analytics?dateFilter=${dateFilter}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jobsgpt-analytics-${dateFilter}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Bot className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            JobsGPT Analytics
          </h1>
        </div>
        <p className="text-gray-600">
          Monitor AI chat interactions and user search patterns
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Questions
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalQuestions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +{stats.questionsToday} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.uniqueUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Using JobsGPT</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Response Time
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgResponseTime.toFixed(1)}s
              </div>
              <p className="text-xs text-muted-foreground">
                AI processing time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.questionsThisWeek.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Questions asked</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Questions */}
      {stats?.topQuestions && stats.topQuestions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Most Popular Questions</CardTitle>
            <CardDescription>
              Common questions users ask JobsGPT
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topQuestions.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.question}
                    </p>
                  </div>
                  <Badge variant="secondary">{item.count} times</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="1d">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>

        <Button onClick={exportData} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent JobsGPT Conversations</CardTitle>
          <CardDescription>
            User questions and AI responses with performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.map(item => (
                <div
                  key={item.id}
                  className="rounded-lg border p-4 hover:bg-gray-50"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="mb-1 font-medium text-gray-900">
                        {item.question}
                      </p>
                      <p className="mb-2 text-sm text-gray-600">
                        User: {item.userEmail} •{' '}
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {item.jobsFound} jobs found
                      </Badge>
                      <Badge variant="outline">
                        {item.responseTime.toFixed(1)}s
                      </Badge>
                    </div>
                  </div>

                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      <Eye className="mr-1 inline h-3 w-3" />
                      View AI Response
                    </summary>
                    <div className="mt-2 rounded bg-gray-50 p-3 text-sm">
                      {item.response.substring(0, 300)}
                      {item.response.length > 300 && '...'}
                    </div>
                  </details>
                </div>
              ))}

              {analytics.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  No JobsGPT analytics data found for the selected period.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 py-2 text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
