'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Heart,
  Bell,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  History,
  MessageSquare,
} from 'lucide-react';

interface SimpleStats {
  savedJobs: number;
  activeAlerts: number;
  applicationsSent: number;
}

interface RecentJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  postedAt: string;
  type: string;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  createdAt: string;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  lastActivity: string;
  sessionId: string;
}

interface ApplicationItem {
  id: string;
  job: {
    title: string;
    company: string;
  };
  status: string;
  appliedAt: string;
}

export default function SimpleJobSeekerDashboard() {
  const [stats, setStats] = useState<SimpleStats>({
    savedJobs: 0,
    activeAlerts: 0,
    applicationsSent: 0,
  });

  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [recentApplications, setRecentApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch simplified stats
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            savedJobs: data.savedJobs || 0,
            activeAlerts: data.activeAlerts || 0,
            applicationsSent: data.applicationsSubmitted || 0,
          });
        }
        
        // Fetch recent job recommendations (just 3 for simplicity)
        const jobsResponse = await fetch('/api/dashboard/job-recommendations?limit=3');
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          setRecentJobs(jobsData.recommendations || []);
        }

        // Fetch search history (last 5 searches)
        const searchResponse = await fetch('/api/search-history?limit=5');
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          setSearchHistory(searchData.searchHistory || []);
        }

        // Fetch chat history (last 3 conversations)
        const chatResponse = await fetch('/api/chat-history');
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          setChatHistory((chatData.conversations || []).slice(0, 3));
        }

        // Fetch recent applications (last 3)
        const applicationsResponse = await fetch('/api/profile/applications?tab=applied&limit=3');
        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json();
          setRecentApplications(applicationsData.applications || []);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    if (stats.savedJobs === 0 && stats.applicationsSent === 0) {
      return {
        title: "Start your job search",
        subtitle: "Find opportunities in the Central Valley",
        action: "Search Jobs",
        href: "/jobs",
        icon: Search,
      };
    } else if (stats.activeAlerts === 0) {
      return {
        title: "Set up job alerts",
        subtitle: "Get notified when new jobs match your criteria",
        action: "Create Alert",
        href: "/alerts",
        icon: Bell,
      };
    } else if (stats.savedJobs > 0) {
      return {
        title: `${stats.savedJobs} saved jobs waiting`,
        subtitle: "Review and apply to your saved opportunities",
        action: "View Saved Jobs",
        href: "/profile/applications?tab=saved",
        icon: Heart,
      };
    } else {
      return {
        title: "Keep your profile updated",
        subtitle: "Make sure employers can find you",
        action: "Update Profile",
        href: "/profile",
        icon: User,
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
                Welcome back! 👋
              </h1>
              <p className="text-gray-600">
                Let's find your next great opportunity
              </p>
            </div>
            <Link
              href="/jobs"
              className="inline-flex items-center px-6 py-3 bg-[#2d4a3e] text-white rounded-xl font-medium hover:bg-[#1d3a2e] transition-colors shadow-sm"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Jobs
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
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Link
            href="/profile/applications?tab=saved"
            className="bg-white rounded-xl p-6 border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-[#2d4a3e] mb-1">
                {stats.savedJobs}
              </div>
              <div className="text-sm text-gray-600">Saved Jobs</div>
            </div>
          </Link>
          
          <Link
            href="/alerts"
            className="bg-white rounded-xl p-6 border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-[#ff6b35] mb-1">
                {stats.activeAlerts}
              </div>
              <div className="text-sm text-gray-600">Active Alerts</div>
            </div>
          </Link>
          
          <Link
            href="/profile/applications?tab=applied"
            className="bg-white rounded-xl p-6 border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-[#9fdf9f] mb-1">
                {stats.applicationsSent}
              </div>
              <div className="text-sm text-gray-600">Applications Sent</div>
            </div>
          </Link>
        </div>

        {/* Recent Job Recommendations - Simple and clean */}
        {recentJobs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Recommended for You</h3>
                <Link
                  href="/jobs"
                  className="text-sm text-[#2d4a3e] hover:text-[#1d3a2e] font-medium"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {recentJobs.slice(0, 3).map((job, index) => (
                <div key={job.id || index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        {job.title}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {job.company}
                        </span>
                        <span>•</span>
                        <span>{job.location}</span>
                        {job.salary && (
                          <>
                            <span>•</span>
                            <span className="flex items-center">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {job.salary}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        Posted {job.postedAt}
                      </div>
                    </div>
                    <Link
                      href={`/jobs/${job.id}`}
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
        {stats.savedJobs === 0 && stats.applicationsSent === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-[#2d4a3e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#2d4a3e]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to find your next job?
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start your search for opportunities in the Central Valley. We'll help you find jobs that match your skills and interests.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/jobs"
                className="inline-flex items-center px-8 py-3 bg-[#2d4a3e] text-white rounded-xl font-medium hover:bg-[#1d3a2e] transition-colors"
              >
                <Search className="w-5 h-5 mr-2" />
                Start Job Search
              </Link>
              <Link
                href="/alerts"
                className="inline-flex items-center px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <Bell className="w-5 h-5 mr-2" />
                Set Up Alerts
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions - Minimal grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href="/profile"
            className="bg-white rounded-xl border border-gray-100 p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#2d4a3e]/10 rounded-lg flex items-center justify-center mr-4">
                <User className="w-5 h-5 text-[#2d4a3e]" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Update Profile</h4>
                <p className="text-sm text-gray-600">Keep your info current</p>
              </div>
            </div>
          </Link>

          <Link
            href="/profile/applications"
            className="bg-white rounded-xl border border-gray-100 p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#ff6b35]/10 rounded-lg flex items-center justify-center mr-4">
                <CheckCircle className="w-5 h-5 text-[#ff6b35]" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Applications</h4>
                <p className="text-sm text-gray-600">Track your progress</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Activity History Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 text-sm flex items-center">
                    <History className="w-4 h-4 mr-2 text-[#2d4a3e]" />
                    Recent Searches
                  </h3>
                  <Link
                    href="/search-history"
                    className="text-xs text-[#2d4a3e] hover:text-[#1d3a2e]"
                  >
                    View all →
                  </Link>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {searchHistory.slice(0, 3).map((search) => (
                  <div key={search.id} className="text-sm">
                    <div className="text-gray-900 truncate font-medium">
                      "{search.query}"
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(search.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 text-sm flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2 text-[#ff6b35]" />
                    Recent Chats
                  </h3>
                  <Link
                    href="/chat"
                    className="text-xs text-[#2d4a3e] hover:text-[#1d3a2e]"
                  >
                    View all →
                  </Link>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {chatHistory.map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/chat/${chat.sessionId}`}
                    className="block text-sm hover:bg-gray-50 p-1 rounded"
                  >
                    <div className="text-gray-900 truncate font-medium">
                      {chat.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(chat.lastActivity).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Applications */}
          {recentApplications.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 text-sm flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-[#9fdf9f]" />
                    Recent Applications
                  </h3>
                  <Link
                    href="/profile/applications"
                    className="text-xs text-[#2d4a3e] hover:text-[#1d3a2e]"
                  >
                    View all →
                  </Link>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {recentApplications.map((app) => (
                  <div key={app.id} className="text-sm">
                    <div className="text-gray-900 truncate font-medium">
                      {app.job.title}
                    </div>
                    <div className="text-xs text-gray-600">
                      {app.job.company}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-between">
                      <span>{new Date(app.appliedAt).toLocaleDateString()}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                        app.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'interview' ? 'bg-yellow-100 text-yellow-800' :
                        app.status === 'hired' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Help - Minimal but accessible */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-2">
            Need help with your job search?
          </p>
          <Link
            href="/support"
            className="text-sm text-[#2d4a3e] hover:text-[#1d3a2e] font-medium"
          >
            Get Support →
          </Link>
        </div>
      </div>
    </div>
  );
}
