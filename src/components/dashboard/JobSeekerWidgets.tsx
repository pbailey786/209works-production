'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  WidgetCard,
  MetricCard,
  QuickAction,
  StatsGrid,
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
} from 'lucide-react';

interface ApplicationStats {
  totalApplications: number;
  pendingApplications: number;
  interviewsScheduled: number;
  offersReceived: number;
  savedJobs: number;
  profileViews: number;
  responseRate: number;
}

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  matchScore: number;
  postedAt: string;
  isRemote: boolean;
}

interface ProfileCompletion {
  overall: number;
  sections: {
    basicInfo: boolean;
    resume: boolean;
    skills: boolean;
    preferences: boolean;
    availability: boolean;
  };
}

// Application Stats Widget
export function ApplicationStatsWidget() {
  const [stats, setStats] = useState<ApplicationStats>({
    totalApplications: 0,
    pendingApplications: 0,
    interviewsScheduled: 0,
    offersReceived: 0,
    savedJobs: 0,
    profileViews: 0,
    responseRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/application-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch application stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <WidgetCard title="Application Overview" subtitle="Track your job search progress">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title="Application Overview"
      subtitle="Track your job search progress"
      headerActions={
        <Link
          href="/profile/applications"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          View All <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.totalApplications}</div>
          <div className="text-xs text-gray-600">Total Applications</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingApplications}</div>
          <div className="text-xs text-gray-600">Pending Review</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats.interviewsScheduled}</div>
          <div className="text-xs text-gray-600">Interviews</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.offersReceived}</div>
          <div className="text-xs text-gray-600">Offers</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Response Rate</span>
          <span className="font-medium text-gray-900">{stats.responseRate}%</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.responseRate}%` }}
          ></div>
        </div>
      </div>
    </WidgetCard>
  );
}

// Job Recommendations Widget
export function JobRecommendationsWidget() {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/dashboard/job-recommendations');
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.recommendations.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch job recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <WidgetCard title="Recommended Jobs" subtitle="Jobs matched to your profile">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse p-3 border border-gray-200 rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title="Recommended Jobs"
      subtitle="Jobs matched to your profile"
      headerActions={
        <Link
          href="/jobs?recommended=true"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          View All <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      }
    >
      <div className="space-y-3">
        {recommendations.length === 0 ? (
          <div className="text-center py-6">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-600 text-sm">No recommendations yet</p>
            <p className="text-gray-500 text-xs mt-1">
              Complete your profile to get personalized job matches
            </p>
          </div>
        ) : (
          recommendations.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{job.title}</h4>
                  <div className="flex items-center mt-1 text-xs text-gray-600">
                    <Building2 className="h-3 w-3 mr-1" />
                    <span>{job.company}</span>
                    <span className="mx-2">•</span>
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{job.location}</span>
                    {job.isRemote && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-green-600">Remote</span>
                      </>
                    )}
                  </div>
                  {job.salary && (
                    <div className="flex items-center mt-1 text-xs text-green-600">
                      <DollarSign className="h-3 w-3 mr-1" />
                      <span>{job.salary}</span>
                    </div>
                  )}
                </div>
                <div className="ml-3 text-right">
                  <div className="text-xs font-medium text-blue-600">
                    {job.matchScore}% match
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(job.postedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex space-x-2">
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex-1 text-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  View Details
                </Link>
                <button className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 transition-colors">
                  <Heart className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </WidgetCard>
  );
}

// Profile Completion Widget
export function ProfileCompletionWidget() {
  const [completion, setCompletion] = useState<ProfileCompletion>({
    overall: 0,
    sections: {
      basicInfo: false,
      resume: false,
      skills: false,
      preferences: false,
      availability: false,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletion = async () => {
      try {
        const response = await fetch('/api/dashboard/profile-completion');
        if (response.ok) {
          const data = await response.json();
          setCompletion(data.completion);
        }
      } catch (error) {
        console.error('Failed to fetch profile completion:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletion();
  }, []);

  if (loading) {
    return (
      <WidgetCard title="Profile Completion" subtitle="Complete your profile to get better matches">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </WidgetCard>
    );
  }

  const sections = [
    { key: 'basicInfo', label: 'Basic Information', completed: completion.sections.basicInfo },
    { key: 'resume', label: 'Resume Upload', completed: completion.sections.resume },
    { key: 'skills', label: 'Skills & Experience', completed: completion.sections.skills },
    { key: 'preferences', label: 'Job Preferences', completed: completion.sections.preferences },
    { key: 'availability', label: 'Availability', completed: completion.sections.availability },
  ];

  return (
    <WidgetCard
      title="Profile Completion"
      subtitle="Complete your profile to get better matches"
      headerActions={
        <Link
          href="/profile/setup"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          Edit Profile <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-600"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${completion.overall}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-900">{completion.overall}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {sections.map((section) => (
            <div key={section.key} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{section.label}</span>
              {section.completed ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
              )}
            </div>
          ))}
        </div>

        {completion.overall < 100 && (
          <div className="pt-3 border-t border-gray-100">
            <Link
              href="/profile/setup"
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Complete Profile
            </Link>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
