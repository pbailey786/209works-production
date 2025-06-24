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
  Eye,
  Save,
} from 'lucide-react';
import SkillSuggestionCard from '../../components/profile/SkillSuggestionCard';

// Calculate profile strength based on profile completeness
function calculateProfileStrength(profile: any): number {
  if (!profile) return 0;
  
  let score = 0;
  const maxScore = 100;
  
  // Basic info (40 points)
  if (profile.name) score += 10;
  if (profile.email) score += 10;
  if (profile.location) score += 10;
  if (profile.bio) score += 10;
  
  // Skills (30 points)
  if (profile.skills && profile.skills.length > 0) {
    score += Math.min(30, profile.skills.length * 5); // 5 points per skill, max 30
  }
  
  // Experience (20 points)
  if (profile.currentJobTitle) score += 10;
  if (profile.educationExperience) score += 10;
  
  // Additional info (10 points)
  if (profile.phoneNumber) score += 5;
  if (profile.profilePicture) score += 5;
  
  return Math.min(score, maxScore);
}

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
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Save state management
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [showStoryBuilder, setShowStoryBuilder] = useState(false);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch simplified stats
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            savedJobs: data.stats?.savedJobs || 0,
            activeAlerts: data.stats?.activeAlerts || 0,
            applicationsSent: data.stats?.applicationsSubmitted || 0,
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

        // Fetch profile data for .works resume
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const profileWithStrength = {
            ...profileData.user,
            profileStrength: profileData.user.profileStrength || calculateProfileStrength(profileData.user)
          };
          setProfile(profileWithStrength);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Save profile data
  const saveProfile = async () => {
    if (!profile || !hasUnsavedChanges) return;
    
    setSaveStatus('saving');
    
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Add any profile fields that might be edited on dashboard
          profileStrength: profile.profileStrength,
          skills: profile.skills,
          name: profile.name,
          bio: profile.bio,
          location: profile.location,
          // Add other fields as needed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      
      // Clear saved status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges) {
      // Clear existing timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      // Set new auto-save timer for 30 seconds
      const timer = setTimeout(() => {
        saveProfile();
      }, 30000);
      
      setAutoSaveTimer(timer);
    }
    
    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [hasUnsavedChanges, profile]);

  // Manual save handler
  const handleManualSave = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      setAutoSaveTimer(null);
    }
    saveProfile();
  };

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
        
        {/* .works Resume Builder Hero */}
        <div className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 rounded-3xl p-8 text-white mb-8 shadow-2xl overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-6 shadow-lg border border-white/20">
                  <Sparkles className="w-8 h-8 text-white drop-shadow-sm" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2 text-white drop-shadow-sm tracking-tight">
                    Build Your .works Resume
                  </h2>
                  <p className="text-xl text-white/90 font-medium">
                    AI-powered career story that gets you hired in the 209
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {profile && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-white/90 font-medium">Story Progress</span>
                    {hasUnsavedChanges && (
                      <span className="ml-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-white/90 font-medium">{profile.profileStrength || 0}% Complete</span>
                    {saveStatus === 'saving' && (
                      <span className="text-yellow-300 text-sm">Saving...</span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="text-green-300 text-sm">✓ Saved</span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="text-red-300 text-sm">⚠ Save failed</span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${profile.profileStrength || 0}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowStoryBuilder(!showStoryBuilder)}
                className="inline-flex items-center px-8 py-4 bg-white text-purple-700 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 transform"
              >
                <Sparkles className="w-5 h-5 mr-3" />
                {showStoryBuilder ? 'Hide Builder' : 'Continue Building'}
              </button>
              
              <Link
                href="/profile"
                className="inline-flex items-center px-6 py-4 bg-white/20 backdrop-blur-sm text-white rounded-2xl font-semibold hover:bg-white/30 transition-all duration-200 border border-white/20"
              >
                <Eye className="w-5 h-5 mr-2" />
                View Story
              </Link>

              <Link
                href="/profile"
                className="inline-flex items-center px-6 py-4 bg-white/20 backdrop-blur-sm text-white rounded-2xl font-semibold hover:bg-white/30 transition-all duration-200 border border-white/20"
              >
                <User className="w-5 h-5 mr-2" />
                View Profile
              </Link>

              <button 
                onClick={handleManualSave}
                disabled={saveStatus === 'saving' || (!hasUnsavedChanges && saveStatus !== 'error')}
                className={`inline-flex items-center px-4 py-4 rounded-2xl font-semibold transition-all duration-200 border ${
                  saveStatus === 'saving' 
                    ? 'bg-yellow-500/20 border-yellow-400/30 text-yellow-200' 
                    : saveStatus === 'saved'
                    ? 'bg-green-500/20 border-green-400/30 text-green-200'
                    : saveStatus === 'error'
                    ? 'bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30'
                    : hasUnsavedChanges
                    ? 'bg-green-500/20 border-green-400/30 text-white hover:bg-green-500/30'
                    : 'bg-gray-500/20 border-gray-400/30 text-gray-300 cursor-not-allowed'
                } backdrop-blur-sm`}
              >
                {saveStatus === 'saving' ? (
                  <ArrowRight className="w-5 h-5 animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : saveStatus === 'error' ? (
                  <Save className="w-5 h-5" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          
          {/* Subtle accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </div>

        {/* .works Story Builder Component */}
        {showStoryBuilder && profile && (
          <div className="mb-8">
            <SkillSuggestionCard 
              user={profile}
              onSkillAdd={(skill) => {
                // Add skill to profile and mark as unsaved
                setProfile((prev: any) => {
                  const newSkills = [...(prev?.skills || []), skill];
                  const newProfileStrength = calculateProfileStrength({
                    ...prev,
                    skills: newSkills
                  });
                  
                  return {
                    ...prev,
                    skills: newSkills,
                    profileStrength: newProfileStrength
                  };
                });
                setHasUnsavedChanges(true);
              }}
              className="shadow-xl"
            />
          </div>
        )}

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
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Link
            href="/alerts"
            className="bg-white rounded-xl border border-gray-100 p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#ff6b35]/10 rounded-lg flex items-center justify-center mr-4">
                <Bell className="w-5 h-5 text-[#ff6b35]" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Job Alerts</h4>
                <p className="text-sm text-gray-600">Never miss new opportunities</p>
              </div>
            </div>
          </Link>

          <Link
            href="/profile"
            className="bg-white rounded-xl border border-gray-100 p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#2d4a3e]/10 rounded-lg flex items-center justify-center mr-4">
                <User className="w-5 h-5 text-[#2d4a3e]" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Complete Profile</h4>
                <p className="text-sm text-gray-600">3x more visibility to employers</p>
              </div>
            </div>
          </Link>

          <Link
            href="/profile/applications"
            className="bg-white rounded-xl border border-gray-100 p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#9fdf9f]/10 rounded-lg flex items-center justify-center mr-4">
                <CheckCircle className="w-5 h-5 text-[#9fdf9f]" />
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
