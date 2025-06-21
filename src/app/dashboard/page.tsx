'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { DashboardLayout, type NavigationItem } from '@/components/dashboard/DashboardLayout';
import {
  MetricCard,
  WidgetCard,
  ActivityItem,
  QuickAction,
  StatsGrid
} from '@/components/dashboard/DashboardCards';
import {
  RecentChatsWidget,
  SavedSearchesWidget,
  JobsGPTStatsWidget
} from '@/components/dashboard/JobsGPTWidgets';
import {
  ApplicationStatsWidget,
  JobRecommendationsWidget,
  ProfileCompletionWidget
} from '@/components/dashboard/JobSeekerWidgets';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Search,
  Bookmark,
  Send,
  User,
  Settings,
  Sparkles,
  MessageSquare,
  Heart,
  Target,
  Building,
  FileText,
  MapPin,
  AlertCircle
} from 'lucide-react';

// Navigation configuration for job seeker dashboard
const jobSeekerNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3
  },
  {
    name: 'Search Jobs',
    href: '/jobs',
    icon: Search
  },
  {
    name: 'Saved Jobs',
    href: '/saved-jobs',
    icon: Bookmark
  },
  {
    name: 'Applied Jobs',
    href: '/applications',
    icon: Send
  },
  {
    name: 'Resume & Profile',
    href: '/profile',
    icon: User
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings
  },
];

interface JobSeekerStats {
  savedJobs: number;
  appliedJobs: number;
  matchesSuggested: number;
  profileViews: number;
  interviewRequests: number;
}

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  appliedDate: string;
  status: 'pending' | 'viewed' | 'interview' | 'rejected' | 'offer';
  location: string;
}

interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore: number;
  postedDate: string;
  salary?: string;
}

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [stats, setStats] = useState<JobSeekerStats>({
    savedJobs: 0,
    appliedJobs: 0,
    matchesSuggested: 0,
    profileViews: 0,
    interviewRequests: 0
  });

  const [applications, setApplications] = useState<Application[]>([]);
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Simplified auth state
  const isAuthenticated = isSignedIn && !!user;
  const isAuthLoading = !isLoaded;

  // Fetch job seeker data
  useEffect(() => {
    const fetchJobSeekerData = async () => {
      try {
        // Fetch job seeker stats
        const statsResponse = await fetch('/api/jobseeker/dashboard-stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          // Set default stats if API fails
          setStats({
            savedJobs: 5,
            appliedJobs: 12,
            matchesSuggested: 8,
            profileViews: 23,
            interviewRequests: 2
          });
        }

        // Fetch applications
        const applicationsResponse = await fetch('/api/jobseeker/applications');
        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json();
          setApplications(applicationsData.applications || []);
        } else {
          // Set mock data for demo
          setApplications([
            {
              id: '1',
              jobTitle: 'Frontend Developer',
              company: 'Tech Startup',
              appliedDate: '2025-01-15',
              status: 'interview',
              location: 'Stockton, CA'
            },
            {
              id: '2',
              jobTitle: 'Marketing Coordinator',
              company: 'Local Business',
              appliedDate: '2025-01-14',
              status: 'viewed',
              location: 'Modesto, CA'
            }
          ]);
        }

        // Fetch job matches
        const matchesResponse = await fetch('/api/jobseeker/matches');
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setJobMatches(matchesData.matches || []);
        } else {
          // Set mock data for demo
          setJobMatches([
            {
              id: '1',
              title: 'Software Engineer',
              company: 'Valley Tech',
              location: 'Stockton, CA',
              matchScore: 95,
              postedDate: '2025-01-16',
              salary: '$70,000 - $90,000'
            },
            {
              id: '2',
              title: 'UX Designer',
              company: 'Creative Agency',
              location: 'Modesto, CA',
              matchScore: 88,
              postedDate: '2025-01-15',
              salary: '$60,000 - $75,000'
            }
          ]);
        }

      } catch (error) {
        console.error('Error fetching job seeker data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchJobSeekerData();
    }
  }, [isAuthenticated]);

  // Handle authentication redirect
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'viewed':
        return 'text-blue-600 bg-blue-100';
      case 'interview':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'offer':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
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
      navigation={jobSeekerNavigation}
      title="Job Seeker"
      subtitle={`Welcome back, ${user?.firstName || 'there'}!`}
      user={{
        name: user?.fullName || '',
        email: user?.primaryEmailAddress?.emailAddress || '',
        initials: user?.firstName?.[0] + user?.lastName?.[0] || 'U'
      }}
      headerActions={
        <Button onClick={() => router.push('/jobs')} className="bg-[#ff6b35] hover:bg-[#e55a2b]">
          <Search className="mr-2 h-4 w-4" />
          Search Jobs
        </Button>
      }
      searchPlaceholder="Search jobs, companies..."
    >
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* JobsGPT Quick Access */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Meet Rust Moreno</h3>
                <p className="text-orange-100">Your AI job search assistant for the 209 area</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/chat')}
              className="bg-white text-orange-600 hover:bg-orange-50"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Start Chat
            </Button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <MetricCard
            title="Saved Jobs"
            value={stats.savedJobs}
            icon={<Heart className="h-6 w-6" />}
            color="blue"
            onClick={() => router.push('/saved-jobs')}
          />
          <MetricCard
            title="Jobs Applied"
            value={stats.appliedJobs}
            icon={<Send className="h-6 w-6" />}
            color="green"
            trend={{
              value: 15,
              isPositive: true,
              label: "vs last month"
            }}
            onClick={() => router.push('/applications')}
          />
          <MetricCard
            title="Matches Suggested"
            value={stats.matchesSuggested}
            icon={<Target className="h-6 w-6" />}
            color="orange"
            onClick={() => router.push('/jobs?filter=matches')}
          />
        </div>

        {/* Job Seeker Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <ApplicationStatsWidget />
          <JobRecommendationsWidget />
          <ProfileCompletionWidget />
        </div>

        {/* JobsGPT Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <RecentChatsWidget />
          <SavedSearchesWidget />
          <JobsGPTStatsWidget />
        </div>

        {/* Main Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Should I Apply Results Widget */}
          <WidgetCard
            title="Should I Apply? Results"
            subtitle="Recent resume matches and recommendations"
          >
            <div className="space-y-4">
              {jobMatches.slice(0, 3).map((match, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{match.title}</h4>
                    <p className="text-sm text-gray-600">{match.company} • {match.location}</p>
                    {match.salary && (
                      <p className="text-sm text-green-600 font-medium">{match.salary}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-600">{match.matchScore}%</span>
                      <span className="text-xs text-gray-500">match</span>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      Apply Now
                    </Button>
                  </div>
                </div>
              ))}
              {jobMatches.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No job matches yet</p>
                  <p className="text-sm">Complete your profile to get personalized matches</p>
                </div>
              )}
            </div>
          </WidgetCard>

          {/* Application Status Tracker */}
          <WidgetCard
            title="Application Status Tracker"
            subtitle="Track your job applications"
          >
            <div className="space-y-4">
              {applications.slice(0, 4).map((application, index) => (
                <ActivityItem
                  key={index}
                  title={application.jobTitle}
                  description={`${application.company} • ${application.location}`}
                  time={getDaysAgo(application.appliedDate)}
                  icon={<Building className="h-4 w-4 text-blue-600" />}
                  badge={{
                    text: application.status,
                    variant: application.status === 'interview' ? 'default' : 'secondary'
                  }}
                />
              ))}
              {applications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No applications yet</p>
                  <p className="text-sm">Start applying to jobs to track your progress</p>
                </div>
              )}
            </div>
          </WidgetCard>
        </div>

        {/* Additional Widgets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* New Matches Widget */}
          <WidgetCard
            title="New Matches"
            subtitle="Fresh job opportunities for you"
          >
            <div className="space-y-3">
              {jobMatches.slice(0, 3).map((match, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-medium text-gray-900">{match.title}</h4>
                    <p className="text-sm text-gray-600">{match.company}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{match.location}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{getDaysAgo(match.postedDate)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600 mb-2">
                      {match.matchScore}% match
                    </div>
                    <Button variant="outline" size="sm">
                      View Job
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </WidgetCard>

          {/* Quick Actions Widget */}
          <WidgetCard
            title="Quick Actions"
            subtitle="Get things done faster"
          >
            <div className="space-y-3">
              <QuickAction
                title="Search Jobs"
                description="Find your next opportunity"
                icon={<Search className="h-5 w-5 text-[#ff6b35]" />}
                onClick={() => router.push('/jobs')}
                variant="primary"
              />
              <QuickAction
                title="Update Profile"
                description="Keep your information current"
                icon={<User className="h-5 w-5 text-[#2d4a3e]" />}
                onClick={() => router.push('/profile')}
                variant="secondary"
              />
              <QuickAction
                title="Upload Resume"
                description="Add or update your resume"
                icon={<FileText className="h-5 w-5 text-gray-600" />}
                onClick={() => router.push('/profile/resume')}
              />
              <QuickAction
                title="Job Alerts"
                description="Set up personalized alerts"
                icon={<AlertCircle className="h-5 w-5 text-gray-600" />}
                onClick={() => router.push('/settings/alerts')}
              />
            </div>
          </WidgetCard>
        </div>

        {/* Profile Completion Progress */}
        <WidgetCard
          title="Profile Completion"
          subtitle="Complete your profile to get better matches"
        >
          <StatsGrid
            stats={[
              {
                label: "Profile Views",
                value: stats.profileViews,
                change: { value: 12, isPositive: true }
              },
              {
                label: "Interview Requests",
                value: stats.interviewRequests,
                change: { value: 25, isPositive: true }
              },
              {
                label: "Response Rate",
                value: "78%"
              },
              {
                label: "Profile Score",
                value: "85%"
              }
            ]}
          />
        </WidgetCard>
      </div>
    </DashboardLayout>
  );
}
