import { useState } from 'react';

'use client';

import {
  import {
  Check,
  X,
  Edit,
  Flag,
  Eye,
  MoreVertical,
  Clock,
  MapPin,
  Building,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
  } | null;
  location: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  createdAt: Date;
  _count: {
    jobApplications: number;
  };
}

interface JobModerationTableProps {
  jobs: Job[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export default function JobModerationTable({
  jobs,
  currentPage,
  totalPages,
  totalCount,
}: JobModerationTableProps) {
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [actionsOpen, setActionsOpen] = useState<string | null>(null);

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map(job => job.id));
    }
  };

  const handleJobAction = async (jobId: string, action: string) => {
    try {
      setActionsOpen(null);

      const response = await fetch(`/api/admin/jobs/${jobId}/moderate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (response.ok) {
        // Show success message (you might want to use a toast library here)
        alert(result.message);
        // In a real app, you'd refresh the data or update the UI state
        window.location.reload();
      } else {
        alert(result.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Error moderating job:', error);
      alert('An error occurred while moderating the job');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedJobs.length === 0) return;

    try {
      const response = await fetch('/api/admin/jobs/bulk-moderate', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobIds: selectedJobs,
          action,
          reason: `Bulk ${action} action performed by admin`,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        setSelectedJobs([]);
        window.location.reload();
      } else {
        alert(result.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('An error occurred while performing the bulk action');
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max)
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max?.toLocaleString()}`;
  };

  const getJobAge = (createdAt: Date) => {
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getModerationStatus = (createdAt: Date) => {
    const hoursSinceCreated =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreated < 24) {
      return {
        status: 'pending',
        label: 'Pending Review',
        color: 'bg-yellow-100 text-yellow-800',
      };
    } else if (hoursSinceCreated < 72) {
      return {
        status: 'flagged',
        label: 'Needs Attention',
        color: 'bg-red-100 text-red-800',
      };
    } else {
      return {
        status: 'approved',
        label: 'Approved',
        color: 'bg-green-100 text-green-800',
      };
    }
  };

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Bulk Actions Bar */}
      {selectedJobs.length > 0 && (
        <div className="border-b border-gray-200 bg-blue-50 px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''}{' '}
              selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
              >
                Approve All
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
              >
                Reject All
              </button>
              <button
                onClick={() => handleBulkAction('flag')}
                className="rounded-md bg-orange-600 px-3 py-1 text-sm text-white hover:bg-orange-700"
              >
                Flag All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="border-b border-gray-200 px-6 py-3">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider text-gray-500">
          <div className="col-span-1">
            <input
              type="checkbox"
              checked={selectedJobs.length === jobs.length && jobs.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-4">Job Details</div>
          <div className="col-span-2">Company</div>
          <div className="col-span-2">Applications</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {jobs.map(job => {
          const moderationStatus = getModerationStatus(job.createdAt);

          return (
            <div key={job.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="grid grid-cols-12 items-center gap-4">
                {/* Checkbox */}
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedJobs.includes(job.id)}
                    onChange={() => handleSelectJob(job.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {/* Job Details */}
                <div className="col-span-4">
                  <div className="flex items-start space-x-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {job.title}
                      </Link>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="mr-1 h-3 w-3" />
                          {job.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {getJobAge(job.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="mr-1 h-3 w-3" />
                          {formatSalary(job.salaryMin, job.salaryMax)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    {job.company?.logo ? (
                      <img
                        src={job.company.logo}
                        alt={job.company.name}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-200">
                        <Building className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {job.company?.name || 'Unknown Company'}
                      </div>
                      <div className="text-xs capitalize text-gray-500">
                        {job.jobType.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Applications */}
                <div className="col-span-2">
                  <div className="text-sm text-gray-900">
                    {job._count.jobApplications} applications
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${moderationStatus.color}`}
                  >
                    {moderationStatus.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="relative col-span-1">
                  <button
                    onClick={() =>
                      setActionsOpen(actionsOpen === job.id ? null : job.id)
                    }
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {actionsOpen === job.id && (
                    <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
                      <div className="py-1">
                        <button
                          onClick={() => handleJobAction(job.id, 'approve')}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleJobAction(job.id, 'reject')}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <X className="mr-2 h-4 w-4 text-red-500" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleJobAction(job.id, 'flag')}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Flag className="mr-2 h-4 w-4 text-orange-500" />
                          Flag for Review
                        </button>
                        <Link
                          href={`/admin/moderation/jobs/${job.id}`}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="mr-2 h-4 w-4 text-blue-500" />
                          Review Details
                        </Link>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Eye className="mr-2 h-4 w-4 text-gray-500" />
                          View Public Page
                        </Link>
                      </div>
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
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * 20 + 1} to{' '}
            {Math.min(currentPage * 20, totalCount)} of {totalCount} jobs
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={`/admin/moderation/jobs?page=${currentPage - 1}`}
              className={`rounded-md p-2 ${
                currentPage === 1
                  ? 'cursor-not-allowed text-gray-400'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>

            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>

            <Link
              href={`/admin/moderation/jobs?page=${currentPage + 1}`}
              className={`rounded-md p-2 ${
                currentPage === totalPages
                  ? 'cursor-not-allowed text-gray-400'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {jobs.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-500">
            <Building className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No jobs found
            </h3>
            <p>Try adjusting your filters to see more results.</p>
          </div>
        </div>
      )}
    </div>
  );
}
