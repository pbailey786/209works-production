'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
// // // // import { useSession } from 'next-auth/react'; // TODO: Replace with Clerk // TODO: Replace with Clerk // TODO: Replace with Clerk // TODO: Replace with Clerk
import {
  Eye,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Edit,
  Share2,
  BarChart3,
  Star,
  MessageSquare,
  Download,
  RefreshCw,
  Pause,
  Play,
  Archive,
  Copy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function EmployerJobDetailsPage() {
  const params = useParams();
  // Mock session for now - replace with Clerk when implemented
  const session = { user: { email: 'admin@209.works', role: 'admin' } };
  const [activeTab, setActiveTab] = useState('overview');
  const [jobData, setJobData] = useState<any>(null);
  const [jobStats, setJobStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        // Fetch job details
        const jobResponse = await fetch(`/api/jobs/${params.id}`);
        if (!jobResponse.ok) {
          throw new Error('Failed to fetch job data');
        }
        const jobData = await jobResponse.json();
        setJobData(jobData.job);

        // Fetch job statistics
        const statsResponse = await fetch(`/api/jobs/${params.id}/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setJobStats(statsData);
        } else {
          // Set default stats if API fails
          setJobStats({
            stats: {
              totalViews: 0,
              totalApplications: 0,
              shortlisted: 0,
              hired: 0,
            },
            recentApplicants: [],
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchJobData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#2d4a3e]"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !jobData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error || 'Job not found'}</p>
          <Link href="/employers/my-jobs" className="mt-4 text-blue-600 hover:underline">
            ← Back to My Jobs
          </Link>
        </div>
      </div>
    );
  }

  // Use real stats if available, otherwise fallback to defaults
  const stats = jobStats?.stats || {
    totalViews: 0,
    totalApplications: 0,
    shortlisted: 0,
    hired: 0,
  };

  const recentApplicants = jobStats?.recentApplicants || [];

  // Format job data for display
  const formatJobType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatSalary = (salaryMin: number | null, salaryMax: number | null) => {
    if (salaryMin && salaryMax) {
      return `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`;
    } else if (salaryMin) {
      return `From $${salaryMin.toLocaleString()}`;
    } else if (salaryMax) {
      return `Up to $${salaryMax.toLocaleString()}`;
    }
    return 'Salary not specified';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Real data for stats and applicants
  const applicantStats = [
    {
      label: 'Total Views',
      value: stats.totalViews.toLocaleString(),
      trend: 'neutral',
      change: '0%' // TODO: Implement view tracking and trends
    },
    {
      label: 'Applications',
      value: stats.totalApplications.toLocaleString(),
      trend: jobStats?.stats?.trends?.applications?.trend || 'neutral',
      change: jobStats?.stats?.trends?.applications?.change || '0%'
    },
    {
      label: 'Shortlisted',
      value: stats.shortlisted.toLocaleString(),
      trend: 'neutral',
      change: '0%' // TODO: Implement shortlisted trends
    },
    {
      label: 'Hired',
      value: stats.hired.toLocaleString(),
      trend: 'neutral',
      change: '0%' // TODO: Implement hired trends
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/employers/my-jobs"
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to My Jobs
            </Link>
            <div className="flex items-center space-x-2">
              <span className="rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
              <span className="text-sm text-gray-500">
                Job ID: {jobData.id}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              disabled
              className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-400 cursor-not-allowed"
              title="Share feature coming soon"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
            <button
              disabled
              className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-400 cursor-not-allowed"
              title="Duplicate feature coming soon"
            >
              <Copy className="h-4 w-4" />
              <span>Duplicate</span>
            </button>
            <Link
              href={`/employers/job/${jobData.id}/edit`}
              className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Job</span>
            </Link>
          </div>
        </div>

        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {jobData.title}
          </h1>
          <div className="flex items-center space-x-6 text-gray-600">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{jobData.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatJobType(jobData.jobType)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4" />
              <span>{formatSalary(jobData.salaryMin, jobData.salaryMax)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>
                Posted {formatDate(jobData.postedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        {applicantStats.map((stat, index) => (
          <div key={index} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(stat.trend)}
                <span
                  className={`text-sm ${
                    stat.trend === 'up'
                      ? 'text-green-600'
                      : stat.trend === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'applicants', label: 'Applicants', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Job Details */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold">Job Description</h3>
              <div className="mb-6 text-gray-700 whitespace-pre-wrap">{jobData.description}</div>

              {jobData.categories && jobData.categories.length > 0 && (
                <>
                  <h4 className="mb-3 font-semibold">Categories</h4>
                  <div className="mb-6 flex flex-wrap gap-2">
                    {jobData.categories.map((category: string, index: number) => (
                      <span key={index} className="inline-block rounded-full bg-[#2d4a3e]/10 px-3 py-1 text-sm font-medium text-[#2d4a3e]">
                        {category}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <h4 className="mb-3 font-semibold">Job Details</h4>
              <div className="space-y-2 text-gray-700">
                <p><strong>Company:</strong> {jobData.company}</p>
                <p><strong>Location:</strong> {jobData.location}</p>
                <p><strong>Job Type:</strong> {formatJobType(jobData.jobType)}</p>
                <p><strong>Salary:</strong> {formatSalary(jobData.salaryMin, jobData.salaryMax)}</p>
                <p><strong>Posted:</strong> {formatDate(jobData.postedAt)}</p>
                {jobData.source && <p><strong>Source:</strong> {jobData.source}</p>}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold">Job Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Application Rate</span>
                  <span className="font-semibold">1.8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Quality Score</span>
                  <span className="font-semibold">8.2/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time to Fill</span>
                  <span className="font-semibold">18 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Source Performance</span>
                  <span className="font-semibold">Direct: 65%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-lg border bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
              <div className="space-y-3">
                <button className="flex w-full items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  <ExternalLink className="h-4 w-4" />
                  <span>View Public Listing</span>
                </button>
                <button className="flex w-full items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh Listing</span>
                </button>
                <button className="flex w-full items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
                  <Pause className="h-4 w-4" />
                  <span>Pause Job</span>
                </button>
                <button className="flex w-full items-center space-x-2 rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50">
                  <Archive className="h-4 w-4" />
                  <span>Archive Job</span>
                </button>
              </div>
            </div>

            {/* Recent Applicants */}
            <div className="rounded-lg border bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Applicants</h3>
                <Link
                  href={`/employers/applicants?job=${jobData.id}`}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {recentApplicants.length > 0 ? (
                  recentApplicants.map((applicant: any) => (
                    <div
                      key={applicant.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {applicant.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {applicant.applied}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="mb-1 flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {applicant.score}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${getStatusColor(applicant.status)}`}
                        >
                          {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p>No applications yet</p>
                    <p className="text-sm">Applications will appear here when candidates apply</p>
                  </div>
                )}
              </div>
            </div>

            {/* Job Settings */}
            <div className="rounded-lg border bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold">Job Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Job Status
                  </label>
                  <select className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500">
                    <option>Active</option>
                    <option>Paused</option>
                    <option>Archived</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Auto-renewal
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      defaultChecked
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Automatically renew this job posting
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Application Notifications
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        defaultChecked
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Email me when someone applies
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Daily application summary
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                    Save Settings
                  </button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-3 text-sm font-medium text-gray-700">Job Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Created</span>
                      <span className="text-gray-900">
                        {formatDate(jobData.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="text-gray-900">{formatDate(jobData.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'applicants' && (
        <div className="rounded-lg border bg-white">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Applicants for this Job</h3>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <Link
                  href={`/employers/applicants?job=${jobData.id}`}
                  className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  <Users className="h-4 w-4" />
                  <span>Manage All</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Applied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentApplicants.length > 0 ? (
                    recentApplicants.map((applicant: any) => (
                      <tr key={applicant.id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                              <span className="text-sm font-medium text-gray-600">
                                {applicant.name
                                  .split(' ')
                                  .map((n: string) => n[0])
                                  .join('')}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {applicant.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <Star className="mr-1 h-4 w-4 text-yellow-400" />
                            <span className="text-sm text-gray-900">
                              {applicant.score}/100
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {applicant.applied}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(applicant.status)}`}
                          >
                            {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/employers/candidates/${applicant.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </Link>
                            <a
                              href={`mailto:${applicant.email}?subject=Re: ${jobData.title} Application`}
                              className="text-green-600 hover:text-green-900"
                            >
                              Email
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                          <h3 className="mb-2 text-lg font-medium">No applications yet</h3>
                          <p className="text-sm">Applications will appear here when candidates apply to this job</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">
              Performance Analytics
            </h3>
            <div className="flex h-64 items-center justify-center rounded-lg bg-gray-100">
              <p className="text-gray-500">
                Analytics charts would be displayed here
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-6">
              <h4 className="mb-4 font-semibold">Traffic Sources</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Direct</span>
                  <span>65%</span>
                </div>
                <div className="flex justify-between">
                  <span>Search</span>
                  <span>25%</span>
                </div>
                <div className="flex justify-between">
                  <span>Social</span>
                  <span>10%</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <h4 className="mb-4 font-semibold">Application Timeline</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Week 1</span>
                  <span>8 applications</span>
                </div>
                <div className="flex justify-between">
                  <span>Week 2</span>
                  <span>12 applications</span>
                </div>
                <div className="flex justify-between">
                  <span>Week 3</span>
                  <span>3 applications</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
