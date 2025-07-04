'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  Star,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  Filter,
  Search,
  Eye,
  MoreHorizontal
} from 'lucide-react';

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  coverLetter?: string;
  resumeUrl?: string;
  notes?: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    postedAt: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    resumeUrl?: string;
    bio?: string;
    skills?: string[];
    experience?: string;
    location?: string;
  };
}

interface PriorityCandidate extends Application {
  priorityScore: number;
  priorityReason: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  suggestedAction: string;
  matchHighlights: string[];
}

// Updated status configuration with new "Contact" step
const statusConfig = {
  pending: {
    label: 'Applied',
    color: 'blue',
    icon: Clock,
    description: 'New applications waiting for review'
  },
  reviewing: {
    label: 'Reviewed', 
    color: 'yellow',
    icon: Eye,
    description: 'Applications you\'ve looked at'
  },
  contacted: {
    label: 'Contact',
    color: 'purple', 
    icon: MessageSquare,
    description: 'Initial contact made (email, phone, text)'
  },
  interview: {
    label: 'Interview',
    color: 'orange',
    icon: Calendar,
    description: 'Formal interviews scheduled or completed'
  },
  offer: {
    label: 'Decision',
    color: 'green',
    icon: CheckCircle,
    description: 'Offers made or final decisions'
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    icon: Users,
    description: 'Not a good fit'
  }
};

