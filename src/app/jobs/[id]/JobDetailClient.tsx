'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Job } from '@prisma/client';
import {
  BookmarkIcon,
  ShareIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
// import JobCard from '@/components/JobCard';
// import JobApplicationModal from '@/components/JobApplicationModal';

interface JobDetailClientProps {
  job: Job;
  relatedJobs: Job[];
  isAuthenticated: boolean;
  isSaved: boolean;
  userId?: string;
  userRole?: string;
  isJobOwner?: boolean;
}

// Helper function to format job type
const formatJobType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to format date
const formatDate = (date: Date): string => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;

  return date.toLocaleDateString();
};

// Helper function to clean description and extract metadata
const cleanJobDescription = (description: string): string => {
  if (!description) return '';
  
  // Remove hidden metadata tags - use more robust regex with multiline and dotall flags
  return description
    .replace(/\[CONTACT_EMAIL:.*?\]/gs, '')
    .replace(/\[REQUIRES_DEGREE:.*?\]/gs, '')
    .replace(/\[BENEFITS:\[.*?\]\]/gs, '') // More specific for nested JSON arrays
    .replace(/\s*\n\s*\n\s*/g, '\n\n') // Clean up extra whitespace
    .trim();
};

// Helper function to parse benefits from multiple sources
const parseBenefits = (benefitsData: string | null, description: string | null): any[] => {
  let benefits: any[] = [];
  
  // First, try to get benefits from the dedicated benefits field
  if (benefitsData) {
    try {
      const parsed = JSON.parse(benefitsData);
      if (Array.isArray(parsed)) {
        benefits = parsed.filter(b => b.title && b.title.trim() !== '');
      }
    } catch (e) {
      // If JSON parsing fails, treat as plain text
      if (benefitsData.trim()) {
        benefits = [{
          icon: '🎁',
          title: 'Benefits Available',
          description: benefitsData.trim(),
          key: 'legacy_benefit'
        }];
      }
    }
  }
  
  // If no benefits from dedicated field, try to extract from description
  if (benefits.length === 0 && description) {
    const benefitsMatch = description.match(/\[BENEFITS:(.*?)\]/);
    if (benefitsMatch) {
      try {
        const extractedBenefits = JSON.parse(benefitsMatch[1]);
        if (Array.isArray(extractedBenefits)) {
          benefits = extractedBenefits.filter(b => b.title && b.title.trim() !== '');
        }
      } catch (e) {
        console.error('Failed to parse benefits from description:', e);
      }
    }
  }
  
  return benefits;
};

