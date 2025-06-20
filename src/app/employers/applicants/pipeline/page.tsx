import { useState, useEffect } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

'use client';

  ArrowLeft,
  Users,
  Clock,
  Mail,
  Eye,
  Briefcase,
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

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  applications: Application[];
}

const statusConfig = {
  applied: { title: 'Applied', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
  shortlisted: { title: 'Shortlisted', color: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
  rejected: { title: 'Rejected', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
};

export default function PipelineViewPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  useEffect(() => {
    fetchJobsWithApplications();
  }, []);

  const fetchJobsWithApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employers/jobs-with-applications');

      if (!response.ok) {
        throw new Error('Failed to fetch jobs and applications');
      }

      const data = await response.json();
      setJobs(data.jobs || []);

      // Auto-select first job if available
      if (data.jobs && data.jobs.length > 0) {
        setSelectedJob(data.jobs[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs and applications');
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
      await fetchJobsWithApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application');
    }
  };

  const getSelectedJobData = () => {
    return jobs.find(job => job.id === selectedJob);
  };

  const getApplicationsByStatus = (status: string) => {
    const job = getSelectedJobData();
    if (!job) return [];
    return job.applications.filter(app => app.status === status);
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

  const selectedJobData = getSelectedJobData();
  const totalApplications = selectedJobData ? selectedJobData.applications.length : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center">
          <Link
            href="/employers/applicants"
            className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Candidate Pipeline</h1>
        <p className="mt-2 text-gray-600">Manage candidates by job and track their progress</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Briefcase className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No Jobs Found</h3>
          <p className="text-gray-600 mb-4">You haven't posted any jobs yet.</p>
          <Link
            href="/employers/create-job-post"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Job Selector */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Select Job</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJob(job.id)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selectedJob === job.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-medium text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.company}</p>
                  <p className="text-sm text-gray-500">{job.location}</p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Users className="mr-1 h-4 w-4" />
                    {job.applications.length} applicant{job.applications.length !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pipeline for Selected Job */}
          {selectedJobData && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedJobData.title}</h2>
                  <p className="text-sm text-gray-600">{selectedJobData.company} • {selectedJobData.location}</p>
                </div>
                <Link
                  href={`/employers/job/${selectedJobData.id}`}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-500"
                >
                  View Job Details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>

              {/* Simple 3-Column Pipeline */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {Object.entries(statusConfig).map(([status, config]) => {
                  const applications = getApplicationsByStatus(status);
                  return (
                    <div key={status} className={`rounded-lg border p-4 ${config.color}`}>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className={`font-medium ${config.textColor}`}>{config.title}</h3>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${config.textColor} bg-white`}>
                          {applications.length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {applications.length === 0 ? (
                          <div className="py-8 text-center text-gray-500">
                            <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                            <p className="text-sm">No candidates</p>
                          </div>
                        ) : (
                          applications.map((application) => (
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
                                  {status !== 'shortlisted' && (
                                    <button
                                      onClick={() => updateApplicationStatus(application.id, 'shortlisted')}
                                      className="rounded bg-green-600 px-2 py-1 text-xs text-white transition-colors hover:bg-green-700"
                                      title="Shortlist"
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

