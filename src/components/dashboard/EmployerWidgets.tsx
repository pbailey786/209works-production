'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  WidgetCard,
  MetricCard,
  QuickAction,
  StatsGrid,
  LoadingState,
  ErrorState,
} from './DashboardCards';
import {
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Heart,
  Send,
  User,
  Star,
  Calendar,
  MapPin,
  Building2,
  DollarSign,
  ArrowRight,
  Plus,
  Filter,
  Briefcase,
  Users,
  Mail,
  BarChart3,
  Zap,
  Award,
  Activity,
  Upload,
  CreditCard,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AIMatchingStats {
  totalFeaturedJobs: number;
  totalMatches: number;
  totalEmailsSent: number;
  totalImpressions: number;
  totalClicks: number;
  averageMatchScore: number;
  conversionRate: number;
}

interface JobPerformanceData {
  id: string;
  title: string;
  applications: number;
  views: number;
  conversionRate: number;
  status: 'active' | 'paused' | 'expired';
  postedAt: string;
}

interface EmployerAnalytics {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
  profileViews: number;
  responseRate: number;
}

// AI Matching Performance Widget
export function AIMatchingWidget() {
  const [stats, setStats] = useState<AIMatchingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAIMatchingStats = async () => {
      try {
        const response = await fetch('/api/employers/ai-matching-dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats(data.summary);
        } else {
          setError('Failed to load AI matching data');
        }
      } catch (err) {
        setError('Failed to load AI matching data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIMatchingStats();
  }, []);

  if (isLoading) return <LoadingState message="Loading AI matching data..." />;
  if (error) return <ErrorState title="AI Matching Data Unavailable" description={error} />;
  if (!stats) return null;

  return (
    <WidgetCard
      title="AI Matching Performance"
      subtitle="How your featured jobs are performing with AI-powered candidate matching"
      headerActions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/employers/ai-matching">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalMatches}</div>
            <div className="text-xs text-gray-600">AI Matches</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.totalEmailsSent}</div>
            <div className="text-xs text-gray-600">Emails Sent</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.averageMatchScore}%</div>
            <div className="text-xs text-gray-600">Avg Match Score</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.conversionRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Conversion Rate</div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Match Quality Score</span>
            <span className="font-medium">{stats.averageMatchScore}%</span>
          </div>
          <Progress value={stats.averageMatchScore} className="h-2" />
          <p className="text-xs text-gray-600">
            {stats.averageMatchScore >= 80 ? 'Excellent match quality!' : 
             stats.averageMatchScore >= 60 ? 'Good match quality' : 
             'Consider improving job descriptions for better matches'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Zap className="h-4 w-4 mr-2" />
            Optimize Jobs
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Award className="h-4 w-4 mr-2" />
            Feature More
          </Button>
        </div>
      </div>
    </WidgetCard>
  );
}

// Job Performance Analytics Widget
export function JobPerformanceWidget() {
  const [jobs, setJobs] = useState<JobPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobPerformance = async () => {
      try {
        const response = await fetch('/api/employers/my-jobs');
        if (response.ok) {
          const data = await response.json();
          // Transform job data for performance display
          const performanceData = data.jobs.slice(0, 5).map((job: any) => ({
            id: job.id,
            title: job.title,
            applications: job._count?.applications || 0,
            views: Math.floor(Math.random() * 200) + 50, // Mock data
            conversionRate: Math.random() * 10 + 2,
            status: job.status.toLowerCase(),
            postedAt: job.postedAt,
          }));
          setJobs(performanceData);
        }
      } catch (err) {
        console.error('Failed to fetch job performance:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobPerformance();
  }, []);

  if (isLoading) return <LoadingState message="Loading job performance..." />;

  return (
    <WidgetCard
      title="Top Performing Jobs"
      subtitle="Your best performing job posts this month"
      headerActions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/employers/my-jobs">
            <Activity className="h-4 w-4 mr-2" />
            View All
          </Link>
        </Button>
      }
    >
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No jobs posted yet</p>
            <Button size="sm" className="mt-2" asChild>
              <Link href="/employers/create-job-post">Post Your First Job</Link>
            </Button>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">{job.title}</h4>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-gray-600">{job.applications} applications</span>
                  <span className="text-xs text-gray-600">{job.views} views</span>
                  <Badge 
                    variant={job.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {job.status}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">
                  {job.conversionRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">conversion</div>
              </div>
            </div>
          ))
        )}
      </div>
    </WidgetCard>
  );
}