export default function JobDetailClient({
  job,
  relatedJobs,
  isAuthenticated,
  isSaved,
  userId,
  userRole,
  isJobOwner,
}: JobDetailClientProps) {
  const [saved, setSaved] = useState(isSaved);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [creatingAlert, setCreatingAlert] = useState(false);

  // Memoized salary display
  const salaryDisplay = useMemo(() => {
    if (job.salaryMin && job.salaryMax) {
      return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
    }
    if (job.salaryMin) {
      return `From $${job.salaryMin.toLocaleString()}`;
    }
    if (job.salaryMax) {
      return `Up to $${job.salaryMax.toLocaleString()}`;
    }
    return 'Salary not specified';
  }, [job.salaryMin, job.salaryMax]);

  // Parse benefits data and clean description
  const benefits = useMemo(() => parseBenefits(job.benefits, job.description), [job.benefits, job.description]);
  const cleanDescription = useMemo(() => cleanJobDescription(job.description), [job.description]);

  // Handle save/unsave job
  const handleSaveToggle = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Please sign in to save jobs');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/jobs/save', {
        method: saved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });

      if (response.ok) {
        setSaved(!saved);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save job');
      }
    } catch (error) {
      console.error('Save job error:', error);
      setError('Failed to save job. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [isAuthenticated, saved, job.id]);

  // Handle share job
  const handleShare = useCallback(async () => {
    setSharing(true);
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${job.title} at ${job.company}`,
          text: `Check out this ${job.title} position at ${job.company} in ${job.location}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Job link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Job link copied to clipboard!');
      } catch (clipboardError) {
        setError('Failed to share job. Please copy the URL manually.');
      }
    } finally {
      setSharing(false);
    }
  }, [job.title, job.company, job.location]);

  // Handle report job
  const handleReport = useCallback(async () => {
    if (!reportReason.trim()) {
      setError('Please select a reason for reporting');
      return;
    }

    try {
      const response = await fetch('/api/jobs/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          reason: reportReason,
        }),
      });

      if (response.ok) {
        setReportSubmitted(true);
        setTimeout(() => {
          setReportModalOpen(false);
          setReportSubmitted(false);
          setReportReason('');
        }, 2000);
      } else {
        setError('Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Report error:', error);
      setError('Failed to submit report. Please try again.');
    }
  }, [job.id, reportReason]);

  // Create job alert
  const handleCreateAlert = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Please sign in to create job alerts');
      return;
    }

    setCreatingAlert(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: job.title,
          location: job.location,
          jobType: job.jobType,
        }),
      });

      if (response.ok) {
        alert('Job alert created! You\'ll receive notifications for similar jobs.');
      } else {
        setError('Failed to create job alert. Please try again.');
      }
    } catch (error) {
      console.error('Create alert error:', error);
      setError('Failed to create job alert. Please try again.');
    } finally {
      setCreatingAlert(false);
    }
  }, [isAuthenticated, job.title, job.location, job.jobType]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Job Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-3">{job.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-blue-100">
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="w-5 h-5" />
                        <span className="font-medium">{job.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-5 h-5" />
                        <span className="font-semibold">{salaryDisplay}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BriefcaseIcon className="w-5 h-5" />
                        <span>{formatJobType(job.jobType)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-3 ml-6">
                    <button
                      onClick={handleSaveToggle}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                    >
                      {saved ? (
                        <BookmarkSolidIcon className="w-5 h-5" />
                      ) : (
                        <BookmarkIcon className="w-5 h-5" />
                      )}
                      <span className="hidden sm:inline">
                        {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
                      </span>
                    </button>
                    
                    <button
                      onClick={handleShare}
                      disabled={sharing}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                    >
                      <ShareIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>
                </div>
                
                {/* Job metadata */}
                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-blue-200">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Posted {formatDate(job.postedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserGroupIcon className="w-4 h-4" />
                    <span>Via {job.source}</span>
                  </div>
                </div>
              </div>

              {/* Job Content - New 4-Section Format */}
              <div className="p-8 space-y-8">
                {/* 1. About This Role */}
                {cleanDescription && (
                  <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                      💼 About This Role
                    </h2>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {cleanDescription}
                      </p>
                    </div>
                  </section>
                )}

                {/* 2. What You'll Do - NEW SECTION */}
                {job.responsibilities && (
                  <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                      ⚡ What You'll Do
                    </h2>
                    <div className="bg-purple-50 rounded-lg p-6">
                      <div className="prose prose-gray max-w-none">
                        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {job.responsibilities}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* 3. What We're Looking For */}
                {job.requirements && (
                  <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                      🎯 What We're Looking For
                    </h2>
                    <div className="bg-red-50 rounded-lg p-6">
                      <div className="prose prose-gray max-w-none">
                        {/* Check if requirements contain "Must-Have:" and "Preferred:" sections */}
                        {job.requirements.includes('Must-Have:') ? (
                          <div className="space-y-4">
                            {job.requirements.split('Preferred:').map((section, index) => (
                              <div key={index}>
                                {index === 0 ? (
                                  <div>
                                    <h4 className="font-semibold text-red-900 mb-2">Required Qualifications:</h4>
                                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                                      {section.replace('Must-Have:', '').trim()}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <h4 className="font-semibold text-red-700 mb-2">Preferred Qualifications:</h4>
                                    <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                                      {section.trim()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {job.requirements}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* 4. What We Offer */}
                {benefits.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                      🎁 What We Offer
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {benefits.map((benefit, index) => (
                        <div
                          key={benefit.key || index}
                          className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200"
                        >
                          <span className="text-3xl mr-4">{benefit.icon}</span>
                          <div>
                            <div className="font-semibold text-green-900">
                              {benefit.title}
                            </div>
                            <div className="text-sm text-green-700">
                              {benefit.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Application Section */}
                <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 border border-green-200">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Ready to Apply?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Join {job.company} and start your career journey in {job.location}
                    </p>
                    
                    {isAuthenticated ? (
                      <button
                        onClick={() => setApplicationModalOpen(true)}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                      >
                        <PaperAirplaneIcon className="w-6 h-6" />
                        Apply Now
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-500">Sign in to apply for this position</p>
                        <div className="flex gap-4 justify-center">
                          <Link
                            href="/sign-in"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Sign In to Apply
                          </Link>
                          <Link
                            href="/sign-up"
                            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Create Account
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleCreateAlert}
                  disabled={creatingAlert}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  <StarIcon className="w-5 h-5" />
                  <span>{creatingAlert ? 'Creating...' : 'Create Job Alert'}</span>
                </button>
                
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span>Report Job</span>
                </button>
              </div>
            </div>

            {/* Related Jobs */}
            {relatedJobs.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Similar Jobs</h3>
                <div className="space-y-4">
                  {relatedJobs.slice(0, 3).map((relatedJob) => (
                    <Link
                      key={relatedJob.id}
                      href={`/jobs/${relatedJob.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900 mb-1">{relatedJob.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{relatedJob.company}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{relatedJob.location}</span>
                        <span>{formatDate(relatedJob.postedAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>View all jobs</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Job Application Modal - Simplified for now */}
      {applicationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Apply for {job.title}</h3>
            <p className="text-gray-600 mb-4">
              Application system coming soon! Please contact the employer directly for now.
            </p>
            <button
              onClick={() => setApplicationModalOpen(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Report Job</h3>
            
            {reportSubmitted ? (
              <div className="text-center py-8">
                <CheckIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-green-600 font-medium">Thank you for your report!</p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Why are you reporting this job posting?
                </p>
                
                <div className="space-y-3 mb-6">
                  {[
                    'Spam or fake job',
                    'Inappropriate content',
                    'Discrimination',
                    'Misleading information',
                    'Duplicate posting',
                    'Other'
                  ].map((reason) => (
                    <label key={reason} className="flex items-center">
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason}
                        checked={reportReason === reason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="mr-3"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setReportModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReport}
                    disabled={!reportReason}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Submit Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}