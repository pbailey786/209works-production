'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { 
  CheckCircle, 
  Eye, 
  Users, 
  MapPin, 
  DollarSign, 
  Clock,
  ExternalLink,
  Edit,
  Share2,
  ArrowLeft,
  Mail,
  Phone,
  Star,
  AlertCircle
} from 'lucide-react';

export default function JobDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationStats, setApplicationStats] = useState({ total: 0, pending: 0, reviewing: 0, interview: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllApplicants, setShowAllApplicants] = useState(false);

  const isPublished = searchParams.get('published') === 'true';

  useEffect(() => {
    const fetchJobAndApplications = async () => {
      try {
        // Fetch job details
        const jobResponse = await fetch(`/api/jobs/${params.id}`);
        if (!jobResponse.ok) {
          throw new Error('Job not found');
        }
        const jobData = await jobResponse.json();
        setJob(jobData.job);

        // Fetch applications for this specific job
        const appResponse = await fetch(`/api/employers/applications?jobId=${params.id}&limit=50`);
        if (appResponse.ok) {
          const appData = await appResponse.json();
          setApplications(appData.applications || []);
          
          // Calculate stats
          const total = appData.applications?.length || 0;
          const statusCounts = (appData.applications || []).reduce((acc: any, app: any) => {
            acc[app.status || 'pending'] = (acc[app.status || 'pending'] || 0) + 1;
            return acc;
          }, {});
          
          setApplicationStats({
            total,
            pending: statusCounts.pending || 0,
            reviewing: statusCounts.reviewing || 0,
            interview: statusCounts.interview || 0
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchJobAndApplications();
    }
  }, [params.id]);

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view your jobs</p>
          <Link href="/sign-in" className="text-blue-600 hover:underline mt-2 block">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Job not found'}</p>
          <Link href="/employers/my-jobs" className="text-blue-600 hover:underline mt-2 block">
            ← Back to My Jobs
          </Link>
        </div>
      </div>
    );
  }

  const formatSalary = (salaryMin: number | null, salaryMax: number | null) => {
    if (salaryMin && salaryMax) {
      return `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`;
    } else if (salaryMin) {
      return `From $${salaryMin.toLocaleString()}`;
    }
    return 'Salary not specified';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-4xl mx-auto p-6">
        
        {/* Success Banner */}
        {isPublished && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="text-xl font-semibold text-green-900">Job Posted Successfully! 🎉</h2>
                <p className="text-green-700 mt-1">
                  Your job is now live and candidates can start applying. We'll notify you when applications come in.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/employers/my-jobs"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to My Jobs</span>
            </Link>
            <div className="flex items-center space-x-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Active
              </span>
              <span className="text-sm text-gray-500">ID: {job.id}</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-600">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{job.viewCount || 0}</div>
            <div className="text-gray-600">Views</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{applicationStats.total}</div>
            <div className="text-gray-600">Applications</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{applicationStats.interview}</div>
            <div className="text-gray-600">In Interview</div>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Job Details</h3>
              
              {job.description && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {job.description
                      .replace(/\[CONTACT_EMAIL:.*?\]/g, '')
                      .replace(/\[REQUIRES_DEGREE:.*?\]/g, '')
                      .trim()
                    }
                  </p>
                </div>
              )}

              {job.requirements && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-2">How to Apply</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-2">
                    📝 Apply through 209jobs online application system
                  </p>
                  <p className="text-green-700 text-sm">
                    ✓ Applications tracked in employer dashboard<br/>
                    ✓ Email notifications sent to: {job.contactEmail || job.contactPhone || job.contactMethod || 'employer@company.com'}<br/>
                    ✓ Easy to import to existing hiring systems
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/jobs/${job.id}`}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Public Listing</span>
                </Link>
                <Link
                  href={`/employers/job/${job.id}/edit`}
                  className="w-full flex items-center justify-center space-x-2 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Job</span>
                </Link>
                <button 
                  onClick={() => {
                    const jobUrl = `${window.location.origin}/jobs/${job.id}`;
                    navigator.clipboard.writeText(jobUrl).then(() => {
                      alert('Job link copied to clipboard!');
                    }).catch(() => {
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea');
                      textArea.value = jobUrl;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      alert('Job link copied to clipboard!');
                    });
                  }}
                  className="w-full flex items-center justify-center space-x-2 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Copy Job Link</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Job Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted:</span>
                  <span className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">{new Date(job.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Job Type:</span>
                  <span className="font-medium">{job.salaryType === 'HOURLY' ? 'Hourly' : 'Salary'}</span>
                </div>
              </div>
            </div>

            {isPublished && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Next Steps</h3>
                <ul className="text-blue-800 text-sm space-y-2 mb-4">
                  <li>• Monitor applications as they come in</li>
                  <li>• Share your job on social media</li>
                  <li>• Check back for candidate messages</li>
                  <li>• Review and shortlist top applicants</li>
                </ul>
                <Link
                  href="/employers/post-job"
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>➕</span>
                  <span>Post Another Job</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Applications Section */}
        {applicationStats.total > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Applications ({applicationStats.total})</h3>
                  <p className="text-gray-600 mt-1">Manage candidates who applied for this position</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {applicationStats.pending} pending, {applicationStats.reviewing} reviewing, {applicationStats.interview} in interview
                  </span>
                </div>
              </div>

              {/* Application Status Filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setShowAllApplicants(!showAllApplicants)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  {showAllApplicants ? 'Show Less' : 'View All Applicants'}
                </button>
              </div>

              {/* Recent Applications Preview */}
              <div className="space-y-4">
                {applications.slice(0, showAllApplicants ? applications.length : 3).map(application => {
                  const statusColors = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    reviewing: 'bg-blue-100 text-blue-800',
                    interview: 'bg-purple-100 text-purple-800',
                    offer: 'bg-green-100 text-green-800',
                    rejected: 'bg-red-100 text-red-800'
                  };

                  return (
                    <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {application.user.name || application.user.email}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              statusColors[application.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {application.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {application.user.email}
                            </span>
                            {application.user.phoneNumber && (
                              <span className="flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {application.user.phoneNumber}
                              </span>
                            )}
                            {application.user.location && (
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {application.user.location}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Applied {formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true })}
                            </span>
                          </div>

                          {application.user.skills && application.user.skills.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {application.user.skills.slice(0, 4).map((skill: string, index: number) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    {skill}
                                  </span>
                                ))}
                                {application.user.skills.length > 4 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    +{application.user.skills.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                window.location.href = `mailto:${application.user.email}?subject=Regarding your application for ${job.title}`;
                              }}
                              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                            >
                              <Mail className="w-3 h-3 inline mr-1" />
                              Email
                            </button>
                            
                            {application.user.phoneNumber && (
                              <button
                                onClick={() => {
                                  window.location.href = `tel:${application.user.phoneNumber}`;
                                }}
                                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                              >
                                <Phone className="w-3 h-3 inline mr-1" />
                                Call
                              </button>
                            )}

                            <select
                              value={application.status}
                              onChange={async (e) => {
                                try {
                                  const response = await fetch('/api/employers/applications', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                      applicationId: application.id, 
                                      status: e.target.value 
                                    }),
                                  });
                                  
                                  if (response.ok) {
                                    // Refresh the page data
                                    window.location.reload();
                                  }
                                } catch (error) {
                                  console.error('Failed to update status:', error);
                                }
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewing">Reviewing</option>
                              <option value="interview">Interview</option>
                              <option value="offer">Offer</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {applications.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h4>
                  <p className="text-gray-600">Applications will appear here when job seekers apply to this position.</p>
                </div>
              )}

              {!showAllApplicants && applications.length > 3 && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setShowAllApplicants(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all {applications.length} applications →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}