'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout, NavigationItem } from '@/components/dashboard/DashboardLayout';
import {
  MetricCard,
  WidgetCard,
  UsageMeter,
  ActivityItem,
  QuickAction,
  StatsGrid,
  UsageMeter
} from '@/components/dashboard/DashboardCards';
import {
  AIMatchingWidget,
  JobPerformanceWidget,
  CreditUsageWidget,
  RecentApplicationsWidget,
  HiringPipelineWidget,
  EmployerQuickActionsWidget,
  CreditAlertsWidget,
} from '@/components/dashboard/EmployerWidgets';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  Users,
  Briefcase,
  TrendingUp,
  Eye,
  MessageSquare,
  Calendar,
  Plus,
  Filter,
  Download,
  Star,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Search,
  Settings,
  Sparkles,
  Upload,
  CreditCard,
  HelpCircle,
  Share2,
  FileText,
  UserCheck,
} from 'lucide-react';
// Lazy load heavy components
const BillingModal = React.lazy(() => import('@/components/billing/BillingModal'));
const JobPostingCheckout = React.lazy(() => import('@/components/job-posting/JobPostingCheckout'));
const AddCreditsModal = React.lazy(() => import('@/components/credits/AddCreditsModal'));
const CreditBalanceCard = React.lazy(() => import('@/components/credits/CreditBalanceCard'));

// Navigation configuration for employer dashboard
const employerNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/employers/dashboard',
    icon: BarChart3,
  },
  {
    name: 'Post a Job',
    href: '/employers/create-job-post',
    icon: Plus,
  },
  {
    name: 'My Job Listings',
    href: '/employers/my-jobs',
    icon: Briefcase,
  },
  {
    name: 'Applicants',
    href: '/employers/applicants',
    icon: Users,
  },
  {
    name: 'Credits & Upgrades',
    href: '/employers/credits',
    icon: CreditCard,
  },
  {
    name: 'Social Graphics',
    href: '/employers/social-graphics',
    icon: Share2,
  },
  {
    name: 'Help / Support',
    href: '/employers/help',
    icon: HelpCircle,
  },
];

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
  profileViews: number;
  responseRate: number;
}

interface JobListing {
  id: string;
  title: string;
  location: string;
  type: string;
  postedDate: string;
  applications: number;
  views: number;
  status: 'active' | 'paused' | 'expired';
  featured: boolean;
  urgent: boolean;
}

interface Applicant {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  appliedDate: string;
  status: 'new' | 'reviewed' | 'shortlisted' | 'rejected';
  matchScore: number;
  location: string;
}

