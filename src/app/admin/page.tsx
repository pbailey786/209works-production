'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { DashboardLayout, NavigationItem } from '@/components/dashboard/DashboardLayout';
import {
  MetricCard,
  WidgetCard,
  ActivityItem,
  QuickAction,
  StatsGrid
} from '@/components/dashboard/DashboardCards';
import RealTimeAnalyticsWidget from '@/components/analytics/RealTimeAnalyticsWidget';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  Briefcase,
  Flag,
  CreditCard,
  FileText,
  Settings,
  Shield,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Activity,
  Database,
  Globe,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Gauge,
} from 'lucide-react';

// Navigation configuration for admin dashboard
const adminNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
  },
  {
    name: 'Performance',
    href: '/admin/performance',
    icon: Gauge,
  },
  {
    name: 'Security',
    href: '/admin/security',
    icon: Shield,
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Jobs Overview',
    href: '/admin/moderation/jobs',
    icon: Briefcase,
  },
  {
    name: 'Reports/Abuse',
    href: '/admin/moderation/reports',
    icon: Flag,
  },
  {
    name: 'Credits & Plans',
    href: '/admin/credits',
    icon: CreditCard,
  },
  {
    name: 'System Logs',
    href: '/admin/audit',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

interface AdminStats {
  totalUsers: number;
  jobsPostedToday: number;
  flagsReports: number;
  apiLlmUsage: number;
  activeJobs: number;
  totalRevenue: number;
}

interface SystemActivity {
  id: string;
  type: 'user_signup' | 'job_posted' | 'payment' | 'report' | 'system';
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export default function AdminDashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    jobsPostedToday: 0,
    flagsReports: 0,
    apiLlmUsage: 0,
    activeJobs: 0,
    totalRevenue: 0,
  });

  const [systemActivity, setSystemActivity] = useState<SystemActivity[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Simplified auth state
  const isAuthenticated = isSignedIn && !!user;
  const isAuthLoading = !isLoaded;

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.emailAddresses?.[0]?.emailAddress?.includes('admin');

  // Fetch admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch admin stats
        const statsResponse = await fetch('/api/admin/dashboard-stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          // Set mock data for demo
          setStats({
            totalUsers: 1247,
            jobsPostedToday: 23,
            flagsReports: 5,
            apiLlmUsage: 1850,
            activeJobs: 156,
            totalRevenue: 12450,
          });
        }

        // Fetch system activity
        const activityResponse = await fetch('/api/admin/system-activity');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setSystemActivity(activityData.activities || []);
        } else {
          // Set mock data for demo
          setSystemActivity([
            {
              id: '1',
              type: 'user_signup',
              description: 'New user registered: john.doe@email.com',
              timestamp: '2025-01-16T10:30:00Z',
              severity: 'success'
            },
            {
              id: '2',
              type: 'job_posted',
              description: 'New job posted: Software Engineer at Tech Corp',
              timestamp: '2025-01-16T10:15:00Z',
              severity: 'info'
            },
            {
              id: '3',
              type: 'report',
              description: 'Job reported for inappropriate content',
              timestamp: '2025-01-16T09:45:00Z',
              severity: 'warning'
            },
            {
              id: '4',
              type: 'payment',
              description: 'Credit purchase: $99 package by employer',
              timestamp: '2025-01-16T09:30:00Z',
              severity: 'success'
            }
          ]);
        }

      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    if (isAuthenticated && isAdmin) {
      fetchAdminData();
    } else if (isAuthenticated && !isAdmin) {
      setIsDataLoading(false);
    }
  }, [isAuthenticated, isAdmin]);

  // Handle authentication redirect
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/sign-in');
    } else if (!isAuthLoading && isAuthenticated && !isAdmin) {
      router.push('/');
    }
  }, [isAuthLoading, isAuthenticated, isAdmin, router]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'job_posted':
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'report':
        return <Flag className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.ceil(diffMinutes / 60)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Redirecting to sign-in...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access the admin dashboard.</p>
          <Button onClick={() => router.push('/')}>
            Return to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      navigation={adminNavigation}
      title="Admin Control"
      subtitle={`System overview and management`}
      user={{
        name: user?.fullName || '',
        email: user?.primaryEmailAddress?.emailAddress || '',
        initials: user?.firstName?.[0] + user?.lastName?.[0] || 'A',
      }}
      headerActions={
        <Button onClick={() => router.push('/admin/settings')} variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      }
      searchPlaceholder="Search users, jobs, reports..."
    >
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={<Users className="h-6 w-6" />}
            color="blue"
            trend={{
              value: 8,
              isPositive: true,
              label: "vs last month"
            }}
            onClick={() => router.push('/admin/users')}
          />
          <MetricCard
            title="Jobs Posted Today"
            value={stats.jobsPostedToday}
            icon={<Briefcase className="h-6 w-6" />}
            color="green"
            trend={{
              value: 15,
              isPositive: true,
              label: "vs yesterday"
            }}
            onClick={() => router.push('/admin/moderation/jobs')}
          />
          <MetricCard
            title="Flags/Reports"
            value={stats.flagsReports}
            icon={<Flag className="h-6 w-6" />}
            color="red"
            onClick={() => router.push('/admin/moderation/reports')}
          />
          <MetricCard
            title="API/LLM Usage"
            value={`${(stats.apiLlmUsage / 1000).toFixed(1)}k`}
            icon={<Zap className="h-6 w-6" />}
            color="purple"
            trend={{
              value: 12,
              isPositive: true,
              label: "requests today"
            }}
          />
        </div>

        {/* Real-Time Analytics Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <WidgetCard
              title="System Activity"
              subtitle="Recent platform events and actions"
            >
              <div className="space-y-4">
                {systemActivity.slice(0, 5).map((activity, index) => (
                  <ActivityItem
                    key={index}
                    title={activity.description}
                    description={`${activity.type.replace('_', ' ').toUpperCase()}`}
                    time={formatTimestamp(activity.timestamp)}
                    icon={getActivityIcon(activity.type)}
                    badge={{
                      text: activity.severity,
                      variant: activity.severity === 'error' ? 'destructive' : 'secondary'
                    }}
                  />
                ))}
                {systemActivity.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </WidgetCard>
          </div>

          {/* Real-Time Analytics */}
          <div>
            <RealTimeAnalyticsWidget
              refreshInterval={30}
              showTrends={true}
              compact={false}
            />
          </div>
        </div>

        {/* Secondary Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Top Referrers Widget */}
          <WidgetCard
            title="Top Referrers"
            subtitle="Traffic sources and acquisition"
          >
            <StatsGrid
              stats={[
                {
                  label: "Google Search",
                  value: "45%",
                  change: { value: 5, isPositive: true }
                },
                {
                  label: "Direct Traffic",
                  value: "28%",
                  change: { value: 2, isPositive: false }
                },
                {
                  label: "Social Media",
                  value: "18%",
                  change: { value: 8, isPositive: true }
                },
                {
                  label: "Referrals",
                  value: "9%",
                  change: { value: 3, isPositive: true }
                }
              ]}
            />
          </WidgetCard>
        </div>

        {/* Additional Widgets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Credits Purchased Widget */}
          <WidgetCard
            title="Credits Purchased"
            subtitle="Revenue and credit sales overview"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <h4 className="font-medium text-gray-900">Today's Revenue</h4>
                  <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">156</div>
                  <div className="text-sm text-gray-600">Credits Sold</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">$89</div>
                  <div className="text-sm text-gray-600">Avg Order</div>
                </div>
              </div>
            </div>
          </WidgetCard>

          {/* Feature Usage Widget */}
          <WidgetCard
            title="Feature Usage"
            subtitle="Platform feature adoption and usage"
          >
            <div className="space-y-3">
              <QuickAction
                title="User Management"
                description="Manage users, roles, and permissions"
                icon={<Users className="h-5 w-5 text-blue-600" />}
                onClick={() => router.push('/admin/users')}
              />
              <QuickAction
                title="Job Moderation"
                description="Review and moderate job postings"
                icon={<Briefcase className="h-5 w-5 text-green-600" />}
                onClick={() => router.push('/admin/moderation/jobs')}
              />
              <QuickAction
                title="System Health"
                description="Monitor system performance"
                icon={<Activity className="h-5 w-5 text-purple-600" />}
                onClick={() => router.push('/admin/health')}
              />
              <QuickAction
                title="Analytics"
                description="View detailed platform analytics"
                icon={<BarChart3 className="h-5 w-5 text-orange-600" />}
                onClick={() => router.push('/admin/analytics')}
              />
            </div>
          </WidgetCard>
        </div>

        {/* Jobs Over Time Widget */}
        <WidgetCard
          title="Platform Overview"
          subtitle="Key metrics and system status"
        >
          <StatsGrid
            stats={[
              {
                label: "Active Jobs",
                value: stats.activeJobs,
                change: { value: 12, isPositive: true }
              },
              {
                label: "System Uptime",
                value: "99.9%"
              },
              {
                label: "Response Time",
                value: "145ms"
              },
              {
                label: "Error Rate",
                value: "0.02%",
                change: { value: 0.01, isPositive: false }
              }
            ]}
          />
        </WidgetCard>
      </div>
    </DashboardLayout>
  );
}
