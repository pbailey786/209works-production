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
  Gift
} from 'lucide-react';

interface Application {
  id: string;
  status: 'pending' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
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
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
  reviewing: { icon: Eye, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Under Review' },
  interview: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Interview' },
  offer: { icon: Gift, color: 'text-green-600', bg: 'bg-green-100', label: 'Offer' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
  withdrawn: { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Withdrawn' },
};

export default function ApplicationsClient({ userId }: ApplicationsClientProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [statusSummary, setStatusSummary] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApplications = async (pageNum: number = 1, status: string = 'all') => {
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
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string, notes?: string) => {
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
      setError(err instanceof Error ? err.message : 'Failed to update application');
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max?.toLocaleString()}`;
  };

  useEffect(() => {
    fetchApplications(1, statusFilter);
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow mb-4 p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 text-blue-500 mr-3" />
            Your Applications
          </h1>
          <p className="text-gray-600 mt-1">
            Track your job applications and their status
          </p>
        </div>
        <Link
          href="/jobs"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply to More Jobs
        </Link>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-lg border-2 transition-colors ${
            statusFilter === 'all' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-2xl font-bold text-gray-900">
            {Object.values(statusSummary).reduce((sum, count) => sum + count, 0)}
          </div>
          <div className="text-sm text-gray-600">Total</div>
        </button>
        
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`p-4 rounded-lg border-2 transition-colors ${
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {statusFilter === 'all' ? 'No applications yet' : `No ${statusConfig[statusFilter as keyof typeof statusConfig]?.label?.toLowerCase() || statusFilter} applications`}
          </h2>
          <p className="text-gray-600 mb-6">
            {statusFilter === 'all' 
              ? 'Start applying to jobs to track your applications here.'
              : 'Try changing the filter to see other applications.'}
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <>
          {/* Applications List */}
          <div className="space-y-4">
            {applications.map((application) => {
              const statusInfo = statusConfig[application.status];
              if (!statusInfo) {
                console.warn(`Unknown status: ${application.status}`);
                return null;
              }
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <Link href={`/jobs/${application.job.id}`} className="block">
                          <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {application.job.title}
                          </h3>
                          <p className="text-lg text-gray-700 mt-1">{application.job.company}</p>
                        </Link>
                        <div className={`flex items-center px-3 py-1 rounded-full ${statusInfo.bg}`}>
                          <StatusIcon className={`w-4 h-4 mr-2 ${statusInfo.color}`} />
                          <span className={`text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {application.job.location}
                          {application.job.isRemote && <span className="ml-1 text-green-600">(Remote)</span>}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {formatSalary(application.job.salaryMin, application.job.salaryMax)}
                        </span>
                        <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                          {application.job.jobType.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Applied {formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true })}
                        </span>
                        <div className="flex items-center space-x-4">
                          {application.coverLetter && (
                            <span className="text-green-600">✓ Cover Letter</span>
                          )}
                          {application.resumeUrl && (
                            <span className="text-green-600">✓ Resume</span>
                          )}
                          <Link
                            href={`/jobs/${application.job.id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View Job →
                          </Link>
                        </div>
                      </div>

                      {application.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
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
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchApplications(page - 1, statusFilter)}
                  disabled={page <= 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => fetchApplications(page + 1, statusFilter)}
                  disabled={page >= totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
