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
  userRole?: string;
  isJobOwner?: boolean;
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
    <div className="min-h-screen bg-gradient-to-br from-[#9fdf9f]/5 via-white to-[#ff6b35]/5">
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
                className="rounded hover:text-[#2d4a3e] focus:outline-none focus:ring-2 focus:ring-[#2d4a3e]"
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
                className="rounded hover:text-[#2d4a3e] focus:outline-none focus:ring-2 focus:ring-[#2d4a3e]"
              >
                Jobs
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon className="h-4 w-4" />
            </li>
            <li aria-current="page">
              <span className="truncate font-medium text-[#2d4a3e]">{job.title}</span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#2d4a3e] via-[#1d3a2e] to-[#2d4a3e] text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#9fdf9f]/20">
              <BriefcaseIcon className="h-8 w-8 text-[#9fdf9f]" />
            </div>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              {job.title}
            </h1>
            <div className="mb-6 flex items-center justify-center text-xl text-[#9fdf9f]/90">
              <BuildingOfficeIcon className="mr-2 h-6 w-6" />
              <span>{job.company}</span>
            </div>

            {/* Key Job Info */}
            <div className="mx-auto max-w-4xl">
              <div className="grid grid-cols-1 gap-4 text-[#9fdf9f]/80 md:grid-cols-3">
                <div className="flex items-center justify-center">
                  <MapPinIcon className="mr-2 h-5 w-5" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center justify-center">
                  <BriefcaseIcon className="mr-2 h-5 w-5" />
                  <span>{formattedJobType}</span>
                </div>
                <div className="flex items-center justify-center">
                  <CurrencyDollarIcon className="mr-2 h-5 w-5" />
                  <span>{salaryDisplay}</span>
                </div>
              </div>
            </div>

            {/* Posted Date */}
            <div className="mt-6 flex items-center justify-center text-sm text-[#9fdf9f]/70">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>Posted {formattedDate}</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
            >
              {/* Quick Actions Bar */}
              <div className="border-b border-gray-200 bg-gray-50 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-3">
                    {/* Edit Button for Job Owner */}
                    {isJobOwner && (
                      <Link
                        href={`/employers/job/${job.id}/edit`}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Job
                      </Link>
                    )}

                    {/* Should I Apply Button - Most prominent for job seekers */}
                    {!isJobOwner && (
                      <button
                        onClick={() => setShouldIApplyOpen(true)}
                        className="inline-flex items-center rounded-lg bg-[#2d4a3e] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#1d3a2e] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2d4a3e] focus:ring-offset-2"
                      >
                        <SparklesIcon className="mr-2 h-4 w-4" />
                        Should I Apply?
                      </button>
                    )}

                    <button
                      onClick={handleSaveJob}
                      disabled={saving}
                      className={`inline-flex items-center rounded-lg px-4 py-3 text-sm font-medium shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        saved
                          ? 'border border-green-200 bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-lg focus:ring-[#2d4a3e]'
                      } ${saving ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {saved ? (
                        <BookmarkSolidIcon className="mr-2 h-4 w-4" />
                      ) : (
                        <BookmarkIcon className="mr-2 h-4 w-4" />
                      )}
                      {saving ? 'Saving...' : saved ? 'Saved' : 'Save Job'}
                    </button>

                    <button
                      onClick={handleShare}
                      disabled={sharing}
                      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2d4a3e] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShareIcon className="mr-2 h-4 w-4" />
                      {sharing ? 'Sharing...' : 'Share'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Social Share Buttons */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this ${job.title} position at ${job.company} in ${job.location}`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&hashtags=209jobs,hiring,${job.location.replace(/\s+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white transition-colors hover:bg-gray-800"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>

                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>

                    <button
                      onClick={() => setReportModalOpen(true)}
                      className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                    >
                      <ExclamationTriangleIcon className="mr-1 h-4 w-4" />
                      Report
                    </button>
                  </div>
                </div>
              </div>

              {/* Job Details Section */}
              <div className="p-8">
                {/* Categories */}
                {job.categories.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.categories.map((category, index) => (
                        <span
                          key={index}
                          className="inline-block rounded-full bg-[#2d4a3e]/10 px-4 py-2 text-sm font-medium text-[#2d4a3e]"
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
                  <div className="mb-6">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">Promotion Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {(job.socialMediaShoutout || job.upsellBundle) && (
                        <span className="inline-flex items-center rounded-full border border-pink-200 bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 text-sm font-medium text-pink-700">
                          <MegaphoneIcon className="mr-2 h-4 w-4" />
                          Social Media Promoted
                        </span>
                      )}
                      {(job.placementBump || job.upsellBundle) && (
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-gradient-to-r from-blue-100 to-green-100 px-4 py-2 text-sm font-medium text-blue-700">
                          <ArrowTrendingUpIcon className="mr-2 h-4 w-4" />
                          Priority Placement
                        </span>
                      )}
                      {job.upsellBundle && (
                        <span className="inline-flex items-center rounded-full border border-orange-200 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
                          <SparklesIcon className="mr-2 h-4 w-4" />
                          Premium Promotion
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Job Description */}
              <div className="border-t border-gray-200">
                <div className="p-8">
                  <h2 className="mb-6 text-2xl font-bold text-gray-900">
                    Job Description
                  </h2>
                  <div
                    className="prose prose-lg max-w-none leading-relaxed text-gray-700 prose-headings:text-gray-900 prose-a:text-[#2d4a3e] prose-strong:text-gray-900"
                    dangerouslySetInnerHTML={{
                      __html: formatJobDescription(job.description),
                    }}
                  />
                </div>
              </div>

              {/* Apply Section or Job Management for Owners */}
              <div className="border-t border-gray-200 bg-gradient-to-r from-[#2d4a3e]/5 to-[#1d3a2e]/5">
                <div className="p-8">
                  {isJobOwner ? (
                    /* Job Management Section for Employers */
                    <div className="text-center">
                      <h3 className="mb-4 text-2xl font-bold text-gray-900">
                        Manage Your Job Posting
                      </h3>
                      <p className="mb-8 text-lg text-gray-600">
                        Track applications, edit details, and manage your job posting
                      </p>

                      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <Link
                          href={`/employers/job/${job.id}`}
                          className="inline-flex transform items-center justify-center rounded-2xl bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] px-10 py-5 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:from-[#1d3a2e] hover:to-[#0d2a1e] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#2d4a3e]/50 focus:ring-offset-2"
                        >
                          <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          View Dashboard
                        </Link>

                        <Link
                          href={`/employers/job/${job.id}/edit`}
                          className="inline-flex transform items-center justify-center rounded-2xl border-2 border-[#2d4a3e] bg-white px-8 py-5 text-lg font-bold text-[#2d4a3e] shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#2d4a3e] hover:text-white hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#2d4a3e]/50 focus:ring-offset-2"
                        >
                          <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Job
                        </Link>
                      </div>

                      <p className="mt-6 text-sm text-gray-500">
                        💼 Manage applications, track performance, and optimize your job posting
                      </p>
                    </div>
                  ) : (
                    /* Apply Section for Job Seekers */
                    <div className="text-center">
                      <h3 className="mb-4 text-2xl font-bold text-gray-900">
                        Ready to Take the Next Step?
                      </h3>
                      <p className="mb-8 text-lg text-gray-600">
                        Submit your application through 209 Works and get noticed by {job.company}
                        {job.url && job.source && (
                          <span className="block mt-2 text-sm">or apply directly on their company website</span>
                        )}
                      </p>

                      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <button
                          onClick={() => setApplicationModalOpen(true)}
                          className="inline-flex transform items-center justify-center rounded-2xl bg-gradient-to-r from-[#2d4a3e] to-[#1d3a2e] px-10 py-5 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:from-[#1d3a2e] hover:to-[#0d2a1e] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#2d4a3e]/50 focus:ring-offset-2"
                        >
                          <PaperAirplaneIcon className="mr-3 h-6 w-6" />
                          Apply Now on 209 Works
                        </button>

                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex transform items-center justify-center rounded-2xl border-2 border-[#2d4a3e] bg-white px-8 py-5 text-lg font-bold text-[#2d4a3e] shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#2d4a3e] hover:text-white hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#2d4a3e]/50 focus:ring-offset-2"
                          >
                            <svg
                              className="mr-3 h-5 w-5"
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

                      <p className="mt-6 text-sm text-gray-500">
                        💡 Tip: Applying through 209 Works helps you track your application status and get personalized job recommendations
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.article>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Job Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
              >
                <h3 className="mb-4 text-lg font-bold text-gray-900">Job Summary</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="mt-1 flex items-center text-sm text-gray-900">
                      <MapPinIcon className="mr-2 h-4 w-4 text-[#2d4a3e]" />
                      {job.location}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Job Type</dt>
                    <dd className="mt-1 flex items-center text-sm text-gray-900">
                      <BriefcaseIcon className="mr-2 h-4 w-4 text-[#2d4a3e]" />
                      {formattedJobType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Salary</dt>
                    <dd className="mt-1 flex items-center text-sm text-gray-900">
                      <CurrencyDollarIcon className="mr-2 h-4 w-4 text-[#2d4a3e]" />
                      {salaryDisplay}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Posted</dt>
                    <dd className="mt-1 flex items-center text-sm text-gray-900">
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#2d4a3e]" />
                      {formattedDate}
                    </dd>
                  </div>
                </dl>
              </motion.div>

              {/* Related Jobs */}
              {relatedJobs.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
                >
                  <h3 className="mb-4 text-lg font-bold text-gray-900">
                    Similar Jobs
                  </h3>
                  <ul className="space-y-4">
                    {relatedJobs.map(relatedJob => (
                      <li key={relatedJob.id}>
                        <Link
                          href={`/jobs/${relatedJob.id}`}
                          className="block rounded-xl border border-gray-100 p-4 transition-all hover:border-[#2d4a3e]/20 hover:bg-[#2d4a3e]/5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2d4a3e]"
                        >
                          <h4 className="mb-2 font-semibold text-gray-900">
                            {relatedJob.title}
                          </h4>
                          <p className="mb-2 text-sm text-gray-600">
                            {relatedJob.company}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{relatedJob.location}</span>
                            <span>{formatJobType(relatedJob.jobType)}</span>
                          </div>
                          {(relatedJob.salaryMin || relatedJob.salaryMax) && (
                            <p className="mt-2 text-sm font-medium text-[#2d4a3e]">
                              {relatedJob.salaryMin && relatedJob.salaryMax
                                ? `$${relatedJob.salaryMin.toLocaleString()} - $${relatedJob.salaryMax.toLocaleString()}`
                                : relatedJob.salaryMin
                                ? `From $${relatedJob.salaryMin.toLocaleString()}`
                                : `Up to $${relatedJob.salaryMax?.toLocaleString()}`}
                            </p>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/jobs"
                    className="mt-6 inline-flex items-center rounded-lg bg-[#2d4a3e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1d3a2e] focus:outline-none focus:ring-2 focus:ring-[#2d4a3e] focus:ring-offset-2"
                  >
                    View All Jobs
                    <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </motion.section>
              )}
            </div>
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
