'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  Gift,
} from 'lucide-react';

interface Application {
  id: string;
  status:
    | 'pending'
    | 'reviewing'
    | 'interview'
    | 'offer'
    | 'rejected'
    | 'withdrawn';
  appliedAt: string;
  coverLetter?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  notes?: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    salaryMin?: number;
    salaryMax?: number;
    description: string;
    postedAt: string;
    expiresAt?: string;
    isRemote: boolean;
    categories: string[];
    url: string;
  };
}

interface ApplicationsClientProps {
  userId: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    label: 'Pending',
  },
  reviewing: {
    icon: Eye,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    label: 'Under Review',
  },
  interview: {
    icon: Calendar,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    label: 'Interview',
  },
  offer: {
    icon: Gift,
    color: 'text-green-600',
    bg: 'bg-green-100',
    label: 'Offer',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    label: 'Rejected',
  },
  withdrawn: {
    icon: AlertCircle,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    label: 'Withdrawn',
  },
};

export default function ApplicationsClient({
  userId,
}: ApplicationsClientProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [statusSummary, setStatusSummary] = useState<Record<string, number>>(
    {}
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApplications = async (
    pageNum: number = 1,
    status: string = 'all'
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

      const response = await fetch(`/api/profile/applications?${params}`);

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
    newStatus: string,
    notes?: string
  ) => {
    try {
      const response = await fetch('/api/profile/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, status: newStatus, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Refresh applications
      await fetchApplications(page, statusFilter);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update application'
      );
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max)
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max?.toLocaleString()}`;
  };

  useEffect(() => {
    fetchApplications(1, statusFilter);
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center text-3xl font-bold text-gray-900">
            <FileText className="mr-3 h-8 w-8 text-blue-500" />
            Your Applications
          </h1>
          <p className="mt-1 text-gray-600">
            Track your job applications and their status
          </p>
        </div>
        <Link
          href="/jobs"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Apply to More Jobs
        </Link>
      </div>

      {/* Status Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
        <button
          onClick={() => setStatusFilter('all')}
          className={`rounded-lg border-2 p-4 transition-colors ${
            statusFilter === 'all'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-2xl font-bold text-gray-900">
            {Object.values(statusSummary).reduce(
              (sum, count) => sum + count,
              0
            )}
          </div>
          <div className="text-sm text-gray-600">Total</div>
        </button>

        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg border-2 p-4 transition-colors ${
              statusFilter === status
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900">
              {statusSummary[status] || 0}
            </div>
            <div className="text-sm text-gray-600">{config.label}</div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            {statusFilter === 'all'
              ? 'No applications yet'
              : `No ${statusConfig[statusFilter as keyof typeof statusConfig]?.label?.toLowerCase() || statusFilter} applications`}
          </h2>
          <p className="mb-6 text-gray-600">
            {statusFilter === 'all'
              ? 'Start applying to jobs to track your applications here.'
              : 'Try changing the filter to see other applications.'}
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <>
          {/* Applications List */}
          <div className="space-y-4">
            {applications.map(application => {
              const statusInfo = statusConfig[application.status];
              if (!statusInfo) {
                console.warn(`Unknown status: ${application.status}`);
                return null;
              }
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={application.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <Link
                          href={`/jobs/${application.job.id}`}
                          className="block"
                        >
                          <h3 className="text-xl font-semibold text-gray-900 transition-colors hover:text-blue-600">
                            {application.job.title}
                          </h3>
                          <p className="mt-1 text-lg text-gray-700">
                            {application.job.company}
                          </p>
                        </Link>
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

                      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" />
                          {application.job.location}
                          {application.job.isRemote && (
                            <span className="ml-1 text-green-600">
                              (Remote)
                            </span>
                          )}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="mr-1 h-4 w-4" />
                          {formatSalary(
                            application.job.salaryMin,
                            application.job.salaryMax
                          )}
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-1 capitalize">
                          {application.job.jobType.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="mr-1 h-4 w-4" />
                          Applied{' '}
                          {formatDistanceToNow(
                            new Date(application.appliedAt),
                            { addSuffix: true }
                          )}
                        </span>
                        <div className="flex items-center space-x-4">
                          {application.coverLetter && (
                            <span className="text-green-600">
                              ✓ Cover Letter
                            </span>
                          )}
                          {application.resumeUrl && (
                            <span className="text-green-600">✓ Resume</span>
                          )}
                          <Link
                            href={`/jobs/${application.job.id}`}
                            className="font-medium text-blue-600 hover:text-blue-700"
                          >
                            View Job →
                          </Link>
                        </div>
                      </div>

                      {application.notes && (
                        <div className="mt-3 rounded-lg bg-gray-50 p-3">
                          <p className="text-sm text-gray-700">
                            <strong>Notes:</strong> {application.notes}
                          </p>
                        </div>
                      )}
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
                  onClick={() => fetchApplications(page - 1, statusFilter)}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => fetchApplications(page + 1, statusFilter)}
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
    </div>
  );
}