// Component that uses search params - needs to be wrapped in Suspense
function DashboardContent() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Simplified auth state
  const isAuthenticated = isSignedIn && !!user;
  const isAuthLoading = !isLoaded;

  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    profileViews: 0,
    responseRate: 0,
  });

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [credits, setCredits] = useState({
    universal: 0,
    total: 0,
    jobPost: 0,
    featuredPost: 0,
    socialGraphic: 0,
  });
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  // BILLING REFACTOR: Add billing modal state
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showJobPostingCheckout, setShowJobPostingCheckout] = useState(false);
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  // Fetch real employer data
  useEffect(() => {
    const fetchEmployerData = async () => {
      try {
        // Fetch real employer stats
        const statsResponse = await fetch('/api/employers/dashboard-stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          // Set default stats if API fails
          setStats({
            totalJobs: 0,
            activeJobs: 0,
            totalApplications: 0,
            newApplications: 0,
            profileViews: 0,
            responseRate: 0,
          });
        }

        // Fetch real jobs data
        const jobsResponse = await fetch('/api/employers/my-jobs');
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          setJobs(jobsData.jobs || []);
        } else {
          setJobs([]);
        }

        // Fetch real applicants data
        const applicantsResponse = await fetch('/api/employers/applicants');
        if (applicantsResponse.ok) {
          const applicantsData = await applicantsResponse.json();
          setApplicants(applicantsData.applicants || []);
        } else {
          setApplicants([]);
        }

        // Fetch job posting credits
        const creditsResponse = await fetch('/api/job-posting/credits');
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json();
          setCredits(creditsData);
        } else {
          console.error('Credits API failed:', creditsResponse.status, await creditsResponse.text());
          // Set default credits on error
          setCredits({
            universal: 0,
            total: 0,
            jobPost: 0,
            featuredPost: 0,
            socialGraphic: 0,
          });
        }

        // Fetch subscription status
        const subscriptionResponse = await fetch('/api/employers/subscription/status');
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setHasActiveSubscription(subscriptionData.hasActiveSubscription || false);
        } else {
          console.error('Subscription API failed:', subscriptionResponse.status, await subscriptionResponse.text());
          // Set default subscription status on error
          setHasActiveSubscription(false);
        }

      } catch (error) {
        console.error('Error fetching employer data:', error);
        // Set empty data on error
        setStats({
          totalJobs: 0,
          activeJobs: 0,
          totalApplications: 0,
          newApplications: 0,
          profileViews: 0,
          responseRate: 0,
        });
        setJobs([]);
        setApplicants([]);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchEmployerData();
  }, []);

  // Handle authentication redirect in useEffect
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/employers/signin');
    } else if (isAuthenticated && user) {
      // Check if user needs onboarding
      checkOnboardingStatus();
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/employers/onboarding');
      if (response.ok) {
        const data = await response.json();

        // If user hasn't completed employer onboarding, redirect to onboarding
        if (!data.onboardingCompleted) {
          router.push('/employers/onboarding');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking employer onboarding status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      case 'new':
        return 'text-blue-600 bg-blue-100';
      case 'reviewed':
        return 'text-purple-600 bg-purple-100';
      case 'shortlisted':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  };

  // Handle different job posting options
  const handlePostJobClick = () => {
    // Show job posting checkout for premium packages
    setShowJobPostingCheckout(true);
  };

  const handleFreePostJobClick = () => {
    // Direct to free basic job posting
    router.push('/employers/post-job-simple');
  };

  const handleBillingSuccess = () => {
    setShowBillingModal(false);
    // After successful billing, redirect to AI job posting
    router.push('/employers/create-job-post');
  };

  const handleJobPostingCheckoutSuccess = () => {
    setShowJobPostingCheckout(false);
    // Refresh the page to show updated credits
    window.location.reload();
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
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

  return (
    <DashboardLayout
      navigation={employerNavigation}
      title="Employer Hub"
      subtitle={`Welcome back, ${user?.firstName || 'there'}!`}
      user={{
        name: user?.fullName || '',
        email: user?.primaryEmailAddress?.emailAddress || '',
        initials: user?.firstName?.[0] + user?.lastName?.[0] || 'U',
      }}
      headerActions={
        <Button onClick={handlePostJobClick} className="bg-[#ff6b35] hover:bg-[#e55a2b]">
          <Plus className="mr-2 h-4 w-4" />
          Post a Job
        </Button>
      }
      searchPlaceholder="Search jobs, applicants..."
    >
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <MetricCard
            title="Job Posts"
            value={stats.activeJobs}
            icon={<Briefcase className="h-6 w-6" />}
            color="blue"
            trend={{
              value: 12,
              isPositive: true,
              label: "vs last month"
            }}
            onClick={() => router.push('/employers/my-jobs')}
          />
          <MetricCard
            title="Applicants"
            value={stats.totalApplications}
            icon={<Users className="h-6 w-6" />}
            color="green"
            trend={{
              value: 8,
              isPositive: true,
              label: "vs last month"
            }}
            onClick={() => router.push('/employers/applicants')}
          />
          <MetricCard
            title="Featured Posts"
            value={jobs.filter(job => job.featured).length}
            icon={<Star className="h-6 w-6" />}
            color="orange"
            onClick={() => router.push('/employers/my-jobs?filter=featured')}
          />
        </div>

        {/* Credit Alerts - Show at top if there are any */}
        <CreditAlertsWidget />

        {/* Enhanced Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* AI Matching Performance */}
          <AIMatchingWidget />

          {/* Job Performance Analytics */}
          <JobPerformanceWidget />

          {/* Credit Usage */}
          <CreditUsageWidget />
        </div>

        {/* Secondary Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Applications */}
          <RecentApplicationsWidget />

          {/* Hiring Pipeline */}
          <HiringPipelineWidget />
        </div>

        {/* Quick Actions Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <EmployerQuickActionsWidget />

          {/* Latest Activity Widget - Simplified */}
          <WidgetCard
            title="Latest Activity"
            subtitle="Recent posts and applications"
            className="lg:col-span-2"
          >
            <div className="space-y-4">
              {applicants.slice(0, 3).map((applicant, index) => (
                <ActivityItem
                  key={index}
                  title={`New application from ${applicant.name}`}
                  description={`Applied for ${applicant.jobTitle} • ${applicant.location}`}
                  time={getDaysAgo(applicant.appliedDate)}
                  icon={<UserCheck className="h-4 w-4 text-blue-600" />}
                  badge={{
                    text: applicant.status,
                    variant: applicant.status === 'new' ? 'default' : 'secondary'
                  }}
                />
              ))}
              {applicants.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                  <p className="text-sm">Applications will appear here</p>
                </div>
              )}
            </div>
          </WidgetCard>
        </div>

        {/* Additional Widgets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Upcoming Expiry */}
          <WidgetCard
            title="Upcoming Expiry"
            subtitle="Jobs expiring soon"
          >
            <div className="space-y-3">
              {jobs.filter(job => job.status === 'active').slice(0, 3).map((job, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-600">{job.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-700">
                      Expires in {Math.floor(Math.random() * 7) + 1} days
                    </p>
                    <Button variant="outline" size="sm" className="mt-1">
                      Extend
                    </Button>
                  </div>
                </div>
              ))}
              {jobs.filter(job => job.status === 'active').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No jobs expiring soon</p>
                </div>
              )}
            </div>
          </WidgetCard>

          {/* Applicant Funnel */}
          <WidgetCard
            title="Applicant Funnel"
            subtitle="Application to interview pipeline"
          >
            <StatsGrid
              stats={[
                {
                  label: "Views",
                  value: stats.profileViews,
                  change: { value: 15, isPositive: true }
                },
                {
                  label: "Applications",
                  value: stats.totalApplications,
                  change: { value: 8, isPositive: true }
                },
                {
                  label: "Interviews",
                  value: Math.floor(stats.totalApplications * 0.2),
                  change: { value: 5, isPositive: true }
                },
                {
                  label: "Hired",
                  value: Math.floor(stats.totalApplications * 0.05),
                  change: { value: 2, isPositive: true }
                }
              ]}
            />
          </WidgetCard>
        </div>

      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        {showBillingModal && (
          <BillingModal
            isOpen={showBillingModal}
            onClose={() => setShowBillingModal(false)}
            onSuccess={handleBillingSuccess}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showJobPostingCheckout && (
          <JobPostingCheckout
            isOpen={showJobPostingCheckout}
            onClose={() => setShowJobPostingCheckout(false)}
            onSuccess={handleJobPostingCheckoutSuccess}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showAddCreditsModal && (
          <AddCreditsModal
            isOpen={showAddCreditsModal}
            onClose={() => setShowAddCreditsModal(false)}
            onSuccess={() => {
              setShowAddCreditsModal(false);
              window.location.reload();
            }}
          />
        )}
      </Suspense>
    </DashboardLayout>
  );

}



// Main export component with Suspense boundary
export default function EmployerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
