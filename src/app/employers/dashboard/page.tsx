'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Users,
  Briefcase,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

interface SimpleStats {
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
  credits: number;
}

export default function SimpleEmployerDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<SimpleStats>({
    activeJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    credits: 0,
  });

  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Simple auth check - middleware handles onboarding verification
  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      router.push('/sign-in');
      return;
    }
    
    // Middleware has already verified onboarding, so we can proceed
    setOnboardingChecked(true);
  }, [user, isLoaded, router]);

  // Load data only after onboarding is verified
  useEffect(() => {
    if (!onboardingChecked) return;
    
    const fetchData = async () => {
      try {
        // Fetch simplified stats and credits in parallel
        const [statsResponse, creditsResponse] = await Promise.all([
          fetch('/api/employers/dashboard-stats'),
          fetch('/api/job-posting/credits')
        ]);
        
        let statsData: any = {};
        let creditsData: any = { credits: { total: 0 } };
        
        if (statsResponse.ok) {
          statsData = await statsResponse.json();
        }
        
        if (creditsResponse.ok) {
          creditsData = await creditsResponse.json();
        }
        
        setStats({
          activeJobs: statsData.activeJobs || 0,
          totalApplications: statsData.totalApplications || 0,
          newApplications: statsData.newApplications || 0,
          credits: creditsData.credits?.total || 0,
        });
        
        // Fetch recent jobs (just 2-3 for simplicity)
        const jobsResponse = await fetch('/api/employers/my-jobs?limit=3');
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          setRecentJobs(jobsData.jobs || []);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [onboardingChecked]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2d4a3e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Smart next step logic
  const getNextStep = () => {
    if (stats.activeJobs === 0) {
      return {
        title: "Post your first job",
        subtitle: "Start finding great candidates today",
        action: "Post a Job",
        href: "/employers/create-job-post",
        icon: Plus,
      };
    } else if (stats.newApplications > 0) {
      return {
        title: `${stats.newApplications} new applications`,
        subtitle: "Review candidates for your jobs",
        action: "Review Applications",
        href: "/employers/applicants",
        icon: Users,
      };
    } else {
      return {
        title: "Your jobs are live",
        subtitle: "Share them to get more applications",
        action: "Manage Jobs",
        href: "/employers/my-jobs",
        icon: Briefcase,
      };
    }
  };

  const nextStep = getNextStep();
  const NextStepIcon = nextStep.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Good morning! 👋
              </h1>
              <p className="text-gray-600">
                Let's find you some great candidates
              </p>
            </div>
            <Link
              href="/employers/post-job"
              className="inline-flex items-center px-6 py-3 bg-[#2d4a3e] text-white rounded-xl font-medium hover:bg-[#1d3a2e] transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5 mr-2" />
              Post a Job
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Smart Next Step - Apple style prominent action */}
        <div className="bg-gradient-to-r from-[#2d4a3e] to-[#ff6b35] rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                <NextStepIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">{nextStep.title}</h2>
                <p className="text-white/80">{nextStep.subtitle}</p>
              </div>
            </div>
            <Link
              href={nextStep.href}
              className="inline-flex items-center px-6 py-3 bg-white text-[#2d4a3e] rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              {nextStep.action}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Simple Stats - Only what matters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#2d4a3e] mb-1">
                {stats.activeJobs}
              </div>
              <div className="text-sm text-gray-600">Active Jobs</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#ff6b35] mb-1">
                {stats.totalApplications}
              </div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#9fdf9f] mb-1">
                {stats.newApplications}
              </div>
              <div className="text-sm text-gray-600">New Applications</div>
              {stats.newApplications > 0 && (
                <div className="inline-flex items-center mt-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Needs review
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {stats.credits}
              </div>
              <div className="text-sm text-gray-600 mb-2">Job Credits</div>
              {stats.credits === 0 ? (
                <Link
                  href="/employers/credits/checkout"
                  className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs hover:bg-purple-200 transition-colors"
                >
                  💎 Buy Credits
                </Link>
              ) : (
                <Link
                  href="/employers/credits/checkout"
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
                >
                  📊 Manage Credits
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity - Simple and clean */}
        {recentJobs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Your Jobs</h3>
                <Link
                  href="/employers/my-jobs"
                  className="text-sm text-[#2d4a3e] hover:text-[#1d3a2e] font-medium"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {recentJobs.slice(0, 3).map((job: any, index) => (
                <div key={job.id || index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        {job.title || 'Job Title'}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{job.location || 'Location'}</span>
                        <span>•</span>
                        <span>{job.applications || 0} applications</span>
                        {job.status === 'active' && (
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/employers/job/${job.id}`}
                      className="text-[#2d4a3e] hover:text-[#1d3a2e] font-medium text-sm"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* First Time User - Clean onboarding */}
        {stats.activeJobs === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-[#2d4a3e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#2d4a3e]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to start hiring?
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Post your first job and start receiving applications from qualified candidates in the Central Valley.
            </p>
            <Link
              href="/employers/create-job-post"
              className="inline-flex items-center px-8 py-3 bg-[#2d4a3e] text-white rounded-xl font-medium hover:bg-[#1d3a2e] transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Post Your First Job
            </Link>
          </div>
        )}

        {/* Quick Help - Minimal but accessible */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-2">
            Need help getting started?
          </p>
          <Link
            href="/employers/contact"
            className="text-sm text-[#2d4a3e] hover:text-[#1d3a2e] font-medium"
          >
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  );
}