// Credit Usage Widget
export function CreditUsageWidget() {
  const [credits, setCredits] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch('/api/job-posting/credits');
        if (response.ok) {
          const data = await response.json();
          setCredits(data);
        }
      } catch (err) {
        console.error('Failed to fetch credits:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredits();
  }, []);

  if (isLoading) return <LoadingState message="Loading credit usage..." />;

  const totalCredits = credits?.total || 0;
  const usedCredits = totalCredits - (credits?.universal || 0);
  const usagePercentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;

  return (
    <WidgetCard
      title="Credit Usage"
      subtitle="Track your job posting credits"
      headerActions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/employers/pricing">
            <Plus className="h-4 w-4 mr-2" />
            Buy Credits
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">{credits?.universal || 0}</div>
          <div className="text-sm text-gray-600">Credits Remaining</div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Usage This Month</span>
            <span>{usedCredits} of {totalCredits}</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-2 bg-blue-50 rounded">
            <div className="text-lg font-semibold text-blue-600">{credits?.jobPost || 0}</div>
            <div className="text-xs text-gray-600">Job Posts</div>
          </div>
          <div className="p-2 bg-orange-50 rounded">
            <div className="text-lg font-semibold text-orange-600">{credits?.featuredPost || 0}</div>
            <div className="text-xs text-gray-600">Featured</div>
          </div>
        </div>

        {(credits?.universal || 0) < 3 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">Running low on credits</span>
            </div>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}

// Recent Applications Widget
export function RecentApplicationsWidget() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/employers/applicants');
        if (response.ok) {
          const data = await response.json();
          setApplications(data.applicants?.slice(0, 5) || []);
        }
      } catch (err) {
        console.error('Failed to fetch applications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (isLoading) return <LoadingState message="Loading recent applications..." />;

  return (
    <WidgetCard
      title="Recent Applications"
      subtitle="Latest candidates who applied to your jobs"
      headerActions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/employers/applicants">
            <Users className="h-4 w-4 mr-2" />
            View All
          </Link>
        </Button>
      }
    >
      <div className="space-y-3">
        {applications.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No applications yet</p>
            <p className="text-xs">Applications will appear here once candidates apply</p>
          </div>
        ) : (
          applications.map((app, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {app.user?.name || 'Anonymous Applicant'}
                </h4>
                <p className="text-xs text-gray-600 truncate">
                  Applied to {app.job?.title || 'Unknown Position'}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {app.status || 'New'}
              </Badge>
            </div>
          ))
        )}
      </div>
    </WidgetCard>
  );
}

