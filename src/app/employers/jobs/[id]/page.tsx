'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
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
  ArrowLeft
} from 'lucide-react';

export default function JobDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPublished = searchParams.get('published') === 'true';

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        if (!response.ok) {
          throw new Error('Job not found');
        }
        const data = await response.json();
        setJob(data.job);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchJob();
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
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-gray-600">Applications</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-gray-600">Shortlisted</div>
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
                  <p className="text-green-800">
                    {job.contactEmail || job.contactPhone || job.contactMethod || 'Contact information not specified'}
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
                  href={`/employers/my-jobs`}
                  className="w-full flex items-center justify-center space-x-2 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  <span>Manage Jobs</span>
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
      </div>
    </div>
  );
}