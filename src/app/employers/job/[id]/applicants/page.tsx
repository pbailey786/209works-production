'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Users,
  Star,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Calendar,
  Eye,
  Mail,
  Phone,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  FileText,
} from 'lucide-react';
import CommunicationCenter from '@/components/employers/CommunicationCenter';
import NotesSystem from '@/components/employers/NotesSystem';
import { NotesErrorBoundary } from '@/components/employers/NotesErrorBoundary';

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

// Updated status configuration matching new flow
const statusConfig = {
  pending: {
    label: 'Applied',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    icon: Clock,
    description: 'New applications waiting for review'
  },
  reviewing: {
    label: 'Reviewed', 
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    icon: Eye,
    description: 'Applications you\'ve looked at'
  },
  contacted: {
    label: 'Contact',
    color: 'text-purple-600', 
    bg: 'bg-purple-100',
    icon: MessageSquare,
    description: 'Initial contact made (email, phone, text)'
  },
  interview: {
    label: 'Interview',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    icon: Calendar,
    description: 'Formal interviews scheduled or completed'
  },
  offer: {
    label: 'Decision',
    color: 'text-green-600',
    bg: 'bg-green-100',
    icon: CheckCircle,
    description: 'Offers made or final decisions'
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-600',
    bg: 'bg-red-100',
    icon: Users,
    description: 'Not a good fit'
  }
};

