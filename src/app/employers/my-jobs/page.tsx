"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  RefreshCw
} from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
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

    if (!session || session.user.role !== 'employer') {
      router.push('/employers/signin');
      return;
    }
  }, [session, status, router]);

  // Fetch jobs for the current employer
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/employers/jobs?employerId=${session.user.id}`);

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
  }, [session?.user?.id]);

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show authentication error
  if (!session || session.user.role !== 'employer') {
    return null;
  }

  // Transform jobs to match the expected format
  const transformedJobs: Job[] = jobs.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.jobType || job.type || 'Full-time',
    salary: job.salary || (job.salaryMin && job.salaryMax ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}` : undefined),
    posted: job.postedAt || job.createdAt || new Date().toISOString(),
    expires: job.expires,
    status: job.status || 'active',
    applications: job.applications || 0,
    views: job.views || 0,
    shortlisted: job.shortlisted || 0,
    interviewed: job.interviewed || 0,
    hired: job.hired || 0,
    performance: job.performance || 'good'
  }));

  const filteredJobs = transformedJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "expired": return "bg-red-100 text-red-800";
      case "draft": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "excellent": return "text-green-600";
      case "high": return "text-blue-600";
      case "good": return "text-yellow-600";
      case "low": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case "excellent":
      case "high":
        return <TrendingUp className="h-4 w-4" />;
      case "low":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
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
    active: transformedJobs.filter(j => j.status === "active").length,
    paused: transformedJobs.filter(j => j.status === "paused").length,
    expired: transformedJobs.filter(j => j.status === "expired").length,
    totalApplications: transformedJobs.reduce((sum, job) => sum + (job.applications || 0), 0),
    totalViews: transformedJobs.reduce((sum, job) => sum + (job.views || 0), 0)
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Message */}
      {publishedJobId && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Job Published Successfully!</h3>
              <p className="text-sm text-green-700 mt-1">
                Your job post has been published and is now live on 209.works.
                <Link href={`/jobs/${publishedJobId}`} className="underline hover:text-green-600 ml-1">
                  View the live posting →
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Job Listings</h1>
            <p className="text-gray-600">
              Manage all your job postings, track performance, and review applications
            </p>
          </div>
          <Link
            href="/employers/create-job-post"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Post New Job</span>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-yellow-600">{stats.paused}</div>
            <div className="text-sm text-gray-600">Paused</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-sm text-gray-600">Expired</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{stats.totalApplications}</div>
            <div className="text-sm text-gray-600">Applications</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">{stats.totalViews.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search jobs by title or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="applications">Most Applications</option>
              <option value="views">Most Views</option>
              <option value="expiring">Expiring Soon</option>
            </select>

            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedJobs.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedJobs.length} job{selectedJobs.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('renew')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Renew
                </button>
                <button
                  onClick={() => handleBulkAction('pause')}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Pause
                </button>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
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
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedJobs.includes(job.id)}
                    onChange={() => handleSelectJob(job.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />

                  {/* Job Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link
                        href={`/employers/job/${job.id}`}
                        className="text-xl font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {job.title}
                      </Link>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                      <div className={`flex items-center space-x-1 ${getPerformanceColor(job.performance || 'low')}`}>
                        {getPerformanceIcon(job.performance || 'low')}
                        <span className="text-sm font-medium capitalize">{job.performance || 'low'}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-gray-600 mb-4">
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
                        <span>Posted {new Date(job.posted).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{job.applications}</div>
                        <div className="text-xs text-gray-600">Applications</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{job.views}</div>
                        <div className="text-xs text-gray-600">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{job.shortlisted}</div>
                        <div className="text-xs text-gray-600">Shortlisted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{job.hired}</div>
                        <div className="text-xs text-gray-600">Hired</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
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
                  {job.status === "active" ? (
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
              {job.status === "active" && job.expires && new Date(job.expires) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      This job expires on {new Date(job.expires).toLocaleDateString()}.
                      <button className="ml-2 text-yellow-600 hover:text-yellow-500 underline">
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
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filters" 
                : "You haven't posted any jobs yet"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Link
                href="/employers/post-job"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            {selectedJobs.length === filteredJobs.length ? 'Deselect All' : 'Select All'}
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <MyJobsContent />
    </Suspense>
  );
}