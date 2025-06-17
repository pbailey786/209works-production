'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  company: string;
  isAuthenticated: boolean;
}

export default function JobApplicationModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  company,
  isAuthenticated,
}: JobApplicationModalProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [externalUrl, setExternalUrl] = useState<string | null>(null);

  // Check if user has already applied
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      checkApplicationStatus();
    }
  }, [isOpen, isAuthenticated, jobId]);

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch(`/api/jobs/apply?jobId=${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setHasApplied(data.hasApplied);
      }
    } catch (error) {
      console.error('Failed to check application status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      window.location.href = '/signin';
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          coverLetter: coverLetter.trim() || undefined,
          additionalInfo: additionalInfo.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setApplicationStatus('success');
        setHasApplied(true);
        setExternalUrl(data.externalUrl);
        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose();
          setApplicationStatus('idle');
        }, 3000);
      } else {
        setApplicationStatus('error');
        setErrorMessage(data.error || 'Failed to submit application');
      }
    } catch (error) {
      setApplicationStatus('error');
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form after a delay to avoid visual glitch
    setTimeout(() => {
      setCoverLetter('');
      setAdditionalInfo('');
      setApplicationStatus('idle');
      setErrorMessage('');
      setExternalUrl(null);
    }, 300);
  };

  if (!isAuthenticated) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mx-4 w-full max-w-md rounded-lg bg-white p-6"
            >
              <div className="text-center">
                <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Sign In Required
                </h3>
                <p className="mb-4 text-gray-600">
                  Please sign in to apply for this job.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => (window.location.href = '/signin')}
                    className="flex-1 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Apply for {jobTitle}
                </h2>
                <p className="text-gray-600">{company}</p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {applicationStatus === 'success' ? (
                <div className="text-center">
                  <CheckCircleIcon className="mx-auto mb-4 h-16 w-16 text-green-500" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Application Submitted!
                  </h3>
                  <p className="mb-4 text-gray-600">
                    Your application has been submitted successfully. The
                    employer will be notified.
                  </p>
                  {externalUrl && (
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <p className="mb-2 text-sm text-blue-800">
                        You may also want to apply directly on the company
                        website:
                      </p>
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center font-medium text-blue-600 hover:text-blue-800"
                      >
                        Apply on Company Website
                        <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              ) : hasApplied ? (
                <div className="text-center">
                  <DocumentTextIcon className="mx-auto mb-4 h-16 w-16 text-blue-500" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Already Applied
                  </h3>
                  <p className="text-gray-600">
                    You have already submitted an application for this position.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Cover Letter */}
                  <div>
                    <label
                      htmlFor="coverLetter"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Cover Letter (Optional)
                    </label>
                    <textarea
                      id="coverLetter"
                      value={coverLetter}
                      onChange={e => setCoverLetter(e.target.value)}
                      placeholder="Tell the employer why you're interested in this position..."
                      className="h-32 w-full resize-none rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Additional Information */}
                  <div>
                    <label
                      htmlFor="additionalInfo"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Additional Information (Optional)
                    </label>
                    <textarea
                      id="additionalInfo"
                      value={additionalInfo}
                      onChange={e => setAdditionalInfo(e.target.value)}
                      placeholder="Any additional information you'd like to share..."
                      className="h-24 w-full resize-none rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Error Message */}
                  {applicationStatus === 'error' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-800">{errorMessage}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex flex-1 items-center justify-center rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="mr-2 h-4 w-4" />
                          Submit Application
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
