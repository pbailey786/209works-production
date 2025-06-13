'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import { LazyOnVisible } from '@/components/ui/lazy-component';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
const BillingModal = React.lazy(() => import('@/components/billing/BillingModal'));
const JobPostingCheckout = React.lazy(() => import('@/components/job-posting/JobPostingCheckout'));
const AddCreditsModal = React.lazy(() => import('@/components/credits/AddCreditsModal'));
const CreditBalanceCard = React.lazy(() => import('@/components/credits/CreditBalanceCard'));

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';
  const isPosted = searchParams.get('posted') === 'true';
  const isPurchaseSuccess = searchParams.get('purchase_success') === 'true' || searchParams.get('credit_purchase_success') === 'true';

  // Debug session
  console.log('🏢 Dashboard - Session status:', status);
  console.log('🏢 Dashboard - Session data:', session);
  console.log('🏢 Dashboard - User:', session?.user);

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
  const [isLoading, setIsLoading] = useState(true);
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
        }

        // Fetch subscription status
        const subscriptionResponse = await fetch('/api/employers/subscription/status');
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setHasActiveSubscription(subscriptionData.hasActiveSubscription || false);
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
        setIsLoading(false);
      }
    };

    fetchEmployerData();
  }, []);

  // Handle authentication redirect in useEffect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/employers/signin');
    } else if (status === 'authenticated' && session?.user) {
      // Check if user needs onboarding
      checkOnboardingStatus();
    }
  }, [status, router, session]);

  // Handle purchase success - refresh credits
  useEffect(() => {
    if (isPurchaseSuccess && status === 'authenticated') {
      // Refresh credits after a short delay to ensure webhook has processed
      const refreshCredits = async () => {
        try {
          const creditsResponse = await fetch('/api/job-posting/credits');
          if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json();
            setCredits(creditsData);
          }
        } catch (error) {
          console.error('Error refreshing credits:', error);
        }
      };

      // Refresh immediately and then after 2 seconds to catch any delayed webhook processing
      refreshCredits();
      const timeoutId = setTimeout(refreshCredits, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [isPurchaseSuccess, status]);

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

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
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
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Banner */}
      {isWelcome && (
        <div className="border-b border-[#2d4a3e]/20 bg-gradient-to-r from-[#2d4a3e]/10 to-[#9fdf9f]/20">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-[#9fdf9f]/30 p-3">
                  <CheckCircle className="h-8 w-8 text-[#2d4a3e]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#2d4a3e]">
                    🎉 Welcome to 209.works!
                  </h3>
                  <p className="mt-1 text-gray-600">
                    Your account is ready. Let's post your first job and start
                    finding great candidates!
                  </p>
                </div>
              </div>
              <button
                onClick={handlePostJobClick}
                className="rounded-lg bg-[#2d4a3e] px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-[#1d3a2e]"
              >
                Post Your First Job →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {isPosted && (
        <div className="border-b border-[#9fdf9f]/30 bg-gradient-to-r from-[#9fdf9f]/20 to-[#2d4a3e]/10">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <div className="mr-3 rounded-full bg-[#9fdf9f]/30 p-2">
                <CheckCircle className="h-6 w-6 text-[#2d4a3e]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#2d4a3e]">
                  Job Posted Successfully! 🚀
                </h3>
                <p className="text-gray-600">
                  Your job is now live and candidates can start applying.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Success Banner */}
      {isPurchaseSuccess && (
        <div className="border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3 rounded-full bg-green-100 p-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Credits Purchased Successfully! 💳
                  </h3>
                  <p className="text-gray-600">
                    Your job credits have been added to your account. You can now post jobs!
                  </p>
                </div>
              </div>
              <div className="flex items-center rounded-lg bg-green-100 px-3 py-2">
                <Sparkles className="mr-2 h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {credits.jobPost} Credits Available
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2d4a3e]">
              Hey {session?.user?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="mt-1 text-gray-600">
              Everything you need to hire great people, simplified.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePostJobClick}
              className="flex items-center rounded-lg bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-[#1d3a2e] hover:to-[#e55a2b]"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Post a Job
            </button>
            <button
              onClick={() => router.push('/employers/bulk-upload')}
              className="flex items-center rounded-lg bg-gradient-to-r from-[#2d4a3e] to-[#9fdf9f] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-[#1d3a2e] hover:to-[#8fcf8f]"
            >
              <Upload className="mr-2 h-5 w-5" />
              Bulk Upload
            </button>
            <button
              onClick={handleFreePostJobClick}
              className="flex items-center rounded-lg bg-[#ff6b35] px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-[#e55a2b]"
            >
              <Plus className="mr-2 h-5 w-5" />
              Quick Post (Free)
            </button>
          </div>
        </div>

        {/* Simple Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2d4a3e]/10">
                <Briefcase className="h-6 w-6 text-[#2d4a3e]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeJobs}
                </p>
                <p className="text-sm text-gray-600">Active Jobs</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#9fdf9f]/30">
                <Users className="h-6 w-6 text-[#2d4a3e]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalApplications}
                </p>
                <p className="text-sm text-gray-600">Applications</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff6b35]/10">
                <Eye className="h-6 w-6 text-[#ff6b35]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.profileViews.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Profile Views</p>
              </div>
            </div>
          </div>

          <Suspense fallback={
            <div className="rounded-xl border p-6 shadow-sm border-gray-200 bg-white">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-4 h-12 w-12 bg-gray-200 rounded-lg"></div>
                    <div>
                      <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-10 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          }>
            <CreditBalanceCard
              credits={{
                universal: credits.universal || 0,
                total: credits.total || (credits.jobPost + (credits.featuredPost || 0) + (credits.socialGraphic || 0)),
                expiringCount: 0, // Will be loaded from API
                expiringDate: undefined,
                // Legacy fields for backward compatibility
                jobPost: credits.jobPost,
                featuredPost: credits.featuredPost || 0,
                socialGraphic: credits.socialGraphic || 0,
              }}
              hasActiveSubscription={hasActiveSubscription}
              onAddCredits={() => setShowAddCreditsModal(true)}
              onSubscribe={() => setShowBillingModal(true)}
            />
          </Suspense>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Your Jobs - Lazy loaded */}
          <LazyOnVisible
            fallback={
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="p-6 space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            }
          >
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#2d4a3e]">
                  Your Jobs
                </h2>
                <Link
                  href="/employers/my-jobs"
                  className="text-sm font-medium text-[#ff6b35] hover:text-[#e55a2b]"
                >
                  View All →
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {jobs.slice(0, 3).map(job => (
                <div
                  key={job.id}
                  className="p-6 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 text-lg font-medium text-gray-900">
                        {job.title}
                      </h3>
                      <div className="mb-3 flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <Users className="mr-1 h-4 w-4" />
                          {job.applications} applications
                        </span>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(job.status)}`}
                      >
                        {job.status.charAt(0).toUpperCase() +
                          job.status.slice(1)}
                      </span>
                    </div>
                    <Link
                      href={`/employers/job/${job.id}`}
                      className="rounded-lg bg-[#2d4a3e]/10 px-4 py-2 text-sm font-medium text-[#2d4a3e] transition-colors hover:bg-[#2d4a3e]/20"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {jobs.length === 0 && (
              <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2d4a3e]/10">
                  <Briefcase className="h-8 w-8 text-[#2d4a3e]" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-[#2d4a3e]">
                  Ready to hire?
                </h3>
                <p className="mb-6 text-gray-600">
                  Use your credits to post your first job and start finding great candidates.
                </p>
                <button
                  onClick={handlePostJobClick}
                  className="rounded-lg bg-[#2d4a3e] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#1d3a2e]"
                >
                  Post Your First Job
                </button>
              </div>
            )}
          </div>
          </LazyOnVisible>

          {/* Quick Actions - Lazy loaded */}
          <LazyOnVisible
            fallback={
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="p-6 space-y-4">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            }
          >
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-[#2d4a3e]">
                Quick Actions
              </h2>
            </div>

            <div className="space-y-4 p-6">
              <button
                onClick={handlePostJobClick}
                className="group flex w-full items-center justify-between rounded-lg border-2 border-[#2d4a3e]/20 bg-gradient-to-r from-[#2d4a3e]/10 to-[#9fdf9f]/20 p-4 transition-all hover:from-[#2d4a3e]/20 hover:to-[#9fdf9f]/30"
              >
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35]">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2d4a3e]">
                      Post a Job
                    </p>
                    <p className="text-sm text-gray-600">
                      Use your credits to create compelling job listings with AI
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#2d4a3e]" />
              </button>

              <Link
                href="/employers/applicants"
                className="group flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-[#9fdf9f]/10"
              >
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#9fdf9f]/30">
                    <Users className="h-5 w-5 text-[#2d4a3e]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Review Applications
                    </p>
                    <p className="text-sm text-gray-600">
                      {stats.totalApplications} waiting for review
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#2d4a3e]" />
              </Link>

              <Link
                href="/employers/my-jobs"
                className="group flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-[#2d4a3e]/5"
              >
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2d4a3e]/10">
                    <Briefcase className="h-5 w-5 text-[#2d4a3e]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Manage Jobs</p>
                    <p className="text-sm text-gray-600">
                      Edit, pause, or boost your listings
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#2d4a3e]" />
              </Link>

              <Link
                href="/employers/settings-simple"
                className="group flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-[#ff6b35]/5"
              >
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff6b35]/10">
                    <Settings className="h-5 w-5 text-[#ff6b35]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Account Settings
                    </p>
                    <p className="text-sm text-gray-600">
                      Profile, billing, and preferences
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#ff6b35]" />
              </Link>
            </div>
          </div>
          </LazyOnVisible>
        </div>

        {/* Simple Help Section */}
        <div className="mt-8 rounded-xl border border-[#2d4a3e]/20 bg-gradient-to-r from-[#2d4a3e]/10 to-[#ff6b35]/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-[#2d4a3e]">
                Need help getting started?
              </h3>
              <p className="text-gray-600">
                We're here to help you find the perfect candidates for your
                team.
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/employers/pricing"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                View Pricing
              </Link>
              <Link
                href="/employers/contact"
                className="rounded-lg bg-[#2d4a3e] px-4 py-2 font-medium text-white transition-colors hover:bg-[#1d3a2e]"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* BILLING REFACTOR: Billing modal triggered when posting jobs */}
      {showBillingModal && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><Skeleton className="h-96 w-96 rounded-lg" /></div>}>
          <BillingModal
            isOpen={showBillingModal}
            onClose={() => setShowBillingModal(false)}
            onSuccess={handleBillingSuccess}
            trigger="job-posting"
            title="Choose Your Plan to Post Jobs"
            description="Select a subscription plan to start posting jobs and finding great candidates in the 209 area."
          />
        </Suspense>
      )}

      {/* Job Posting Checkout Modal */}
      {showJobPostingCheckout && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><Skeleton className="h-96 w-96 rounded-lg" /></div>}>
          <JobPostingCheckout
            isOpen={showJobPostingCheckout}
            onClose={() => setShowJobPostingCheckout(false)}
            onSuccess={handleJobPostingCheckoutSuccess}
            userCredits={credits}
          />
        </Suspense>
      )}

      {/* Add Credits Modal */}
      {showAddCreditsModal && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><Skeleton className="h-96 w-96 rounded-lg" /></div>}>
          <AddCreditsModal
            isOpen={showAddCreditsModal}
            onClose={() => setShowAddCreditsModal(false)}
            onSuccess={() => {
              setShowAddCreditsModal(false);
              // Refresh credits data
              window.location.reload();
            }}
          />
        </Suspense>
      )}
    </div>
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
