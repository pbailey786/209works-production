'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  MapPin,
  DollarSign,
  Clock,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface SavedJob {
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
  savedAt: string;
  applicationId: string;
}

interface SavedJobsClientProps {
  userId: string;
}

export default function SavedJobsClient({ userId }: SavedJobsClientProps) {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [removingJob, setRemovingJob] = useState<string | null>(null);

  const fetchSavedJobs = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/profile/saved-jobs?page=${pageNum}&limit=10`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch saved jobs');
      }

      const data = await response.json();
      setSavedJobs(data.jobs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load saved jobs'
      );
    } finally {
      setLoading(false);
    }
  };

  const removeSavedJob = async (jobId: string, applicationId: string) => {
    try {
      setRemovingJob(jobId);

      const response = await fetch('/api/profile/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action: 'unsave' }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove saved job');
      }

      // Remove from local state
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove job');
    } finally {
      setRemovingJob(null);
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
    fetchSavedJobs();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center text-3xl font-bold text-gray-900">
            <Heart className="mr-3 h-8 w-8 text-red-500" />
            Saved Jobs
          </h1>
          <p className="mt-1 text-gray-600">
            {savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved for
            later
          </p>
        </div>
        <Link
          href="/jobs"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Find More Jobs
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {savedJobs.length === 0 ? (
        <div className="py-12 text-center">
          <Heart className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            No saved jobs yet
          </h2>
          <p className="mb-6 text-gray-600">
            Start saving jobs you're interested in to keep track of them here.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            Browse Jobs
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Jobs List */}
          <div className="space-y-4">
            {savedJobs.map(job => (
              <div
                key={job.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-start justify-between">
                      <Link href={`/jobs/${job.id}`} className="block">
                        <h3 className="text-xl font-semibold text-gray-900 transition-colors hover:text-blue-600">
                          {job.title}
                        </h3>
                        <p className="mt-1 text-lg text-gray-700">
                          {job.company}
                        </p>
                      </Link>
                      <button
                        onClick={() =>
                          removeSavedJob(job.id, job.applicationId)
                        }
                        disabled={removingJob === job.id}
                        className="p-2 text-gray-400 transition-colors hover:text-red-500"
                        title="Remove from saved jobs"
                      >
                        {removingJob === job.id ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-red-500"></div>
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <MapPin className="mr-1 h-4 w-4" />
                        {job.location}
                        {job.isRemote && (
                          <span className="ml-1 text-green-600">(Remote)</span>
                        )}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="mr-1 h-4 w-4" />
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </span>
                      <span className="rounded bg-gray-100 px-2 py-1 capitalize">
                        {job.jobType.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="mb-3 line-clamp-2 text-gray-700">
                      {job.description.length > 200
                        ? `${job.description.substring(0, 200)}...`
                        : job.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Clock className="mr-1 h-4 w-4" />
                          Saved{' '}
                          {formatDistanceToNow(new Date(job.savedAt), {
                            addSuffix: true,
                          })}
                        </span>
                        <span>
                          Posted{' '}
                          {formatDistanceToNow(new Date(job.postedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchSavedJobs(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => fetchSavedJobs(page + 1)}
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
