'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  Users, 
  Eye, 
  CreditCard, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  MapPin,
  Building,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Star,
  Target,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmployerAnalytics {
  overview: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    jobViews: number;
    averageApplicationsPerJob: number;
  };
  jobPerformance: {
    topPerformingJobs: Array<{
      id: string;
      title: string;
      applications: number;
      views: number;
      conversionRate: number;
    }>;
    applicationsByStatus: Record<string, number>;
  };
  creditUsage: {
    totalSpent: number;
    transactions: Array<{
      id: string;
      amount: number;
      description: string;
      createdAt: string;
    }>;
  };
}

interface EmployerAnalyticsDashboardProps {
  className?: string;
}

export default function EmployerAnalyticsDashboard({ className = '' }: EmployerAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<EmployerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const { toast } = useToast();

  // Load analytics data
  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/dashboard?timeRange=${timeRange}`);
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
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'hired':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'applied':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'interview':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'applied':
        return 'bg-yellow-100 text-yellow-800';
      case 'interview':
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
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
            <p className="text-gray-600 mb-4">Unable to load your analytics data.</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Hiring Analytics</h2>
          <p className="text-gray-600">Track your job posting performance and hiring metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Job Performance</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="credits">Credits & Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Jobs</p>
                      <p className="text-2xl font-bold">{analytics.overview.totalJobs}</p>
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
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Jobs</p>
                      <p className="text-2xl font-bold">{analytics.overview.activeJobs}</p>
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
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Users className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Applications</p>
                      <p className="text-2xl font-bold">{analytics.overview.totalApplications}</p>
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
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Eye className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Job Views</p>
                      <p className="text-2xl font-bold">{analytics.overview.jobViews}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Target className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Apps/Job</p>
                      <p className="text-2xl font-bold">{analytics.overview.averageApplicationsPerJob.toFixed(1)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Hiring Performance Summary
              </CardTitle>
              <CardDescription>
                Key metrics for your hiring success
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {analytics.overview.totalJobs > 0 ? 
                      ((analytics.overview.totalApplications / analytics.overview.totalJobs) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-sm text-gray-600">Application Rate</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Applications per job posting
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {analytics.overview.jobViews > 0 ? 
                      ((analytics.overview.totalApplications / analytics.overview.jobViews) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Views to applications
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {formatCurrency(analytics.creditUsage.totalSpent)}
                  </div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-xs text-gray-500 mt-1">
                    In selected period
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          {/* Top Performing Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Top Performing Jobs
              </CardTitle>
              <CardDescription>
                Your most successful job postings by application count
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.jobPerformance.topPerformingJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No job performance data available</p>
                  </div>
                ) : (
                  analytics.jobPerformance.topPerformingJobs.map((job, index) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{job.title}</h4>
                          <p className="text-sm text-gray-600">
                            {job.applications} applications • {job.views} views
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {job.conversionRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-gray-500">Conversion rate</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          {/* Application Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Application Status Overview
              </CardTitle>
              <CardDescription>
                Track the status of applications you've received
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analytics.jobPerformance.applicationsByStatus).map(([status, count]) => (
                  <div key={status} className="text-center p-4 border rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      {getStatusIcon(status)}
                    </div>
                    <div className="text-2xl font-bold mb-1">{count}</div>
                    <Badge className={getStatusColor(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-6">
          {/* Credit Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Credit Usage & Billing
              </CardTitle>
              <CardDescription>
                Track your credit spending and transaction history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatCurrency(analytics.creditUsage.totalSpent)}
                </div>
                <p className="text-gray-600">Total spent in selected period</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Recent Transactions</h4>
                {analytics.creditUsage.transactions.length === 0 ? (
                  <p className="text-gray-600">No recent transactions</p>
                ) : (
                  analytics.creditUsage.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