export default function JobSpecificApplicantsPage() {
  const params = useParams();
  const jobId = params.id as string;
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [priorityCandidates, setPriorityCandidates] = useState<PriorityCandidate[]>([]);
  const [pipelineStats, setPipelineStats] = useState<Record<string, number>>({});
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [showCommunicationCenter, setShowCommunicationCenter] = useState(false);
  const [showNotesSystem, setShowNotesSystem] = useState(false);
  const [selectedApplicationForNotes, setSelectedApplicationForNotes] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Smart prioritization algorithm (same as before but job-specific)
  const calculatePriority = useCallback((application: Application): PriorityCandidate => {
    let score = 0;
    let reason = '';
    let urgency: 'high' | 'medium' | 'low' = 'low';
    let suggestedAction = '';
    const highlights: string[] = [];

    // Recency boost
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

    // Skills match
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
      const expMatch = application.user.experience.match(/(\\d+)/);
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
  }, []);

  const fetchJobAndApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch job details and applications in parallel
      const [jobResponse, applicationsResponse] = await Promise.all([
        fetch(`/api/jobs/${jobId}`),
        fetch(`/api/employers/applications?jobId=${jobId}&limit=50`)
      ]);

      if (!jobResponse.ok) {
        throw new Error('Failed to fetch job details');
      }

      if (!applicationsResponse.ok) {
        throw new Error('Failed to fetch applications');
      }

      const jobData = await jobResponse.json();
      const applicationsData = await applicationsResponse.json();

      setJobDetails(jobData.job);
      
      const apps = applicationsData.applications || [];
      setApplications(apps);

      // Calculate priority scores and sort
      if (apps.length > 0) {
        const prioritized = apps
          .map(calculatePriority)
          .sort((a: PriorityCandidate, b: PriorityCandidate) => b.priorityScore - a.priorityScore);

        setPriorityCandidates(prioritized);
      } else {
        setPriorityCandidates([]);
      }

      // Calculate pipeline stats
      const stats = applicationsData.statusSummary || {};
      setPipelineStats(stats);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [jobId, calculatePriority]);

  const updateApplicationStatus = useCallback(async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/employers/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Refresh applications
      await fetchJobAndApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application');
    }
  }, [fetchJobAndApplications]);

  const openCommunicationCenter = useCallback((candidateId: string) => {
    setSelectedCandidate(candidateId);
    setShowCommunicationCenter(true);
  }, []);

  const openNotesSystem = useCallback((applicationId: string) => {
    setSelectedApplicationForNotes(applicationId);
    setShowNotesSystem(true);
  }, []);

  const handleEmailSent = useCallback(() => {
    // Refresh data to show any updates
    fetchJobAndApplications();
  }, [fetchJobAndApplications]);

  useEffect(() => {
    setIsClient(true);
    if (jobId) {
      fetchJobAndApplications();
    }
  }, [jobId, fetchJobAndApplications]);

  // Filtered applications based on status and search
  const filteredApplications = useMemo(() => {
    if (!priorityCandidates || priorityCandidates.length === 0) {
      return [];
    }

    let filtered = priorityCandidates;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.user.name?.toLowerCase().includes(query) ||
        app.user.email?.toLowerCase().includes(query) ||
        app.user.skills?.some(skill => skill.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [priorityCandidates, statusFilter, searchQuery]);

  const thisWeekApplications = useMemo(() => {
    if (!applications || applications.length === 0) {
      return 0;
    }
    return applications.filter(a => {
      const daysAgo = (Date.now() - new Date(a.appliedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    }).length;
  }, [applications]);

  if (loading || !isClient) {
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

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-red-800">{error}</p>
          <Link
            href={`/employers/job/${jobId}`}
            className="mt-4 inline-block text-red-600 hover:underline"
          >
            ← Back to Job Details
          </Link>
        </div>
      </div>
    );
  }

  const selectedCandidateData = useMemo(() => {
    if (!selectedCandidate || !applications || applications.length === 0) {
      return null;
    }
    return applications.find(app => app.id === selectedCandidate) || null;
  }, [selectedCandidate, applications]);

  const selectedApplicationData = useMemo(() => {
    if (!selectedApplicationForNotes || !applications || applications.length === 0) {
      return null;
    }
    return applications.find(app => app.id === selectedApplicationForNotes) || null;
  }, [selectedApplicationForNotes, applications]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center">
          <Link
            href={`/employers/job/${jobId}`}
            className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job Details
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Applicant Management
            </h1>
            <p className="mt-1 text-gray-600">
              {jobDetails?.title} • {applications.length} total applications
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/employers/job/${jobId}/pipeline`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Pipeline View
            </Link>
            <Link
              href={`/employers/job/${jobId}/edit`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Edit Job
            </Link>
          </div>
        </div>
      </div>

      {/* Today's Focus Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Priority Actions */}
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
          <div className="flex items-center mb-4">
            <Star className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-orange-900">High Priority</h3>
          </div>
          <div className="space-y-3">
            {priorityCandidates
              .filter(c => c.urgencyLevel === 'high')
              .slice(0, 3)
              .map((candidate) => (
                <div key={candidate.id} className="text-sm">
                  <p className="font-medium text-orange-800">{candidate.user.name}</p>
                  <p className="text-orange-700">{candidate.priorityReason}</p>
                </div>
              ))}
            {priorityCandidates.filter(c => c.urgencyLevel === 'high').length === 0 && (
              <p className="text-orange-700">All caught up! 🎉</p>
            )}
          </div>
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
              <span className="font-semibold text-green-900">{thisWeekApplications}</span>
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

      {/* Search and Filters */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates by name, email, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({applications.length})
          </button>
          {Object.entries(statusConfig).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {config.label} ({pipelineStats[status] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Priority Candidates */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No matching applications' : 'No applications yet'}
          </h3>
          <p className="text-gray-600">
            {searchQuery 
              ? 'Try adjusting your search criteria.' 
              : 'Applications will appear here when job seekers apply to this job.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((candidate) => (
            <div
              key={candidate.id}
              className={`rounded-lg border-2 p-6 transition-all hover:shadow-md ${
                candidate.urgencyLevel === 'high'
                  ? 'border-orange-200 bg-orange-50'
                  : candidate.urgencyLevel === 'medium'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{candidate.user.name}</h3>
                    <div className="flex items-center space-x-2">
                      {candidate.urgencyLevel === 'high' && (
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        Score: {candidate.priorityScore}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center">
                      <Mail className="mr-1 h-4 w-4" />
                      {candidate.user.email}
                    </span>
                    {candidate.user.phoneNumber && (
                      <span className="flex items-center">
                        <Phone className="mr-1 h-4 w-4" />
                        {candidate.user.phoneNumber}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      Applied {formatDistanceToNow(new Date(candidate.appliedAt), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Match Highlights */}
                  {candidate.matchHighlights.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {candidate.matchHighlights.slice(0, 4).map((highlight, index) => (
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
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">💡 {candidate.suggestedAction}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/employers/candidates/${candidate.id}`}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => openCommunicationCenter(candidate.id)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <MessageSquare className="mr-1 inline h-4 w-4" />
                    Contact
                  </button>
                  <button
                    onClick={() => openNotesSystem(candidate.id)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    aria-label={`View and add notes for ${candidate.user.name || 'candidate'}`}
                  >
                    <FileText className="mr-1 inline h-4 w-4" aria-hidden="true" />
                    Notes
                  </button>
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

                {/* Status Update */}
                <div className="flex items-center space-x-2">
                  <select
                    value={candidate.status}
                    onChange={(e) => updateApplicationStatus(candidate.id, e.target.value)}
                    className="rounded border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <option key={status} value={status}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Communication Center */}
      {showCommunicationCenter && selectedCandidateData && (
        <CommunicationCenter
          candidateId={selectedCandidate!}
          candidateName={selectedCandidateData.user.name || 'Candidate'}
          candidateEmail={selectedCandidateData.user.email}
          jobTitle={jobDetails?.title || 'Job'}
          companyName={jobDetails?.company || 'Company'}
          onClose={() => setShowCommunicationCenter(false)}
          onEmailSent={handleEmailSent}
        />
      )}

      {/* Notes System */}
      {showNotesSystem && selectedApplicationForNotes && selectedApplicationData && (
        <NotesErrorBoundary>
          <NotesSystem
            applicationId={selectedApplicationForNotes}
            candidateName={selectedApplicationData.user.name || 'Candidate'}
            isOpen={showNotesSystem}
            onClose={() => {
              setShowNotesSystem(false);
              setSelectedApplicationForNotes(null);
            }}
          />
        </NotesErrorBoundary>
      )}
    </div>
  );
}