export default function SmartApplicantDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [priorityCandidates, setPriorityCandidates] = useState<PriorityCandidate[]>([]);
  const [pipelineStats, setPipelineStats] = useState<Record<string, number>>({});
  const [todayActions, setTodayActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Smart prioritization algorithm
  const calculatePriority = (application: Application): PriorityCandidate => {
    let score = 0;
    let reason = '';
    let urgency: 'high' | 'medium' | 'low' = 'low';
    let suggestedAction = '';
    const highlights: string[] = [];

    // Recency boost (applied recently = higher priority)
    const hoursAgo = (Date.now() - new Date(application.appliedAt).getTime()) / (1000 * 60 * 60);
    if (hoursAgo <= 24) {
      score += 30;
      reason = 'Applied recently';
      urgency = 'high';
      suggestedAction = 'Review and respond quickly';
      highlights.push('Applied today');
    } else if (hoursAgo <= 72) {
      score += 20;
      reason = 'Applied this week';
      urgency = 'medium';
      suggestedAction = 'Review and make contact';
      highlights.push('Applied 2-3 days ago');
    }

    // Status-based priority
    switch (application.status) {
      case 'pending':
        score += 25;
        suggestedAction = 'Review application and skills';
        if (!reason) reason = 'Needs initial review';
        break;
      case 'reviewing':
        score += 15;
        suggestedAction = 'Make contact decision';
        if (!reason) reason = 'Under review';
        break;
      case 'contacted':
        score += 20;
        suggestedAction = 'Follow up or schedule interview';
        if (!reason) reason = 'Awaiting response';
        break;
    }

    // Skills match (basic simulation - in real version, this would use SmartMatch)
    if (application.user.skills && application.user.skills.length > 0) {
      const relevantSkills = application.user.skills.filter(skill =>
        ['React', 'JavaScript', 'TypeScript', 'Python', 'Java', 'Customer Service', 'Sales', 'Management'].includes(skill)
      );
      if (relevantSkills.length >= 3) {
        score += 20;
        highlights.push(`${relevantSkills.length} relevant skills`);
      }
    }

    // Experience level
    if (application.user.experience) {
      const expMatch = application.user.experience.match(/(\d+)/);
      if (expMatch) {
        const years = parseInt(expMatch[1]);
        if (years >= 3 && years <= 8) {
          score += 15;
          highlights.push(`${years} years experience`);
        }
      }
    }

    // Local candidate
    if (application.user.location && 
        application.user.location.includes('CA') && 
        (application.user.location.includes('209') || 
         application.user.location.includes('Modesto') || 
         application.user.location.includes('Stockton') ||
         application.user.location.includes('Manteca'))) {
      score += 15;
      highlights.push('Local to Central Valley');
    }

    // Resume quality
    if (application.resumeUrl || application.user.resumeUrl) {
      score += 10;
      highlights.push('Resume attached');
    }

    // Cover letter quality
    if (application.coverLetter && application.coverLetter.length > 50) {
      score += 10;
      highlights.push('Detailed cover letter');
    }

    return {
      ...application,
      priorityScore: score,
      priorityReason: reason || 'Standard application',
      urgencyLevel: urgency,
      suggestedAction: suggestedAction || 'Review when convenient',
      matchHighlights: highlights
    };
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employers/applications?limit=50');
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      const apps = data.applications || [];
      setApplications(apps);

      // Calculate priority scores and sort
      const prioritized = apps
        .map(calculatePriority)
        .sort((a: PriorityCandidate, b: PriorityCandidate) => b.priorityScore - a.priorityScore)
        .slice(0, 8); // Top 8 for dashboard

      setPriorityCandidates(prioritized);

      // Calculate pipeline stats
      const stats = data.statusSummary || {};
      setPipelineStats(stats);

      // Generate today's action items
      const actions = generateTodayActions(prioritized);
      setTodayActions(actions);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const generateTodayActions = (candidates: PriorityCandidate[]) => {
    const actions = [];
    
    // High priority new applications
    const newHighPriority = candidates.filter(c => 
      c.status === 'pending' && c.urgencyLevel === 'high'
    );
    if (newHighPriority.length > 0) {
      actions.push({
        type: 'review',
        count: newHighPriority.length,
        description: `Review ${newHighPriority.length} high-priority new application${newHighPriority.length > 1 ? 's' : ''}`,
        urgency: 'high',
        candidates: newHighPriority.slice(0, 3)
      });
    }

    // Follow-ups needed
    const needsFollowUp = candidates.filter(c => 
      c.status === 'contacted' && 
      (Date.now() - new Date(c.appliedAt).getTime()) > (48 * 60 * 60 * 1000) // 48 hours
    );
    if (needsFollowUp.length > 0) {
      actions.push({
        type: 'followup',
        count: needsFollowUp.length,
        description: `Follow up with ${needsFollowUp.length} candidate${needsFollowUp.length > 1 ? 's' : ''}`,
        urgency: 'medium',
        candidates: needsFollowUp.slice(0, 3)
      });
    }

    return actions;
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Smart Applicant Dashboard
        </h1>
        <p className="text-gray-600">
          Your highest-priority candidates and recommended actions
        </p>
      </div>

      {/* Today's Focus Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Priority Actions */}
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
          <div className="flex items-center mb-4">
            <Star className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-orange-900">Today's Priority</h3>
          </div>
          {todayActions.length > 0 ? (
            <div className="space-y-3">
              {todayActions.map((action, index) => (
                <div key={index} className="text-sm">
                  <p className="font-medium text-orange-800">{action.description}</p>
                  <div className="mt-1 flex -space-x-1">
                    {action.candidates.slice(0, 3).map((candidate: PriorityCandidate, i: number) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded-full bg-orange-200 border-2 border-white flex items-center justify-center text-xs font-medium text-orange-700"
                        title={candidate.user.name}
                      >
                        {candidate.user.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {action.candidates.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-orange-300 border-2 border-white flex items-center justify-center text-xs font-medium text-orange-800">
                        +{action.candidates.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-orange-700">All caught up! 🎉</p>
          )}
        </div>

        {/* Pipeline Overview */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-blue-900">Pipeline Status</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = pipelineStats[status] || 0;
              return (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">{config.label}</span>
                  <span className="font-semibold text-blue-900">{count}</span>
                </div>
              );
            })}
          </div>
          <Link
            href="/employers/applicants/pipeline"
            className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View Pipeline <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-green-900">This Week</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-800">New Applications</span>
              <span className="font-semibold text-green-900">
                {useMemo(() => 
                  applications.filter(a => {
                    const daysAgo = (Date.now() - new Date(a.appliedAt).getTime()) / (1000 * 60 * 60 * 24);
                    return daysAgo <= 7;
                  }).length, [applications]
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-800">Contacted</span>
              <span className="font-semibold text-green-900">{pipelineStats.contacted || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-800">Interviews</span>
              <span className="font-semibold text-green-900">{pipelineStats.interview || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Candidates */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Priority Candidates</h2>
          <Link
            href="/employers/applicants"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            View All Applications →
          </Link>
        </div>

        {priorityCandidates.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600">Applications will appear here when job seekers apply to your jobs.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {priorityCandidates.slice(0, 6).map((candidate) => (
              <div
                key={candidate.id}
                className={`rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                  candidate.urgencyLevel === 'high'
                    ? 'border-orange-200 bg-orange-50'
                    : candidate.urgencyLevel === 'medium'
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{candidate.user.name}</h3>
                    <p className="text-sm text-gray-600">{candidate.job.title}</p>
                    <p className="text-xs text-gray-500">
                      Applied {formatDistanceToNow(new Date(candidate.appliedAt))} ago
                    </p>
                  </div>
                  <div className="flex items-center">
                    {candidate.urgencyLevel === 'high' && (
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    )}
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {candidate.priorityScore}
                    </span>
                  </div>
                </div>

                {/* Match Highlights */}
                {candidate.matchHighlights.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {candidate.matchHighlights.slice(0, 3).map((highlight, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Action */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">💡 {candidate.suggestedAction}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/employers/candidates/${candidate.id}`}
                    className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                  >
                    View Profile
                  </Link>
                  {candidate.user.email && (
                    <a
                      href={`mailto:${candidate.user.email}`}
                      className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
                      title="Send Email"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {candidate.user.phoneNumber && (
                    <a
                      href={`tel:${candidate.user.phoneNumber}`}
                      className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
                      title="Call"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/employers/applicants?status=pending"
            className="flex items-center rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
          >
            <Clock className="h-6 w-6 text-blue-500 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Review New</p>
              <p className="text-sm text-gray-600">{pipelineStats.pending || 0} pending applications</p>
            </div>
          </Link>
          
          <Link
            href="/employers/applicants?status=contacted"
            className="flex items-center rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
          >
            <MessageSquare className="h-6 w-6 text-purple-500 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Follow Up</p>
              <p className="text-sm text-gray-600">{pipelineStats.contacted || 0} awaiting response</p>
            </div>
          </Link>
          
          <Link
            href="/employers/applicants/pipeline"
            className="flex items-center rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
          >
            <TrendingUp className="h-6 w-6 text-green-500 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Pipeline View</p>
              <p className="text-sm text-gray-600">Manage all candidates</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}