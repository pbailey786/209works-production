'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  MapPin,
  DollarSign,
  Clock,
  ExternalLink,
  Building2,
  Bookmark,
  Archive,
  CheckCircle,
} from 'lucide-react';

interface Application {
  id: string;
  status: string;
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
    status?: string; // Job status (active, expired, closed)
  };
}

interface ApplicationsClientProps {
  userId: string;
}

// Simplified tabs for job seekers
const tabs = [
  { id: 'applied', label: 'Applied', icon: CheckCircle },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'archived', label: 'Archived', icon: Archive },
];

export default function ApplicationsClient({
  userId,
}: ApplicationsClientProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('applied');
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({
    applied: 0,
    saved: 0,
    archived: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApplications = async (
    pageNum: number = 1,
    tab: string = 'applied'
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        tab: tab,
      });

      const response = await fetch(`/api/profile/applications?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
      setTabCounts(data.tabCounts || { applied: 0, saved: 0, archived: 0 });
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

  const archiveApplication = async (applicationId: string) => {
    try {
      const response = await fetch('/api/profile/applications/archive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive application');
      }

      // Refresh applications
      await fetchApplications(page, activeTab);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to archive application'
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

  const getJobStatusBadge = (job: Application['job']) => {
    if (job.status === 'expired' || (job.expiresAt && new Date(job.expiresAt) < new Date())) {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
          Job closed or expired on Indeed
        </span>
      );
    }
    return null;
  };

  useEffect(() => {
    fetchApplications(1, activeTab);
  }, [activeTab]);

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
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My jobs</h1>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <span className={`rounded-full px-2 py-1 text-xs ${
                    isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tabCounts[tab.id] || 0}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
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
            {activeTab === 'applied' && 'No applications yet'}
            {activeTab === 'saved' && 'No saved jobs'}
            {activeTab === 'archived' && 'No archived applications'}
          </h2>
          <p className="mb-6 text-gray-600">
            {activeTab === 'applied' && 'Start applying to jobs to track your applications here.'}
            {activeTab === 'saved' && 'Save jobs you\'re interested in to view them later.'}
            {activeTab === 'archived' && 'Archived applications will appear here.'}
          </p>
          {activeTab !== 'archived' && (
            <Link
              href="/jobs"
              className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
            >
              Browse Jobs
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Applications List */}
          <div className="space-y-4">
            {applications.map(application => {
              return (
                <div
                  key={application.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Job Status Badge */}
                      {getJobStatusBadge(application.job) && (
                        <div className="mb-3">
                          {getJobStatusBadge(application.job)}
                        </div>
                      )}

                      {/* Job Title and Company */}
                      <div className="mb-3">
                        <Link
                          href={`/jobs/${application.job.id}`}
                          className="block group"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {application.job.title}
                          </h3>
                          <div className="flex items-center mt-1 text-gray-600">
                            <Building2 className="h-4 w-4 mr-1" />
                            <span>{application.job.company}</span>
                          </div>
                        </Link>
                      </div>

                      {/* Job Details */}
                      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" />
                          {application.job.location}
                          {application.job.isRemote && (
                            <span className="ml-1 text-green-600">
                              • Remote
                            </span>
                          )}
                        </span>
                        {(application.job.salaryMin || application.job.salaryMax) && (
                          <span className="flex items-center">
                            <DollarSign className="mr-1 h-4 w-4" />
                            {formatSalary(
                              application.job.salaryMin,
                              application.job.salaryMax
                            )}
                          </span>
                        )}
                        <span className="rounded bg-gray-100 px-2 py-1 capitalize text-xs">
                          {application.job.jobType.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Bottom Row: Applied Date and Actions */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-sm text-gray-500">
                          <Clock className="mr-1 h-4 w-4" />
                          Applied on {new Date(application.appliedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>

                        <div className="flex items-center space-x-3">
                          {/* Update Status Button (for employers to see) */}
                          {activeTab === 'applied' && (
                            <button
                              onClick={() => archiveApplication(application.id)}
                              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              Archive
                            </button>
                          )}

                          {/* View Job Button */}
                          <Link
                            href={`/jobs/${application.job.id}`}
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            View job
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Status indicator */}
                    <div className="ml-4">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                        Applied
                      </span>
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
                  onClick={() => fetchApplications(page - 1, activeTab)}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => fetchApplications(page + 1, activeTab)}
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
