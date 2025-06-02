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
  Sparkles
} from 'lucide-react';

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
    responseRate: 0
  });

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

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
        responseRate: 85
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
          urgent: false
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
          urgent: true
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
          urgent: false
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
          urgent: false
        }
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
          location: 'Stockton, CA'
        },
        {
          id: '2',
          name: 'James Wilson',
          email: 'j.wilson@email.com',
          jobTitle: 'Warehouse Associate',
          appliedDate: '2025-01-15',
          status: 'new',
          matchScore: 88,
          location: 'Modesto, CA'
        },
        {
          id: '3',
          name: 'Sarah Chen',
          email: 'sarah.chen@email.com',
          jobTitle: 'Administrative Assistant',
          appliedDate: '2025-01-14',
          status: 'reviewed',
          matchScore: 85,
          location: 'Fresno, CA'
        },
        {
          id: '4',
          name: 'David Martinez',
          email: 'd.martinez@email.com',
          jobTitle: 'Customer Service Representative',
          appliedDate: '2025-01-14',
          status: 'shortlisted',
          matchScore: 90,
          location: 'Stockton, CA'
        }
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
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'new': return 'text-blue-600 bg-blue-100';
      case 'reviewed': return 'text-purple-600 bg-purple-100';
      case 'shortlisted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign-in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Banner */}
      {isWelcome && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">🎉 Welcome to 209.works!</h3>
                  <p className="text-gray-600 mt-1">Your account is ready. Let's post your first job and start finding great candidates!</p>
                </div>
              </div>
              <Link
                href="/employers/post-job-simple"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm"
              >
                Post Your First Job →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {isPosted && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Job Posted Successfully! 🚀</h3>
                <p className="text-gray-600">Your job is now live and candidates can start applying.</p>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Simplified Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hey {session?.user?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Everything you need to hire great people, simplified.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/employers/create-job-post"
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Job Post Optimizer
            </Link>
            <Link
              href="/employers/post-job-simple"
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Quick Post
            </Link>
          </div>
        </div>

        {/* Simple Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
                <p className="text-sm text-gray-600">Active Jobs</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                <p className="text-sm text-gray-600">Applications</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.profileViews.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Profile Views</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Your Jobs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Your Jobs</h2>
                <Link
                  href="/employers/my-jobs"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{job.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {job.applications} applications
                        </span>
                      </div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </div>
                    <Link
                      href={`/employers/job/${job.id}`}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
              </div>

            {jobs.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to hire?</h3>
                <p className="text-gray-600 mb-6">Post your first job and start finding great candidates.</p>
                <Link
                  href="/employers/post-job-simple"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Post Your First Job
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            </div>

            <div className="p-6 space-y-4">
              <Link
                href="/employers/create-job-post"
                className="flex items-center justify-between p-4 rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-green-50 hover:from-blue-100 hover:to-green-100 transition-all group"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center mr-3">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Job Post Optimizer</p>
                    <p className="text-sm text-gray-600">Create compelling job listings with AI</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </Link>

              <Link
                href="/employers/applicants"
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Review Applications</p>
                    <p className="text-sm text-gray-600">{stats.totalApplications} waiting for review</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </Link>

              <Link
                href="/employers/my-jobs"
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Manage Jobs</p>
                    <p className="text-sm text-gray-600">Edit, pause, or boost your listings</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </Link>

              <Link
                href="/employers/settings-simple"
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Account Settings</p>
                    <p className="text-sm text-gray-600">Profile, billing, and preferences</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </Link>
            </div>
          </div>
        </div>

        {/* Simple Help Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need help getting started?</h3>
              <p className="text-gray-600">We're here to help you find the perfect candidates for your team.</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/employers/pricing-simple"
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-200"
              >
                View Pricing
              </Link>
              <Link
                href="/employers/contact"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export component with Suspense boundary
export default function EmployerDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}