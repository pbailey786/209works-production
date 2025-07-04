'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Calendar,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Gift,
  FileText,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react';
import NotesSystem from '@/components/employers/NotesSystem';

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

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    label: 'Applied',
  },
  reviewing: {
    icon: Eye,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    label: 'Reviewed',
  },
  contacted: {
    icon: MessageSquare,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    label: 'Contact',
  },
  interview: {
    icon: Calendar,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    label: 'Interview',
  },
  offer: {
    icon: Gift,
    color: 'text-green-600',
    bg: 'bg-green-100',
    label: 'Decision',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    label: 'Rejected',
  },
};

export default function ApplicantsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusSummary, setStatusSummary] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showNotesSystem, setShowNotesSystem] = useState(false);
  const [selectedApplicationForNotes, setSelectedApplicationForNotes] = useState<string | null>(null);

  const fetchApplications = async (
    pageNum: number = 1,
    status: string = 'all',
    search: string = ''
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
      });

      if (status !== 'all') {
        params.append('status', status);
      }

      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`/api/employers/applications?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
      setStatusSummary(data.statusSummary || {});
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load applications'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    newStatus: string
  ) => {
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
      await fetchApplications(page, statusFilter, searchQuery);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update application'
      );
    }
  };

  const openNotesSystem = (applicationId: string) => {
    setSelectedApplicationForNotes(applicationId);
    setShowNotesSystem(true);
  };

  useEffect(() => {
    fetchApplications(1, statusFilter, searchQuery);
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications(1, statusFilter, searchQuery);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-1/4 rounded bg-gray-200"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4 rounded-lg bg-white p-6 shadow">
              <div className="mb-2 h-6 w-3/4 rounded bg-gray-200"></div>
              <div className="mb-4 h-4 w-1/2 rounded bg-gray-200"></div>
              <div className="h-4 w-full rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center text-3xl font-bold text-gray-900">
            <Users className="mr-3 h-8 w-8 text-blue-500" />
            Global Applicant View
          </h1>
          <p className="mt-1 text-gray-600">
            <strong>Note:</strong> For better management, use job-specific applicant pages from your <Link href="/employers/my-jobs" className="text-blue-600 hover:underline">My Jobs</Link> dashboard
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/employers/my-jobs"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Go to My Jobs
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <form onSubmit={handleSearch} className="mb-4 flex gap-4">
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
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Search
          </button>
        </form>

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
            All ({Object.values(statusSummary).reduce((sum, count) => sum + count, 0)})
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
              {config.label} ({statusSummary[status] || 0})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            {statusFilter === 'all'
              ? 'No applications yet'
              : `No ${statusConfig[statusFilter as keyof typeof statusConfig]?.label?.toLowerCase() || statusFilter} applications`}
          </h2>
          <p className="mb-6 text-gray-600">
            {statusFilter === 'all'
              ? 'Applications will appear here when job seekers apply to your jobs.'
              : 'Try changing the filter to see other applications.'}
          </p>
        </div>
      ) : (
        <>
          {/* Applications List */}
          <div className="space-y-4">
            {applications.map(application => {
              const statusInfo = statusConfig[application.status as keyof typeof statusConfig];
              if (!statusInfo) {
                console.warn(`Unknown status: ${application.status}`);
                return null;
              }
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={application.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.user.name || application.user.email}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Applied for: {application.job.title}
                          </p>
                        </div>
                        <div
                          className={`flex items-center rounded-full px-3 py-1 ${statusInfo.bg}`}
                        >
                          <StatusIcon
                            className={`mr-2 h-4 w-4 ${statusInfo.color}`}
                          />
                          <span
                            className={`text-sm font-medium ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Mail className="mr-1 h-4 w-4" />
                          {application.user.email}
                        </span>
                        {application.user.phoneNumber && (
                          <span className="flex items-center">
                            <Phone className="mr-1 h-4 w-4" />
                            {application.user.phoneNumber}
                          </span>
                        )}
                        {application.user.location && (
                          <span className="flex items-center">
                            <MapPin className="mr-1 h-4 w-4" />
                            {application.user.location}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Clock className="mr-1 h-4 w-4" />
                          Applied{' '}
                          {formatDistanceToNow(new Date(application.appliedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      {application.user.skills && application.user.skills.length > 0 && (
                        <div className="mb-4">
                          <p className="mb-2 text-sm font-medium text-gray-700">Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {application.user.skills.slice(0, 5).map((skill, index) => (
                              <span
                                key={index}
                                className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                              >
                                {skill}
                              </span>
                            ))}
                            {application.user.skills.length > 5 && (
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                +{application.user.skills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          {application.resumeUrl && (
                            <span className="text-green-600">✓ Resume</span>
                          )}
                          {application.coverLetter && (
                            <span className="text-green-600">✓ Cover Letter</span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Status Update Dropdown */}
                          <select
                            value={application.status}
                            onChange={(e) =>
                              updateApplicationStatus(application.id, e.target.value)
                            }
                            className="rounded border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {Object.entries(statusConfig).map(([status, config]) => (
                              <option key={status} value={status}>
                                {config.label}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => {
                              window.location.href = `mailto:${application.user.email}?subject=Regarding your application for ${application.job.title}`;
                            }}
                            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <Mail className="mr-1 inline h-3 w-3" />
                            Email
                          </button>

                          {application.user.phoneNumber && (
                            <button
                              onClick={() => {
                                window.location.href = `tel:${application.user.phoneNumber}`;
                              }}
                              className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              <Phone className="mr-1 inline h-3 w-3" />
                              Call
                            </button>
                          )}

                          <button
                            onClick={() => openNotesSystem(application.id)}
                            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <FileText className="mr-1 inline h-3 w-3" />
                            Notes
                          </button>

                          <Link
                            href={`/employers/candidates/${application.id}`}
                            className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
                          >
                            View Snapshot
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchApplications(page - 1, statusFilter, searchQuery)}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => fetchApplications(page + 1, statusFilter, searchQuery)}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Notes System */}
      {showNotesSystem && selectedApplicationForNotes && (
        <NotesSystem
          applicationId={selectedApplicationForNotes}
          candidateName={
            applications.find(app => app.id === selectedApplicationForNotes)?.user.name || 'Candidate'
          }
          isOpen={showNotesSystem}
          onClose={() => {
            setShowNotesSystem(false);
            setSelectedApplicationForNotes(null);
          }}
        />
      )}
    </div>
  );
}