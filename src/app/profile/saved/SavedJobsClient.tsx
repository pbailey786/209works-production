'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MapPin, DollarSign, Clock, Trash2, ExternalLink } from 'lucide-react';

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
      const response = await fetch(`/api/profile/saved-jobs?page=${pageNum}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved jobs');
      }

      const data = await response.json();
      setSavedJobs(data.jobs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved jobs');
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
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max?.toLocaleString()}`;
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Heart className="w-8 h-8 text-red-500 mr-3" />
            Saved Jobs
          </h1>
          <p className="text-gray-600 mt-1">
            {savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved for later
          </p>
        </div>
        <Link
          href="/jobs"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Find More Jobs
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {savedJobs.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved jobs yet</h2>
          <p className="text-gray-600 mb-6">
            Start saving jobs you're interested in to keep track of them here.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Jobs
            <ExternalLink className="w-4 h-4 ml-2" />
          </Link>
        </div>
      ) : (
        <>
          {/* Jobs List */}
          <div className="space-y-4">
            {savedJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <Link href={`/jobs/${job.id}`} className="block">
                        <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-lg text-gray-700 mt-1">{job.company}</p>
                      </Link>
                      <button
                        onClick={() => removeSavedJob(job.id, job.applicationId)}
                        disabled={removingJob === job.id}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        title="Remove from saved jobs"
                      >
                        {removingJob === job.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location}
                        {job.isRemote && <span className="ml-1 text-green-600">(Remote)</span>}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </span>
                      <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                        {job.jobType.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-3 line-clamp-2">
                      {job.description.length > 200 
                        ? `${job.description.substring(0, 200)}...` 
                        : job.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Saved {formatDistanceToNow(new Date(job.savedAt), { addSuffix: true })}
                        </span>
                        <span>
                          Posted {formatDistanceToNow(new Date(job.postedAt), { addSuffix: true })}
                        </span>
                      </div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
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
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchSavedJobs(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => fetchSavedJobs(page + 1)}
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
