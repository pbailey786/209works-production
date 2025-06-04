'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
  MegaphoneIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import JobCard from '@/components/JobCard';
import JobGenie from '@/components/JobGenie';
import ShouldIApplyCalculator from '@/components/ShouldIApplyCalculator';
import JobApplicationModal from '@/components/JobApplicationModal';
import {
  formatJobDescription,
  extractJobHighlights,
} from '@/lib/utils/jobDescriptionFormatter';

interface JobDetailClientProps {
  job: Job;
  relatedJobs: Job[];
  isAuthenticated: boolean;
  isSaved: boolean;
  userId?: string;
}

// Memoized helper function to format job type
const formatJobType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Memoized helper function to format date
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

export default function JobDetailClient({
  job,
  relatedJobs,
  isAuthenticated,
  isSaved,
  userId,
}: JobDetailClientProps) {
  const [saved, setSaved] = useState(isSaved);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldIApplyOpen, setShouldIApplyOpen] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);

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

  // Memoized formatted date
  const formattedDate = useMemo(() => formatDate(job.postedAt), [job.postedAt]);

  // Memoized formatted job type
  const formattedJobType = useMemo(
    () => formatJobType(job.jobType),
    [job.jobType]
  );

  // Clear error after timeout
  const clearError = useCallback(() => {
    if (error) {
      setTimeout(() => setError(null), 5000);
    }
  }, [error]);

  // Handle save/unsave job with improved error handling
  const handleSaveJob = useCallback(async () => {
    if (!isAuthenticated) {
      window.location.href = '/signin';
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          jobId: job.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save job');
      }

      const data = await response.json();
      setSaved(!saved); // Toggle the saved state
    } catch (error) {
      console.error('Error saving job:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to save job. Please try again.'
      );
      clearError();
    } finally {
      setSaving(false);
    }
  }, [isAuthenticated, job.id, clearError]);

  // Handle share job with improved error handling
  const handleShare = useCallback(async () => {
    setSharing(true);
    setError(null);

    const shareData = {
      title: `${job.title} at ${job.company}`,
      text: `Check out this job opportunity: ${job.title} at ${job.company}`,
      url: window.location.href,
    };

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        // Use a more accessible notification instead of alert
        setError('Job link copied to clipboard!');
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error('Sharing not supported on this device');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if (error instanceof Error && error.name !== 'AbortError') {
        setError('Failed to share job. Please try copying the URL manually.');
        clearError();
      }
    } finally {
      setSharing(false);
    }
  }, [job.title, job.company, clearError]);

  // Handle report job with improved error handling
  const handleReportJob = useCallback(async () => {
    if (!reportReason.trim()) return;

    setError(null);

    try {
      const response = await fetch('/api/jobs/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          jobId: job.id,
          reason: reportReason.trim(),
          reporterUserId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit report');
      }

      setReportSubmitted(true);
      setTimeout(() => {
        setReportModalOpen(false);
        setReportSubmitted(false);
        setReportReason('');
      }, 2000);
    } catch (error) {
      console.error('Error reporting job:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to submit report. Please try again.'
      );
      clearError();
    }
  }, [reportReason, job.id, userId, clearError]);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setReportModalOpen(false);
    setReportReason('');
    setReportSubmitted(false);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Notification */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed right-4 top-4 z-50 max-w-sm rounded-lg p-4 shadow-lg ${
            error.includes('copied') || error.includes('success')
              ? 'border-green-200 bg-green-100 text-green-800'
              : 'border-red-200 bg-red-100 text-red-800'
          } border`}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-3 text-gray-400 hover:text-gray-600"
              aria-label="Close notification"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="border-b bg-white" aria-label="Breadcrumb">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link
                href="/"
                className="rounded hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon className="h-4 w-4" />
            </li>
            <li>
              <Link
                href="/jobs"
                className="rounded hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Jobs
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon className="h-4 w-4" />
            </li>
            <li aria-current="page">
              <span className="truncate text-gray-900">{job.title}</span>
            </li>
          </ol>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              {/* Job Header */}
              <header className="border-b border-gray-200 p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                      {job.title}
                    </h1>
                    <div className="mb-4 flex items-center text-lg text-gray-700">
                      <BuildingOfficeIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      <span>{job.company}</span>
                    </div>

                    {/* Job Meta Info */}
                    <dl className="grid grid-cols-1 gap-4 text-sm text-gray-600 sm:grid-cols-2">
                      <div className="flex items-center">
                        <MapPinIcon
                          className="mr-2 h-4 w-4 text-gray-400"
                          aria-hidden="true"
                        />
                        <dt className="sr-only">Location:</dt>
                        <dd>{job.location}</dd>
                      </div>
                      <div className="flex items-center">
                        <BriefcaseIcon
                          className="mr-2 h-4 w-4 text-gray-400"
                          aria-hidden="true"
                        />
                        <dt className="sr-only">Job Type:</dt>
                        <dd>{formattedJobType}</dd>
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon
                          className="mr-2 h-4 w-4 text-gray-400"
                          aria-hidden="true"
                        />
                        <dt className="sr-only">Salary:</dt>
                        <dd>{salaryDisplay}</dd>
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon
                          className="mr-2 h-4 w-4 text-gray-400"
                          aria-hidden="true"
                        />
                        <dt className="sr-only">Posted:</dt>
                        <dd>Posted {formattedDate}</dd>
                      </div>
                    </dl>

                    {/* Categories */}
                    {job.categories.length > 0 && (
                      <div className="mt-4">
                        <h3 className="sr-only">Job Categories</h3>
                        <div className="flex flex-wrap gap-2">
                          {job.categories.map((category, index) => (
                            <span
                              key={index}
                              className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upsell Badges */}
                    {(job.socialMediaShoutout ||
                      job.placementBump ||
                      job.upsellBundle) && (
                      <div className="mt-4">
                        <h3 className="sr-only">Promotion Features</h3>
                        <div className="flex flex-wrap gap-2">
                          {(job.socialMediaShoutout || job.upsellBundle) && (
                            <span className="inline-flex items-center rounded-full border border-pink-200 bg-gradient-to-r from-pink-100 to-purple-100 px-3 py-1 text-xs font-medium text-pink-700">
                              <MegaphoneIcon className="mr-1 h-3 w-3" />
                              Social Media Promoted
                            </span>
                          )}
                          {(job.placementBump || job.upsellBundle) && (
                            <span className="inline-flex items-center rounded-full border border-blue-200 bg-gradient-to-r from-blue-100 to-green-100 px-3 py-1 text-xs font-medium text-blue-700">
                              <ArrowTrendingUpIcon className="mr-1 h-3 w-3" />
                              Priority Placement
                            </span>
                          )}
                          {job.upsellBundle && (
                            <span className="inline-flex items-center rounded-full border border-orange-200 bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                              <SparklesIcon className="mr-1 h-3 w-3" />
                              Premium Promotion
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div
                    className="flex flex-col gap-3 sm:ml-6 sm:flex-row"
                    role="group"
                    aria-label="Job actions"
                  >
                    {/* Should I Apply Button - Most prominent */}
                    <button
                      onClick={() => setShouldIApplyOpen(true)}
                      className="flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      aria-label="Get AI analysis on whether you should apply for this job"
                    >
                      <SparklesIcon
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                      />
                      Should I Apply?
                    </button>

                    <button
                      onClick={handleSaveJob}
                      disabled={saving}
                      className={`flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        saved
                          ? 'border border-green-200 bg-green-100 text-green-700 focus:ring-green-500'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-purple-500'
                      } ${saving ? 'cursor-not-allowed opacity-50' : ''}`}
                      aria-pressed={saved}
                      aria-label={
                        saved
                          ? 'Remove job from saved jobs'
                          : 'Save job for later'
                      }
                    >
                      {saved ? (
                        <BookmarkSolidIcon
                          className="mr-2 h-4 w-4"
                          aria-hidden="true"
                        />
                      ) : (
                        <BookmarkIcon
                          className="mr-2 h-4 w-4"
                          aria-hidden="true"
                        />
                      )}
                      {saving ? 'Saving...' : saved ? 'Saved' : 'Save Job'}
                    </button>

                    <button
                      onClick={handleShare}
                      disabled={sharing}
                      className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Share this job posting"
                    >
                      <ShareIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                      {sharing ? 'Sharing...' : 'Share'}
                    </button>

                    {/* Social Share Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Twitter/X Share */}
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this ${job.title} position at ${job.company} in ${job.location}`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&hashtags=209jobs,hiring,${job.location.replace(/\s+/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        aria-label="Share on X (Twitter)"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>

                      {/* LinkedIn Share */}
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label="Share on LinkedIn"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    </div>

                    <button
                      onClick={() => setReportModalOpen(true)}
                      className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      aria-label="Report this job posting"
                    >
                      <ExclamationTriangleIcon
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                      />
                      Report
                    </button>
                  </div>
                </div>
              </header>

              {/* Job Description */}
              <section className="p-6 sm:p-8">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Job Description
                </h2>
                <div
                  className="max-w-none leading-relaxed text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: formatJobDescription(job.description),
                  }}
                />
              </section>

              {/* Apply Section */}
              <section className="border-t border-gray-200 bg-gray-50 p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-gray-900">
                      Ready to apply?
                    </h3>
                    <p className="text-sm text-gray-600">
                      Submit your application through 209Jobs
                      {job.url && job.source && (
                        <span> or apply directly on {job.source}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <button
                      onClick={() => setApplicationModalOpen(true)}
                      className="inline-flex flex-1 transform items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-emerald-600 hover:to-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:flex-none"
                    >
                      <PaperAirplaneIcon className="mr-3 h-5 w-5" />
                      Apply Now
                    </button>
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 transform items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-6 py-4 font-semibold text-gray-700 shadow-md transition-all duration-200 hover:scale-105 hover:border-gray-300 hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:flex-none"
                      >
                        <svg
                          className="mr-2 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        Apply on Company Site
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    )}
                  </div>
                </div>
              </section>
            </motion.article>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* Related Jobs */}
            {relatedJobs.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Related Jobs
                </h3>
                <ul className="space-y-4">
                  {relatedJobs.map(relatedJob => (
                    <li key={relatedJob.id}>
                      <Link
                        href={`/jobs/${relatedJob.id}`}
                        className="block rounded-lg p-3 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <h4 className="mb-1 text-sm font-medium text-gray-900">
                          {relatedJob.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {relatedJob.company}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {relatedJob.location} •{' '}
                          {formatJobType(relatedJob.jobType)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/jobs"
                  className="mt-4 inline-block rounded text-sm font-medium text-purple-700 hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  View all jobs →
                </Link>
              </motion.section>
            )}
          </aside>
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
        >
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            {reportSubmitted ? (
              <div className="text-center">
                <CheckIcon
                  className="mx-auto mb-4 h-12 w-12 text-green-500"
                  aria-hidden="true"
                />
                <h3
                  id="report-modal-title"
                  className="mb-2 text-lg font-medium text-gray-900"
                >
                  Report Submitted
                </h3>
                <p className="text-gray-600">
                  Thank you for your feedback. We'll review this job posting.
                </p>
              </div>
            ) : (
              <>
                <h3
                  id="report-modal-title"
                  className="mb-4 text-lg font-medium text-gray-900"
                >
                  Report Job Posting
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  Please let us know why you're reporting this job posting.
                </p>
                <div className="mb-4">
                  <label htmlFor="report-reason" className="sr-only">
                    Reason for reporting
                  </label>
                  <textarea
                    id="report-reason"
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    placeholder="Describe the issue..."
                    className="h-24 w-full resize-none rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                    aria-describedby="report-reason-help"
                  />
                  <p
                    id="report-reason-help"
                    className="mt-1 text-xs text-gray-500"
                  >
                    Please provide at least 10 characters
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReportJob}
                    disabled={
                      !reportReason.trim() || reportReason.trim().length < 10
                    }
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit Report
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* JobGenie Chatbot */}
      <JobGenie jobId={job.id} jobTitle={job.title} company={job.company} />

      {/* Should I Apply Calculator */}
      <ShouldIApplyCalculator
        isOpen={shouldIApplyOpen}
        onClose={() => setShouldIApplyOpen(false)}
        jobId={job.id}
        jobTitle={job.title}
        company={job.company}
        isAuthenticated={isAuthenticated}
        userId={userId}
      />

      {/* Job Application Modal */}
      <JobApplicationModal
        isOpen={applicationModalOpen}
        onClose={() => setApplicationModalOpen(false)}
        jobId={job.id}
        jobTitle={job.title}
        company={job.company}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
