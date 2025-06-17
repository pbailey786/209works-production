'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Copy,
  Archive,
  Pause,
  Play,
  MoreHorizontal,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  posted: string;
  expires?: string;
  status: string;
  applications?: number;
  views?: number;
  shortlisted?: number;
  interviewed?: number;
  hired?: number;
  performance?: string;
  description?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  postedAt?: string;
  createdAt?: string;
}

function MyJobsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishedJobId, setPublishedJobId] = useState<string | null>(null);

  // Check for published job ID in URL params
  useEffect(() => {
    const published = searchParams.get('published');
    if (published) {
      setPublishedJobId(published);
      // Clear the URL parameter after a few seconds
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('published');
        window.history.replaceState({}, '', url.toString());
        setPublishedJobId(null);
      }, 5000);
    }
  }, [searchParams]);

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      router.push('/employers/signin');
      return;
    }
  }, [session, status, router]);

  // Fetch jobs for the current employer
  useEffect(() => {
    if (!(session?.user as any)?.id) return;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/employers/jobs?employerId=${(session!.user as any).id}`
        );

        if (response.ok) {
          const data = await response.json();
          setJobs(data.jobs || []);
        } else {
          console.error('Failed to fetch jobs');
          setJobs([]);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [(session?.user as any)?.id]);

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show authentication error
  if (!session || !session.user || (session!.user as any).role !== 'employer') {
    return null;
  }

  // Transform jobs to match the expected format
  const transformedJobs: Job[] = jobs.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.jobType || job.type || 'Full-time',
    salary:
      job.salary ||
      (job.salaryMin && job.salaryMax
        ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
        : undefined),
    posted: job.postedAt || job.createdAt || new Date().toISOString(),
    expires: job.expires,
    status: job.status || 'active',
    applications: job.applications || 0,
    views: job.views || 0,
    shortlisted: job.shortlisted || 0,
    interviewed: job.interviewed || 0,
    hired: job.hired || 0,
    performance: job.performance || 'good',
  }));

  const filteredJobs = transformedJobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return 'text-green-600';
      case 'high':
        return 'text-blue-600';
      case 'good':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'excellent':
      case 'high':
        return <TrendingUp className="h-4 w-4" />;
      case 'low':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    setSelectedJobs(
      selectedJobs.length === filteredJobs.length
        ? []
        : filteredJobs.map(job => job.id)
    );
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on jobs:`, selectedJobs);
    // Handle bulk actions here
    setSelectedJobs([]);
  };

  const stats = {
    total: transformedJobs.length,
    active: transformedJobs.filter(j => j.status === 'active').length,
    paused: transformedJobs.filter(j => j.status === 'paused').length,
    expired: transformedJobs.filter(j => j.status === 'expired').length,
    totalApplications: transformedJobs.reduce(
      (sum, job) => sum + (job.applications || 0),
      0
    ),
    totalViews: transformedJobs.reduce((sum, job) => sum + (job.views || 0), 0),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Success Message */}
      {publishedJobId && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Job Published Successfully!
              </h3>
              <p className="mt-1 text-sm text-green-700">
                Your job post has been published and is now live on 209.works.
                <Link
                  href={`/jobs/${publishedJobId}`}
                  className="ml-1 underline hover:text-green-600"
                >
                  View the live posting →
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              My Job Listings
            </h1>
            <p className="text-gray-600">
              Manage all your job postings, track performance, and review
              applications
            </p>
          </div>
          <Link
            href="/employers/create-job-post"
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Post New Job</span>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="rounded-lg border bg-white p-4">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.paused}
            </div>
            <div className="text-sm text-gray-600">Paused</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.expired}
            </div>
            <div className="text-sm text-gray-600">Expired</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalApplications}
            </div>
            <div className="text-sm text-gray-600">Applications</div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalViews.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 rounded-lg border bg-white p-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-x-4 md:space-y-0">
          {/* Search */}
          <div className="max-w-md flex-1">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search jobs by title or location..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="applications">Most Applications</option>
              <option value="views">Most Views</option>
              <option value="expiring">Expiring Soon</option>
            </select>

            <button className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedJobs.length > 0 && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedJobs.length} job{selectedJobs.length > 1 ? 's' : ''}{' '}
                selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('renew')}
                  className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                >
                  Renew
                </button>
                <button
                  onClick={() => handleBulkAction('pause')}
                  className="rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700"
                >
                  Pause
                </button>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.map(job => (
          <div
            key={job.id}
            className="rounded-lg border bg-white transition-shadow hover:shadow-md"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex flex-1 items-start space-x-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedJobs.includes(job.id)}
                    onChange={() => handleSelectJob(job.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  {/* Job Info */}
                  <div className="flex-1">
                    <div className="mb-2 flex items-center space-x-3">
                      <Link
                        href={`/employers/job/${job.id}`}
                        className="text-xl font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {job.title}
                      </Link>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(job.status)}`}
                      >
                        {job.status}
                      </span>
                      <div
                        className={`flex items-center space-x-1 ${getPerformanceColor(job.performance || 'low')}`}
                      >
                        {getPerformanceIcon(job.performance || 'low')}
                        <span className="text-sm font-medium capitalize">
                          {job.performance || 'low'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4 flex items-center space-x-6 text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{job.type}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{job.salary}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Posted {new Date(job.posted).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {job.applications}
                        </div>
                        <div className="text-xs text-gray-600">
                          Applications
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {job.views}
                        </div>
                        <div className="text-xs text-gray-600">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {job.shortlisted}
                        </div>
                        <div className="text-xs text-gray-600">Shortlisted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {job.hired}
                        </div>
                        <div className="text-xs text-gray-600">Hired</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-4 flex items-center space-x-2">
                  <Link
                    href={`/employers/job/${job.id}`}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/employers/job/${job.id}/edit`}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Edit Job"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Duplicate Job"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {job.status === 'active' ? (
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Pause Job"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Activate Job"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="More Actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expiration Warning */}
              {job.status === 'active' &&
                job.expires &&
                new Date(job.expires) <=
                  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                  <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        This job expires on{' '}
                        {new Date(job.expires).toLocaleDateString()}.
                        <button className="ml-2 text-yellow-600 underline hover:text-yellow-500">
                          Renew now
                        </button>
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="py-12 text-center">
            <div className="mb-4 text-gray-400">
              <Users className="mx-auto h-12 w-12" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No jobs found
            </h3>
            <p className="mb-4 text-gray-600">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : "You haven't posted any jobs yet"}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                href="/employers/post-job"
                className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Post Your First Job</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Bulk Select All */}
      {filteredJobs.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {selectedJobs.length === filteredJobs.length
              ? 'Deselect All'
              : 'Select All'}
          </button>
          <div className="text-sm text-gray-600">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <MyJobsContent />
    </Suspense>
  );
}
