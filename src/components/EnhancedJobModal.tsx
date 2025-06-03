'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ClockIcon,
  ShareIcon,
  BookmarkIcon,
  EyeIcon,
  ChevronRightIcon,
  StarIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { EnhancedJobData, generateEnhancedJobData } from '@/lib/mockJobData';
import {
  EnhancedJobModalProps,
  validateJobProps,
  safeFormatSalary,
  safeFormatDate,
  defaultEnhancedJobModalProps,
  createAsyncOperationState,
  handleAsyncError,
  startAsyncOperation,
  completeAsyncOperation,
  withTimeout,
  AsyncOperationState,
} from '@/lib/types/component-props';
import { safeDateFormat } from '@/lib/utils/safe-operations';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorDisplay from '@/components/ui/ErrorDisplay';

type TabType = 'overview' | 'details' | 'company' | 'apply';

export default function EnhancedJobModal({
  isOpen,
  onClose,
  job,
  onSave,
  onApply,
  onShare,
  saved = defaultEnhancedJobModalProps.saved!,
  isAuthenticated = defaultEnhancedJobModalProps.isAuthenticated!,
}: EnhancedJobModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [enhancedJob, setEnhancedJob] = useState<EnhancedJobData | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Enhanced async operation states
  const [jobDataState, setJobDataState] = useState<AsyncOperationState>(
    createAsyncOperationState()
  );
  const [saveState, setSaveState] = useState<AsyncOperationState>(
    createAsyncOperationState()
  );
  const [shareState, setShareState] = useState<AsyncOperationState>(
    createAsyncOperationState()
  );
  const [applyState, setApplyState] = useState<AsyncOperationState>(
    createAsyncOperationState()
  );

  // Generate enhanced job data when modal opens with validation
  useEffect(() => {
    if (isOpen && job) {
      const generateJobData = async () => {
        setJobDataState(
          startAsyncOperation(jobDataState, 'Loading job details...')
        );

        try {
          // Simulate async operation with timeout protection
          await withTimeout(
            new Promise((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                try {
                  const validatedJob = validateJobProps(job);
                  const enhanced = generateEnhancedJobData(validatedJob);
                  setEnhancedJob(enhanced);
                  resolve(enhanced);
                } catch (error) {
                  reject(error);
                }
              }, 500); // Simulate API delay

              // Return cleanup function
              return () => clearTimeout(timeoutId);
            }),
            10000, // 10 second timeout
            'Job data loading timed out'
          );

          setJobDataState(completeAsyncOperation(jobDataState));
        } catch (error) {
          console.error('Job data generation failed:', error);
          setJobDataState(handleAsyncError(error as Error, jobDataState));
          setEnhancedJob(null);
        }
      };

      generateJobData();
    }
  }, [isOpen, job]);

  // Close modal on Escape key and manage focus
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      // Trap focus within modal
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      // Focus the modal after it's rendered
      const focusTimeoutId = setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      }, 100);

      // Store timeout for cleanup
      return () => {
        clearTimeout(focusTimeoutId);
      };
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle save job with enhanced error handling
  const handleSave = async () => {
    if (!isAuthenticated) {
      setSaveState(
        handleAsyncError(new Error('Please sign in to save jobs'), saveState)
      );
      return;
    }

    setSaveState(startAsyncOperation(saveState, 'Saving job...'));

    try {
      await withTimeout(
        onSave?.() || Promise.resolve(),
        15000, // 15 second timeout
        'Save operation timed out'
      );
      setSaveState(completeAsyncOperation(saveState));
    } catch (error) {
      console.error('Save job failed:', error);
      setSaveState(handleAsyncError(error as Error, saveState));
    }
  };

  // Retry save operation
  const retrySave = async () => {
    if (saveState.canRetry) {
      await handleSave();
    }
  };

  // Handle share with enhanced error handling
  const handleShare = async () => {
    setShareState(startAsyncOperation(shareState, 'Sharing job...'));

    try {
      if (navigator.share) {
        await withTimeout(
          navigator.share({
            title: `${enhancedJob?.title} at ${enhancedJob?.company}`,
            text: `Check out this job opportunity: ${enhancedJob?.title} at ${enhancedJob?.company}`,
            url: window.location.href,
          }),
          10000,
          'Share operation timed out'
        );
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // Don't use alert, show success state instead
      }

      await onShare?.();
      setShareState(completeAsyncOperation(shareState));
    } catch (error) {
      console.error('Error sharing:', error);
      // Handle user cancellation gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        setShareState(completeAsyncOperation(shareState));
      } else {
        setShareState(handleAsyncError(error as Error, shareState));
      }
    }
  };

  // Retry share operation
  const retryShare = async () => {
    if (shareState.canRetry) {
      await handleShare();
    }
  };

  // Handle apply with enhanced error handling
  const handleApply = async () => {
    setApplyState(startAsyncOperation(applyState, 'Opening application...'));

    try {
      // Open the job URL in a new tab
      if (enhancedJob?.url) {
        window.open(enhancedJob.url, '_blank', 'noopener,noreferrer');
      }

      // Call the onApply callback if provided
      await onApply?.();
      setApplyState(completeAsyncOperation(applyState));
    } catch (error) {
      console.error('Apply failed:', error);
      setApplyState(handleAsyncError(error as Error, applyState));
    }
  };

  // Retry apply operation
  const retryApply = async () => {
    if (applyState.canRetry) {
      await handleApply();
    }
  };

  if (!isOpen) return null;

  // Show loading state while job data is being generated
  if (jobDataState.isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8">
          <LoadingSpinner
            size="lg"
            variant="spinner"
            message={jobDataState.loadingMessage || 'Loading job details...'}
            color="primary"
          />
        </div>
      </div>
    );
  }

  // Show error state if job data generation failed
  if (jobDataState.hasError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6">
          <ErrorDisplay
            error={jobDataState.errorMessage || 'Failed to load job data'}
            type="error"
            size="md"
            variant="modal"
            canRetry={jobDataState.canRetry}
            onRetry={() => {
              // Reset state and retry
              setJobDataState(createAsyncOperationState());
              // Trigger useEffect to retry
              setEnhancedJob(null);
            }}
            onDismiss={onClose}
            maxRetries={jobDataState.maxRetries}
            currentAttempt={jobDataState.attemptCount}
          />
        </div>
      </div>
    );
  }

  if (!enhancedJob) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BriefcaseIcon },
    { id: 'details', label: 'Job Details', icon: ClockIcon },
    { id: 'company', label: 'Company', icon: BuildingOfficeIcon },
    { id: 'apply', label: 'Apply', icon: ChevronRightIcon },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        onClick={e => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-modal-title"
        aria-describedby="job-modal-description"
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-4">
                  {enhancedJob.companyInfo.logo && (
                    <img
                      src={enhancedJob.companyInfo.logo}
                      alt={`${enhancedJob.company} logo`}
                      className="h-16 w-16 rounded-lg bg-white p-2"
                    />
                  )}
                  <div>
                    <h1
                      id="job-modal-title"
                      className="mb-1 text-2xl font-bold"
                    >
                      {enhancedJob.title}
                    </h1>
                    <div
                      id="job-modal-description"
                      className="mb-2 flex items-center text-purple-100"
                    >
                      <BuildingOfficeIcon
                        className="mr-2 h-5 w-5"
                        aria-hidden="true"
                      />
                      <span className="text-lg">{enhancedJob.company}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-purple-100">
                      <div className="flex items-center">
                        <MapPinIcon
                          className="mr-1 h-4 w-4"
                          aria-hidden="true"
                        />
                        {enhancedJob.location}
                        {enhancedJob.isRemote && (
                          <span className="ml-2 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
                            Remote
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <BriefcaseIcon
                          className="mr-1 h-4 w-4"
                          aria-hidden="true"
                        />
                        {enhancedJob.type}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon
                          className="mr-1 h-4 w-4"
                          aria-hidden="true"
                        />
                        Posted {safeFormatDate(enhancedJob.postedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center">
                    <EyeIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                    <span
                      aria-label={`${enhancedJob.viewsCount} people have viewed this job`}
                    >
                      {enhancedJob.viewsCount} views
                    </span>
                  </div>
                  <div className="flex items-center">
                    <UserGroupIcon
                      className="mr-1 h-4 w-4"
                      aria-hidden="true"
                    />
                    <span
                      aria-label={`${enhancedJob.applicantsCount} people have applied to this job`}
                    >
                      {enhancedJob.applicantsCount} applicants
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CurrencyDollarIcon
                      className="mr-1 h-4 w-4"
                      aria-hidden="true"
                    />
                    <span
                      aria-label={`Salary range: ${safeFormatSalary(enhancedJob.salaryMin, enhancedJob.salaryMax)}`}
                    >
                      {safeFormatSalary(
                        enhancedJob.salaryMin,
                        enhancedJob.salaryMax
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saveState.isLoading}
                  className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium transition ${
                    saved
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-purple-600 hover:bg-purple-50'
                  } ${saveState.isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                  aria-label={
                    saved
                      ? `Job ${enhancedJob.title} is saved`
                      : `Save job ${enhancedJob.title}`
                  }
                >
                  {saveState.isLoading ? (
                    <LoadingSpinner
                      size="sm"
                      variant="spinner"
                      color="primary"
                      className="mr-2"
                    />
                  ) : saved ? (
                    <BookmarkSolidIcon className="mr-2 h-4 w-4" />
                  ) : (
                    <BookmarkIcon className="mr-2 h-4 w-4" />
                  )}
                  {saveState.isLoading ? 'Saving...' : saved ? 'Saved' : 'Save'}
                </button>

                <button
                  onClick={handleShare}
                  disabled={shareState.isLoading}
                  className={`flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-purple-600 transition hover:bg-purple-50 ${
                    shareState.isLoading ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  aria-label={`Share job ${enhancedJob.title}`}
                >
                  {shareState.isLoading ? (
                    <LoadingSpinner
                      size="sm"
                      variant="spinner"
                      color="primary"
                      className="mr-2"
                    />
                  ) : (
                    <ShareIcon className="mr-2 h-4 w-4" />
                  )}
                  {shareState.isLoading ? 'Sharing...' : 'Share'}
                </button>

                <button
                  onClick={onClose}
                  className="rounded-lg p-2 transition hover:bg-white hover:bg-opacity-20"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 px-6">
            <nav className="flex space-x-8" aria-label="Job details tabs">
              <div role="tablist" className="flex space-x-8">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                        activeTab === tab.id
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                      aria-selected={activeTab === tab.id}
                      aria-controls={`tabpanel-${tab.id}`}
                      id={`tab-${tab.id}`}
                      role="tab"
                      tabIndex={activeTab === tab.id ? 0 : -1}
                      onKeyDown={e => {
                        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                          e.preventDefault();
                          const direction = e.key === 'ArrowRight' ? 1 : -1;
                          const currentIndex = tabs.findIndex(
                            t => t.id === tab.id
                          );
                          const nextIndex =
                            (currentIndex + direction + tabs.length) %
                            tabs.length;
                          setActiveTab(tabs[nextIndex].id as TabType);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                        {tab.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Error States for Actions */}
          {(saveState.hasError ||
            shareState.hasError ||
            applyState.hasError) && (
            <div className="space-y-3 px-6 pt-4">
              {saveState.hasError && (
                <ErrorDisplay
                  error={saveState.errorMessage || 'Failed to save job'}
                  type="error"
                  size="sm"
                  variant="inline"
                  canRetry={saveState.canRetry}
                  onRetry={retrySave}
                  onDismiss={() => setSaveState(createAsyncOperationState())}
                  maxRetries={saveState.maxRetries}
                  currentAttempt={saveState.attemptCount}
                />
              )}

              {shareState.hasError && (
                <ErrorDisplay
                  error={shareState.errorMessage || 'Failed to share job'}
                  type="error"
                  size="sm"
                  variant="inline"
                  canRetry={shareState.canRetry}
                  onRetry={retryShare}
                  onDismiss={() => setShareState(createAsyncOperationState())}
                  maxRetries={shareState.maxRetries}
                  currentAttempt={shareState.attemptCount}
                />
              )}

              {applyState.hasError && (
                <ErrorDisplay
                  error={applyState.errorMessage || 'Failed to apply to job'}
                  type="error"
                  size="sm"
                  variant="inline"
                  canRetry={applyState.canRetry}
                  onRetry={retryApply}
                  onDismiss={() => setApplyState(createAsyncOperationState())}
                  maxRetries={applyState.maxRetries}
                  currentAttempt={applyState.attemptCount}
                />
              )}
            </div>
          )}

          {/* Tab Content */}
          <div className="max-h-[60vh] overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                tabIndex={0}
              >
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Job Description */}
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-gray-900">
                        Job Description
                      </h3>
                      <div className="prose prose-gray max-w-none text-gray-700">
                        <p>{enhancedJob.description}</p>
                      </div>
                    </div>

                    {/* Key Details */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <h4 className="mb-3 font-medium text-gray-900">
                          Job Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Experience Level:
                            </span>
                            <span className="font-medium">
                              {enhancedJob.experienceLevel}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Job Type:</span>
                            <span className="font-medium">
                              {enhancedJob.type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Location:</span>
                            <span className="font-medium">
                              {enhancedJob.location}
                            </span>
                          </div>
                          {enhancedJob.applicationDeadline && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Application Deadline:
                              </span>
                              <span className="font-medium text-red-600">
                                {safeDateFormat(
                                  enhancedJob.applicationDeadline,
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  }
                                ) || 'Not specified'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-3 font-medium text-gray-900">
                          Skills Required
                        </h4>
                        <div className="space-y-2">
                          {enhancedJob.skills.map((skill, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm text-gray-700">
                                {skill.name}
                              </span>
                              <span
                                className={`rounded-full px-2 py-1 text-xs ${
                                  skill.importance === 'required'
                                    ? 'bg-red-100 text-red-700'
                                    : skill.importance === 'preferred'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {skill.importance}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Benefits Preview */}
                    <div>
                      <h4 className="mb-3 font-medium text-gray-900">
                        Benefits Highlights
                      </h4>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {enhancedJob.benefits
                          .slice(0, 4)
                          .map((benefit, index) => (
                            <div
                              key={index}
                              className="flex items-center text-sm text-gray-700"
                            >
                              <div className="mr-3 h-2 w-2 rounded-full bg-purple-500"></div>
                              {benefit}
                            </div>
                          ))}
                      </div>
                      {enhancedJob.benefits.length > 4 && (
                        <button
                          onClick={() => setActiveTab('details')}
                          className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700"
                        >
                          View all {enhancedJob.benefits.length} benefits →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Responsibilities */}
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-gray-900">
                        Key Responsibilities
                      </h3>
                      <ul className="space-y-2">
                        {enhancedJob.responsibilities.map(
                          (responsibility, index) => (
                            <li
                              key={index}
                              className="flex items-start text-gray-700"
                            >
                              <div className="mr-3 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></div>
                              {responsibility}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    {/* Requirements */}
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-gray-900">
                        Requirements
                      </h3>
                      <ul className="space-y-2">
                        {enhancedJob.requirements.map((requirement, index) => (
                          <li
                            key={index}
                            className="flex items-start text-gray-700"
                          >
                            <div className="mr-3 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                            {requirement}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* All Benefits */}
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-gray-900">
                        Benefits & Perks
                      </h3>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {enhancedJob.benefits.map((benefit, index) => (
                          <div
                            key={index}
                            className="flex items-center rounded-lg bg-gray-50 p-3 text-gray-700"
                          >
                            <div className="mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Skills Breakdown */}
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-gray-900">
                        Skills & Technologies
                      </h3>
                      <div className="space-y-4">
                        {['required', 'preferred', 'nice-to-have'].map(
                          importance => {
                            const skillsOfType = enhancedJob.skills.filter(
                              s => s.importance === importance
                            );
                            if (skillsOfType.length === 0) return null;

                            return (
                              <div key={importance}>
                                <h4
                                  className={`mb-2 font-medium capitalize ${
                                    importance === 'required'
                                      ? 'text-red-700'
                                      : importance === 'preferred'
                                        ? 'text-yellow-700'
                                        : 'text-green-700'
                                  }`}
                                >
                                  {importance} Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {skillsOfType.map((skill, index) => (
                                    <span
                                      key={index}
                                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                                        importance === 'required'
                                          ? 'bg-red-100 text-red-700'
                                          : importance === 'preferred'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-green-100 text-green-700'
                                      }`}
                                    >
                                      {skill.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'company' && (
                  <div className="space-y-6">
                    {/* Company Overview */}
                    <div className="flex items-start gap-4">
                      {enhancedJob.companyInfo.logo && (
                        <img
                          src={enhancedJob.companyInfo.logo}
                          alt={`${enhancedJob.company} logo`}
                          className="h-20 w-20 rounded-lg border-2 border-gray-200"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-semibold text-gray-900">
                          {enhancedJob.company}
                        </h3>
                        <p className="mb-3 text-gray-700">
                          {enhancedJob.companyInfo.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Industry:</span>
                            <span className="ml-2 font-medium">
                              {enhancedJob.companyInfo.industry}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Company Size:</span>
                            <span className="ml-2 font-medium">
                              {enhancedJob.companyInfo.size}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Founded:</span>
                            <span className="ml-2 font-medium">
                              {enhancedJob.companyInfo.founded}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Website:</span>
                            <a
                              href={enhancedJob.companyInfo.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 flex items-center font-medium text-purple-600 hover:text-purple-700"
                            >
                              <GlobeAltIcon className="mr-1 h-4 w-4" />
                              Visit Website
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Employee Testimonials */}
                    {enhancedJob.employeeTestimonials &&
                      enhancedJob.employeeTestimonials.length > 0 && (
                        <div>
                          <h4 className="mb-4 text-lg font-semibold text-gray-900">
                            What Employees Say
                          </h4>
                          <div className="space-y-4">
                            {enhancedJob.employeeTestimonials.map(
                              (testimonial, index) => (
                                <div
                                  key={index}
                                  className="rounded-lg bg-gray-50 p-4"
                                >
                                  <div className="mb-2 flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <StarIcon
                                        key={i}
                                        className="h-4 w-4 fill-current text-yellow-400"
                                      />
                                    ))}
                                  </div>
                                  <p className="mb-2 italic text-gray-700">
                                    "{testimonial.text}"
                                  </p>
                                  <div className="text-sm text-gray-500">
                                    — {testimonial.author}, {testimonial.role}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Company Culture/Values placeholder */}
                    <div>
                      <h4 className="mb-3 text-lg font-semibold text-gray-900">
                        Company Values
                      </h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {['Innovation', 'Collaboration', 'Growth'].map(
                          (value, index) => (
                            <div
                              key={index}
                              className="rounded-lg bg-purple-50 p-4 text-center"
                            >
                              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-600">
                                <StarIcon className="h-6 w-6 text-white" />
                              </div>
                              <h5 className="font-medium text-gray-900">
                                {value}
                              </h5>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'apply' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="mb-2 text-xl font-semibold text-gray-900">
                        Ready to Apply?
                      </h3>
                      <p className="mb-6 text-gray-600">
                        This will take you to the original job posting to
                        complete your application.
                      </p>

                      {/* Application Summary */}
                      <div className="mb-6 rounded-lg bg-gray-50 p-6">
                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                          <div>
                            <span className="text-gray-500">Position:</span>
                            <span className="ml-2 font-medium">
                              {enhancedJob.title}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Company:</span>
                            <span className="ml-2 font-medium">
                              {enhancedJob.company}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Location:</span>
                            <span className="ml-2 font-medium">
                              {enhancedJob.location}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Salary:</span>
                            <span className="ml-2 font-medium">
                              {safeFormatSalary(
                                enhancedJob.salaryMin,
                                enhancedJob.salaryMax
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Application Deadline Warning */}
                      {enhancedJob.applicationDeadline && (
                        <div className="mb-6 flex items-center justify-center rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                          <ExclamationTriangleIcon className="mr-2 h-5 w-5 text-yellow-600" />
                          <span className="text-sm text-yellow-800">
                            Application deadline:{' '}
                            {safeDateFormat(enhancedJob.applicationDeadline, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }) || 'Not specified'}
                          </span>
                        </div>
                      )}

                      {/* Apply Button */}
                      <button
                        onClick={handleApply}
                        disabled={applyState.isLoading}
                        className={`inline-flex transform items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl ${
                          applyState.isLoading
                            ? 'transform-none cursor-not-allowed opacity-50'
                            : ''
                        }`}
                      >
                        {applyState.isLoading ? (
                          <>
                            <LoadingSpinner
                              size="sm"
                              variant="spinner"
                              color="white"
                              className="mr-2"
                            />
                            Applying...
                          </>
                        ) : (
                          <>
                            Apply Now
                            <ChevronRightIcon className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </button>

                      <p className="mt-3 text-xs text-gray-500">
                        You'll be redirected to the employer's application page
                      </p>
                    </div>

                    {/* Tips for applying */}
                    <div className="border-t pt-6">
                      <h4 className="mb-3 font-medium text-gray-900">
                        Tips for Your Application
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start">
                          <div className="mr-3 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></div>
                          Customize your resume to highlight relevant skills and
                          experience
                        </li>
                        <li className="flex items-start">
                          <div className="mr-3 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></div>
                          Write a compelling cover letter that shows your
                          interest in the role
                        </li>
                        <li className="flex items-start">
                          <div className="mr-3 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></div>
                          Research the company and mention specific reasons you
                          want to work there
                        </li>
                        <li className="flex items-start">
                          <div className="mr-3 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></div>
                          Follow up appropriately after submitting your
                          application
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Related Jobs Section (at bottom of modal) */}
          <div className="border-t bg-gray-50 p-6">
            <h4 className="mb-3 font-medium text-gray-900">
              You Might Also Like
            </h4>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Placeholder for related jobs - would be populated with actual related job data */}
              {[1, 2].map((_, index) => (
                <div
                  key={index}
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-purple-300"
                >
                  <h5 className="mb-1 text-sm font-medium text-gray-900">
                    Similar Position {index + 1}
                  </h5>
                  <p className="mb-1 text-xs text-gray-600">Company Name</p>
                  <p className="text-xs text-gray-500">Location • Job Type</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
