'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Users,
  Clock,
  Mail,
  Eye,
  UserCheck,
  UserX,
  ChevronRight,
} from 'lucide-react';

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  job: {
    id: string;
    title: string;
    company: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    skills?: string[];
  };
}

const statusConfig = {
  pending: { title: 'Applied', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
  reviewing: { title: 'Reviewed', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700' },
  contacted: { title: 'Contact', color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700' },
  interview: { title: 'Interview', color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-700' },
  offer: { title: 'Decision', color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
  rejected: { title: 'Rejected', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
};

export default function JobPipelineViewPage() {
  const params = useParams();
  const jobId = params.id as string;
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobAndApplications();
  }, [jobId]);

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true);
      const [jobResponse, applicationsResponse] = await Promise.all([
        fetch(`/api/jobs/${jobId}`),
        fetch(`/api/employers/applications?jobId=${jobId}`)
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
      setApplications(applicationsData.applications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/employers/candidates/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Refresh the data
      await fetchJobAndApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application');
    }
  };

  const getApplicationsByStatus = (status: string) => {
    return applications.filter(app => app.status === status);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 h-6 w-3/4 rounded bg-gray-200"></div>
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="mb-3 h-12 rounded bg-gray-100"></div>
                ))}
              </div>
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center">
          <Link
            href={`/employers/job/${jobId}/applicants`}
            className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applicant Management
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Candidate Pipeline</h1>
        <p className="mt-2 text-gray-600">
          Manage candidates for: <strong>{jobDetails?.title}</strong>
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No Applications Yet</h3>
          <p className="text-gray-600 mb-4">Applications will appear here when candidates apply to this job</p>
          <Link
            href={`/employers/job/${jobId}`}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Back to Job Details
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Job Info Header */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{jobDetails?.title}</h2>
                <p className="text-sm text-gray-600">{jobDetails?.company} • {jobDetails?.location}</p>
              </div>
              <Link
                href={`/employers/job/${jobId}`}
                className="flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                View Job Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Pipeline Columns */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {Object.entries(statusConfig).map(([status, config]) => {
              const statusApplications = getApplicationsByStatus(status);
              return (
                <div key={status} className={`rounded-lg border p-4 ${config.color}`}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className={`font-medium ${config.textColor}`}>{config.title}</h3>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${config.textColor} bg-white`}>
                      {statusApplications.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {statusApplications.length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-sm">No candidates</p>
                      </div>
                    ) : (
                      statusApplications.map((application) => (
                        <div
                          key={application.id}
                          className="rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="mb-2">
                            <h4 className="font-medium text-gray-900">
                              {application.user.name || 'Anonymous'}
                            </h4>
                            <p className="text-sm text-gray-600">{application.user.email}</p>
                          </div>

                          <div className="mb-3 flex items-center text-xs text-gray-500">
                            <Clock className="mr-1 h-3 w-3" />
                            Applied {formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true })}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                              <Link
                                href={`/employers/candidates/${application.id}`}
                                className="flex items-center rounded bg-blue-600 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-700"
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                View
                              </Link>
                              <a
                                href={`mailto:${application.user.email}`}
                                className="flex items-center rounded bg-gray-600 px-3 py-1 text-xs text-white transition-colors hover:bg-gray-700"
                              >
                                <Mail className="mr-1 h-3 w-3" />
                                Email
                              </a>
                            </div>

                            <div className="flex space-x-1">
                              {status === 'pending' && (
                                <button
                                  onClick={() => updateApplicationStatus(application.id, 'reviewing')}
                                  className="rounded bg-blue-600 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-700"
                                  title="Mark as Reviewed"
                                >
                                  <Eye className="h-3 w-3" />
                                </button>
                              )}
                              {(status === 'reviewing' || status === 'contacted') && (
                                <button
                                  onClick={() => updateApplicationStatus(application.id, status === 'reviewing' ? 'contacted' : 'interview')}
                                  className="rounded bg-purple-600 px-2 py-1 text-xs text-white transition-colors hover:bg-purple-700"
                                  title={status === 'reviewing' ? 'Make Contact' : 'Schedule Interview'}
                                >
                                  <UserCheck className="h-3 w-3" />
                                </button>
                              )}
                              {status !== 'rejected' && (
                                <button
                                  onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                  className="rounded bg-red-600 px-2 py-1 text-xs text-white transition-colors hover:bg-red-700"
                                  title="Reject"
                                >
                                  <UserX className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Back to Applicants Link */}
          <div className="text-center">
            <Link
              href={`/employers/job/${jobId}/applicants`}
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Applicant Management
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}