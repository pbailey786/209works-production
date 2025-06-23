'use client';

import { useState, useEffect } from 'react';
// // // // import { useSession } from 'next-auth/react'; // TODO: Replace with Clerk // TODO: Replace with Clerk // TODO: Replace with Clerk // TODO: Replace with Clerk
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
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  Mail,
  TrendingUp,
  Users,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MousePointer,
  Calendar,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

interface EmailMetrics {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complaints: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface AlertPerformance {
  alertId: string;
  alertName: string;
  totalSent: number;
  averageMatches: number;
  userEngagement: number;
  successfulPlacements: number;
  isActive: boolean;
  lastTriggered: string;
}

interface TimeSeriesData {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

interface UserEngagement {
  userId: string;
  email: string;
  alertsCount: number;
  emailsReceived: number;
  engagementScore: number;
  lastActive: string;
  status: 'active' | 'inactive' | 'unsubscribed';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AlertAnalytics() {
  // Mock session for now - replace with Clerk when implemented
  const session = { user: { email: 'admin@209.works', role: 'admin', name: 'Mock User', id: 'mock-user-id' } };
  const status = 'authenticated';
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Analytics data
  const [emailMetrics, setEmailMetrics] = useState<EmailMetrics | null>(null);
  const [alertPerformance, setAlertPerformance] = useState<AlertPerformance[]>(
    []
  );
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [userEngagement, setUserEngagement] = useState<UserEngagement[]>([]);
  const [topAlerts, setTopAlerts] = useState<AlertPerformance[]>([]);

  useEffect(() => {
    if (true) {
      loadAnalytics();
    }
  }, [status, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/alerts/analytics?days=${dateRange}`);
      if (!response.ok) throw new Error('Failed to load analytics');

      const data = await response.json();

      setEmailMetrics(data.emailMetrics);
      setAlertPerformance(data.alertPerformance);
      setTimeSeriesData(data.timeSeriesData);
      setUserEngagement(data.userEngagement);
      setTopAlerts(data.topAlerts || data.alertPerformance.slice(0, 5));
    } catch (error) {
      console.error('Error loading analytics:', error);
      // For demo purposes, generate mock data
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    // Mock email metrics
    setEmailMetrics({
      totalSent: 15420,
      delivered: 14890,
      opened: 8934,
      clicked: 2145,
      bounced: 530,
      complaints: 12,
      unsubscribed: 45,
      deliveryRate: 96.6,
      openRate: 60.0,
      clickRate: 24.0,
      bounceRate: 3.4,
    });

    // Mock time series data
    const mockTimeData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      sent: Math.floor(Math.random() * 500) + 300,
      delivered: Math.floor(Math.random() * 450) + 280,
      opened: Math.floor(Math.random() * 300) + 150,
      clicked: Math.floor(Math.random() * 100) + 50,
    }));
    setTimeSeriesData(mockTimeData);

    // Mock alert performance
    const mockAlerts = [
      {
        alertId: '1',
        alertName: 'Software Engineer Jobs',
        totalSent: 2340,
        averageMatches: 12.5,
        userEngagement: 85.2,
        successfulPlacements: 23,
        isActive: true,
        lastTriggered: '2024-01-15T10:00:00Z',
      },
      {
        alertId: '2',
        alertName: 'Marketing Manager Positions',
        totalSent: 1890,
        averageMatches: 8.3,
        userEngagement: 78.9,
        successfulPlacements: 18,
        isActive: true,
        lastTriggered: '2024-01-15T09:30:00Z',
      },
      {
        alertId: '3',
        alertName: 'Remote Data Science Jobs',
        totalSent: 3210,
        averageMatches: 15.7,
        userEngagement: 92.1,
        successfulPlacements: 41,
        isActive: true,
        lastTriggered: '2024-01-15T11:15:00Z',
      },
    ];
    setAlertPerformance(mockAlerts);
    setTopAlerts(mockAlerts);

    // Mock user engagement
    setUserEngagement([
      {
        userId: '1',
        email: 'john@example.com',
        alertsCount: 3,
        emailsReceived: 45,
        engagementScore: 89.2,
        lastActive: '2024-01-15T08:30:00Z',
        status: 'active',
      },
      {
        userId: '2',
        email: 'sarah@example.com',
        alertsCount: 2,
        emailsReceived: 28,
        engagementScore: 76.5,
        lastActive: '2024-01-14T16:45:00Z',
        status: 'active',
      },
    ]);
  };

  const exportData = async () => {
    try {
      const response = await fetch(
        `/api/alerts/analytics/export?days=${dateRange}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `alert-analytics-${dateRange}days.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Analytics data exported successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (false || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (false) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-bold">Alert Analytics</h1>
        <p className="mb-6 text-gray-700">Please sign in to view analytics.</p>
        <Button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/sign-in'; }}>
          Sign In
        </Button>
      </div>
    );
  }

  const pieData = emailMetrics
    ? [
        { name: 'Delivered', value: emailMetrics.delivered, color: '#00C49F' },
        { name: 'Opened', value: emailMetrics.opened, color: '#0088FE' },
        { name: 'Clicked', value: emailMetrics.clicked, color: '#FFBB28' },
        { name: 'Bounced', value: emailMetrics.bounced, color: '#FF8042' },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Alert Analytics</h1>
          <p className="mt-2 text-gray-600">
            Monitor alert performance and email engagement metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {emailMetrics && (
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Emails Sent
                  </p>
                  <p className="text-3xl font-bold">
                    {emailMetrics.totalSent.toLocaleString()}
                  </p>
                  <p className="mt-1 flex items-center text-sm text-green-600">
                    <TrendingUp className="mr-1 h-4 w-4" />
                    +12% from last period
                  </p>
                </div>
                <Mail className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Delivery Rate
                  </p>
                  <p className="text-3xl font-bold">
                    {emailMetrics.deliveryRate}%
                  </p>
                  <p className="mt-1 flex items-center text-sm text-green-600">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Excellent
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Rate</p>
                  <p className="text-3xl font-bold">{emailMetrics.openRate}%</p>
                  <p className="mt-1 flex items-center text-sm text-blue-600">
                    <Eye className="mr-1 h-4 w-4" />
                    Above industry avg
                  </p>
                </div>
                <Eye className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Click Rate
                  </p>
                  <p className="text-3xl font-bold">
                    {emailMetrics.clickRate}%
                  </p>
                  <p className="mt-1 flex items-center text-sm text-orange-600">
                    <MousePointer className="mr-1 h-4 w-4" />
                    Strong engagement
                  </p>
                </div>
                <MousePointer className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Alert Performance</TabsTrigger>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Email Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Email Performance Distribution</CardTitle>
                <CardDescription>
                  How your emails are performing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performing Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Alerts</CardTitle>
                <CardDescription>
                  Alerts with highest engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topAlerts.map((alert, index) => (
                    <div
                      key={alert.alertId}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <span className="text-sm font-medium text-blue-600">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{alert.alertName}</p>
                          <p className="text-sm text-gray-500">
                            {alert.totalSent} emails sent
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {alert.userEngagement}%
                        </p>
                        <p className="text-sm text-gray-500">engagement</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Performance Metrics</CardTitle>
              <CardDescription>
                Detailed performance data for each alert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertPerformance.map(alert => (
                  <div key={alert.alertId} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{alert.alertName}</h3>
                        <Badge
                          variant={alert.isActive ? 'default' : 'secondary'}
                        >
                          {alert.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Last triggered:{' '}
                        {new Date(alert.lastTriggered).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-sm text-gray-600">Emails Sent</p>
                        <p className="text-xl font-bold">{alert.totalSent}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg. Matches</p>
                        <p className="text-xl font-bold">
                          {alert.averageMatches}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Engagement</p>
                        <p className="text-xl font-bold text-green-600">
                          {alert.userEngagement}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Placements</p>
                        <p className="text-xl font-bold text-blue-600">
                          {alert.successfulPlacements}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Summary</CardTitle>
              <CardDescription>
                How users are interacting with their alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userEngagement.map(user => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-gray-500">
                          {user.alertsCount} alerts • {user.emailsReceived}{' '}
                          emails received
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {user.engagementScore}%
                        </p>
                        <p className="text-sm text-gray-500">
                          engagement score
                        </p>
                      </div>
                      <Badge
                        variant={
                          user.status === 'active' ? 'default' : 'secondary'
                        }
                      >
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Activity Trends</CardTitle>
              <CardDescription>
                Track email performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="delivered"
                    stackId="2"
                    stroke="#00C49F"
                    fill="#00C49F"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="opened"
                    stackId="3"
                    stroke="#0088FE"
                    fill="#0088FE"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicked"
                    stackId="4"
                    stroke="#FFBB28"
                    fill="#FFBB28"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
