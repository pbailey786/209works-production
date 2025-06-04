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
} from 'lucide-react';
import BillingModal from '@/components/billing/BillingModal';

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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  // BILLING REFACTOR: Add billing modal state
  const [showBillingModal, setShowBillingModal] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalJobs: 12,
        activeJobs: 8,
        totalApplications: 156,
        newApplications: 23,
        profileViews: 1240,
        responseRate: 85,
      });

      setJobs([
        {
          id: '1',
          title: 'Customer Service Representative',
          location: 'Stockton, CA',
          type: 'Full-time',
          postedDate: '2025-01-10',
          applications: 34,
          views: 128,
          status: 'active',
          featured: true,
          urgent: false,
        },
        {
          id: '2',
          title: 'Warehouse Associate',
          location: 'Modesto, CA',
          type: 'Full-time',
          postedDate: '2025-01-08',
          applications: 28,
          views: 95,
          status: 'active',
          featured: false,
          urgent: true,
        },
        {
          id: '3',
          title: 'Administrative Assistant',
          location: 'Fresno, CA',
          type: 'Part-time',
          postedDate: '2025-01-05',
          applications: 19,
          views: 67,
          status: 'active',
          featured: false,
          urgent: false,
        },
        {
          id: '4',
          title: 'Sales Associate',
          location: 'Tracy, CA',
          type: 'Full-time',
          postedDate: '2024-12-28',
          applications: 42,
          views: 156,
          status: 'expired',
          featured: false,
          urgent: false,
        },
      ]);

      setApplicants([
        {
          id: '1',
          name: 'Maria Rodriguez',
          email: 'maria.r@email.com',
          jobTitle: 'Customer Service Representative',
          appliedDate: '2025-01-15',
          status: 'new',
          matchScore: 92,
          location: 'Stockton, CA',
        },
        {
          id: '2',
          name: 'James Wilson',
          email: 'j.wilson@email.com',
          jobTitle: 'Warehouse Associate',
          appliedDate: '2025-01-15',
          status: 'new',
          matchScore: 88,
          location: 'Modesto, CA',
        },
        {
          id: '3',
          name: 'Sarah Chen',
          email: 'sarah.chen@email.com',
          jobTitle: 'Administrative Assistant',
          appliedDate: '2025-01-14',
          status: 'reviewed',
          matchScore: 85,
          location: 'Fresno, CA',
        },
        {
          id: '4',
          name: 'David Martinez',
          email: 'd.martinez@email.com',
          jobTitle: 'Customer Service Representative',
          appliedDate: '2025-01-14',
          status: 'shortlisted',
          matchScore: 90,
          location: 'Stockton, CA',
        },
      ]);

      setIsLoading(false);
    }, 1000);
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

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/profile/onboarding');
      if (response.ok) {
        const data = await response.json();

        // If user hasn't completed onboarding, redirect to onboarding
        if (!data.user?.onboardingCompleted) {
          router.push('/onboarding');
          return;
        }

        // If user is not an employer, redirect to job seeker dashboard
        if (data.user?.role !== 'employer') {
          router.push('/dashboard');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
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

  // BILLING REFACTOR: Handle job posting clicks - show billing modal instead of direct navigation
  const handlePostJobClick = () => {
    setShowBillingModal(true);
  };

  const handleBillingSuccess = () => {
    setShowBillingModal(false);
    // After successful billing, redirect to job posting
    router.push('/employers/create-job-post');
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
        <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
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
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Post Your First Job →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {isPosted && (
        <div className="border-b border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <div className="mr-3 rounded-full bg-green-100 p-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
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

      {/* Simplified Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hey {session?.user?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="mt-1 text-gray-600">
              Everything you need to hire great people, simplified.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePostJobClick}
              className="flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-green-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-green-700"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Post a Job
            </button>
            <button
              onClick={handlePostJobClick}
              className="flex items-center rounded-lg bg-gray-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-gray-700"
            >
              <Plus className="mr-2 h-5 w-5" />
              Quick Post
            </button>
          </div>
        </div>

        {/* Simple Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Briefcase className="h-6 w-6 text-blue-600" />
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
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
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
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.profileViews.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Profile Views</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Your Jobs */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Jobs
                </h2>
                <Link
                  href="/employers/my-jobs"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
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
                      className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {jobs.length === 0 && (
              <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Ready to hire?
                </h3>
                <p className="mb-6 text-gray-600">
                  Post your first job and start finding great candidates.
                </p>
                <button
                  onClick={handlePostJobClick}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Post Your First Job
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Quick Actions
              </h2>
            </div>

            <div className="space-y-4 p-6">
              <button
                onClick={handlePostJobClick}
                className="group flex w-full items-center justify-between rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-green-50 p-4 transition-all hover:from-blue-100 hover:to-green-100"
              >
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-green-500">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Post a Job
                    </p>
                    <p className="text-sm text-gray-600">
                      Create compelling job listings with AI
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
              </button>

              <Link
                href="/employers/applicants"
                className="group flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <Users className="h-5 w-5 text-green-600" />
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
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
              </Link>

              <Link
                href="/employers/my-jobs"
                className="group flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Manage Jobs</p>
                    <p className="text-sm text-gray-600">
                      Edit, pause, or boost your listings
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
              </Link>

              <Link
                href="/employers/settings-simple"
                className="group flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <Settings className="h-5 w-5 text-purple-600" />
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
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
              </Link>
            </div>
          </div>
        </div>

        {/* Simple Help Section */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Need help getting started?
              </h3>
              <p className="text-gray-600">
                We're here to help you find the perfect candidates for your
                team.
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/employers/pricing-simple"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                View Pricing
              </Link>
              <Link
                href="/employers/contact"
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* BILLING REFACTOR: Billing modal triggered when posting jobs */}
      <BillingModal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        onSuccess={handleBillingSuccess}
        trigger="job-posting"
        title="Choose Your Plan to Post Jobs"
        description="Select a subscription plan to start posting jobs and finding great candidates in the 209 area."
      />
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