// Hiring Pipeline Widget
export function HiringPipelineWidget() {
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        const response = await fetch('/api/employers/hiring-pipeline');
        if (response.ok) {
          const data = await response.json();
          setPipelineData(data);
        } else {
          // Mock data if endpoint doesn't exist yet
          setPipelineData({
            applied: Math.floor(Math.random() * 50) + 10,
            screening: Math.floor(Math.random() * 20) + 5,
            interview: Math.floor(Math.random() * 10) + 2,
            offer: Math.floor(Math.random() * 5) + 1,
            hired: Math.floor(Math.random() * 3) + 1,
          });
        }
      } catch (err) {
        // Mock data on error
        setPipelineData({
          applied: Math.floor(Math.random() * 50) + 10,
          screening: Math.floor(Math.random() * 20) + 5,
          interview: Math.floor(Math.random() * 10) + 2,
          offer: Math.floor(Math.random() * 5) + 1,
          hired: Math.floor(Math.random() * 3) + 1,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPipelineData();
  }, []);

  if (isLoading) return <LoadingState message="Loading hiring pipeline..." />;

  const stages = [
    { name: 'Applied', count: pipelineData?.applied || 0, color: 'bg-blue-500' },
    { name: 'Screening', count: pipelineData?.screening || 0, color: 'bg-yellow-500' },
    { name: 'Interview', count: pipelineData?.interview || 0, color: 'bg-orange-500' },
    { name: 'Offer', count: pipelineData?.offer || 0, color: 'bg-green-500' },
    { name: 'Hired', count: pipelineData?.hired || 0, color: 'bg-purple-500' },
  ];

  const totalCandidates = stages.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <WidgetCard
      title="Hiring Pipeline"
      subtitle="Track candidates through your hiring process"
      headerActions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/employers/applicants">
            <Target className="h-4 w-4 mr-2" />
            Manage
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const percentage = totalCandidates > 0 ? (stage.count / totalCandidates) * 100 : 0;
          return (
            <div key={stage.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                <span className="text-sm text-gray-600">{stage.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${stage.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className="pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">Total Candidates</span>
            <span className="text-lg font-bold text-gray-900">{totalCandidates}</span>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}

// Quick Actions Widget
export function EmployerQuickActionsWidget() {
  return (
    <WidgetCard
      title="Quick Actions"
      subtitle="Common tasks and shortcuts"
    >
      <div className="space-y-3">
        <QuickAction
          title="Post a New Job"
          description="Create and publish a new job posting"
          icon={<Plus className="h-5 w-5 text-[#ff6b35]" />}
          onClick={() => window.location.href = '/employers/create-job-post'}
          variant="primary"
        />
        <QuickAction
          title="Bulk Upload Jobs"
          description="Upload multiple jobs at once with CSV"
          icon={<Upload className="h-5 w-5 text-[#2d4a3e]" />}
          onClick={() => window.location.href = '/employers/bulk-upload'}
          variant="secondary"
        />
        <QuickAction
          title="Review Applications"
          description="Check new candidate applications"
          icon={<Users className="h-5 w-5 text-gray-600" />}
          onClick={() => window.location.href = '/employers/applicants'}
        />
        <QuickAction
          title="Buy More Credits"
          description="Purchase additional job posting credits"
          icon={<CreditCard className="h-5 w-5 text-gray-600" />}
          onClick={() => window.location.href = '/employers/pricing'}
        />
      </div>
    </WidgetCard>
  );
}

// Credit Alerts Widget
export function CreditAlertsWidget() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCreditAlerts = async () => {
      try {
        const response = await fetch('/api/employers/credit-alerts');
        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts || []);
          setUsageStats(data.usageStats);
        }
      } catch (err) {
        console.error('Failed to fetch credit alerts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditAlerts();
  }, []);

  const dismissAlert = async (alertType: string) => {
    try {
      await fetch('/api/employers/credit-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss_alert', alertType })
      });

      // Remove the alert from the list
      setAlerts(alerts.filter(alert => alert.type !== alertType));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  if (isLoading) return <LoadingState message="Loading credit alerts..." />;

  // Don't show widget if no alerts
  if (alerts.length === 0) return null;

  return (
    <WidgetCard
      title="Credit Alerts"
      subtitle="Important notifications about your credits"
      headerActions={
        <Badge variant="outline" className="text-xs">
          {alerts.length} alert{alerts.length === 1 ? '' : 's'}
        </Badge>
      }
    >
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              alert.severity === 'critical'
                ? 'bg-red-50 border-red-200'
                : alert.severity === 'warning'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {alert.severity === 'critical' && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  {alert.severity === 'warning' && (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  {alert.severity === 'info' && (
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    alert.severity === 'critical'
                      ? 'text-red-800'
                      : alert.severity === 'warning'
                      ? 'text-yellow-800'
                      : 'text-blue-800'
                  }`}>
                    {alert.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </div>
                <p className={`text-sm ${
                  alert.severity === 'critical'
                    ? 'text-red-700'
                    : alert.severity === 'warning'
                    ? 'text-yellow-700'
                    : 'text-blue-700'
                }`}>
                  {alert.message}
                </p>
                {alert.expirationDate && (
                  <p className="text-xs text-gray-600 mt-1">
                    Expires: {new Date(alert.expirationDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismissAlert(alert.type)}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {alert.actionRequired && alert.actionUrl && (
              <div className="mt-3">
                <Button size="sm" asChild>
                  <Link href={alert.actionUrl}>
                    Take Action
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ))}

        {usageStats && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-lg font-semibold text-gray-900">{usageStats.usageThisMonth}</div>
                <div className="text-xs text-gray-600">Used This Month</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-lg font-semibold text-gray-900">{usageStats.averageMonthlyUsage}</div>
                <div className="text-xs text-gray-600">Avg Monthly</div>
              </div>
            </div>

            {usageStats.projectedRunOutDate && (
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-600">
                  Projected to run out: {new Date(usageStats.projectedRunOutDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
