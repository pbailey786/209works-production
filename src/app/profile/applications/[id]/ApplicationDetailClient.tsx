'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  ExternalLink,
  FileText,
  MessageSquare,
  Edit,
  Trash2,
} from 'lucide-react';
import ApplicationTimeline from '@/components/applications/ApplicationTimeline';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  postedAt: string;
  expiresAt?: string;
  isRemote: boolean;
  categories: string[];
  url: string;
  status?: string;
}

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  coverLetter?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  job: Job;
}

interface ApplicationDetailClientProps {
  application: Application;
}

export default function ApplicationDetailClient({
  application,
}: ApplicationDetailClientProps) {
  const router = useRouter();
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max?.toLocaleString()}`;
  };

  const handleWithdrawApplication = async () => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    setIsWithdrawing(true);
    try {
      const response = await fetch(`/api/profile/applications?id=${application.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to withdraw application');
      }

      // Redirect back to applications list
      router.push('/profile/applications');
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('Failed to withdraw application. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/profile/applications"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Applications
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/jobs/${application.job.id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Job Posting
          </Link>
          
          {application.status !== 'withdrawn' && application.status !== 'rejected' && (
            <button
              onClick={handleWithdrawApplication}
              disabled={isWithdrawing}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isWithdrawing ? 'Withdrawing...' : 'Withdraw Application'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Timeline */}
        <div className="lg:col-span-2">
          <ApplicationTimeline
            applicationId={application.id}
            currentStatus={application.status}
            jobTitle={application.job.title}
            company={application.job.company}
            appliedAt={application.appliedAt}
          />
        </div>

        {/* Sidebar - Job & Application Details */}
        <div className="space-y-6">
          {/* Job Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{application.job.title}</h4>
                <div className="flex items-center mt-1 text-gray-600">
                  <Building2 className="h-4 w-4 mr-1" />
                  <span>{application.job.company}</span>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{application.job.location}</span>
                {application.job.isRemote && (
                  <span className="ml-2 text-green-600">• Remote</span>
                )}
              </div>

              {(application.job.salaryMin || application.job.salaryMax) && (
                <div className="flex items-center text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>{formatSalary(application.job.salaryMin, application.job.salaryMax)}</span>
                </div>
              )}

              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Posted {new Date(application.job.postedAt).toLocaleDateString()}</span>
              </div>

              <div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {application.job.jobType.replace('_', ' ')}
                </span>
              </div>

              {application.job.categories.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Categories</p>
                  <div className="flex flex-wrap gap-1">
                    {application.job.categories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Application Materials */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Materials</h3>
            
            <div className="space-y-4">
              {application.resumeUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Resume</p>
                  <a
                    href={application.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Resume
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}

              {application.coverLetter && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Cover Letter</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {application.coverLetter}
                    </p>
                  </div>
                </div>
              )}

              {application.linkedinUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</p>
                  <a
                    href={application.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700"
                  >
                    View LinkedIn Profile
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}

              {!application.resumeUrl && !application.coverLetter && !application.linkedinUrl && (
                <p className="text-sm text-gray-500">No additional materials submitted</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note
              </button>
              
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Edit className="h-4 w-4 mr-2" />
                Update Materials
              </button>
              
              <Link
                href={`/jobs/${application.job.id}`}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Job Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
