/**
 * Job Results Panel Component
 * 
 * Separates job results from chat conversation for better UX
 * Shows persistent job results while maintaining chat context
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import JobCard from '@/components/chat/JobCard';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  postedDate: string;
  description: string;
  requirements: string[];
  benefits: string[];
  remote: boolean;
  urgent: boolean;
}

interface JobResultsPanelProps {
  jobs: Job[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (jobId: string) => void;
  onViewDetails: (jobId: string) => void;
  onSave: (jobId: string) => void;
  searchQuery?: string;
  isLoggedIn?: boolean;
}

export default function JobResultsPanel({
  jobs,
  isOpen,
  onClose,
  onApply,
  onViewDetails,
  onSave,
  searchQuery,
  isLoggedIn = false
}: JobResultsPanelProps) {
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'salary'>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const handleSaveJob = (jobId: string) => {
    if (!isLoggedIn) {
      // Encourage sign up for job saving
      onSave(jobId);
      return;
    }

    setSavedJobs(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(jobId)) {
        newSaved.delete(jobId);
      } else {
        newSaved.add(jobId);
      }
      return newSaved;
    });
    onSave(jobId);
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      case 'salary':
        const getSalaryValue = (job: Job) => {
          if (!job.salary) return 0;
          const match = job.salary.match(/\$(\d+(?:,\d+)?)/);
          return match ? parseInt(match[1].replace(',', '')) : 0;
        };
        return getSalaryValue(b) - getSalaryValue(a);
      default:
        return 0; // Keep original order for relevance
    }
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Results Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 lg:relative lg:w-96 lg:shadow-none lg:border-l lg:border-gray-200"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {jobs.length} Jobs Found
                  </h3>
                  {searchQuery && (
                    <p className="text-sm text-gray-600 truncate">
                      for "{searchQuery}"
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Sort and Filter Controls */}
              <div className="flex items-center space-x-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="relevance">Best Match</option>
                  <option value="date">Newest First</option>
                  <option value="salary">Highest Pay</option>
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  <span>Filters</span>
                </button>
              </div>

              {/* Quick Filters */}
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 pt-3 border-t border-gray-100"
                >
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <button className="text-left p-2 rounded border border-gray-200 hover:bg-gray-50">
                      <MapPinIcon className="h-4 w-4 inline mr-1" />
                      Near me
                    </button>
                    <button className="text-left p-2 rounded border border-gray-200 hover:bg-gray-50">
                      <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                      $20+ /hour
                    </button>
                    <button className="text-left p-2 rounded border border-gray-200 hover:bg-gray-50">
                      <ClockIcon className="h-4 w-4 inline mr-1" />
                      Full-time
                    </button>
                    <button className="text-left p-2 rounded border border-gray-200 hover:bg-gray-50">
                      📅 Posted today
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Job List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sortedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <MapPinIcon className="h-12 w-12 mx-auto" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h4>
                  <p className="text-gray-600">Try adjusting your search or filters</p>
                </div>
              ) : (
                sortedJobs.map((job) => (
                  <div key={job.id} className="relative">
                    <JobCard
                      job={job}
                      compact={false}
                      onApply={onApply}
                      onViewDetails={onViewDetails}
                      onSave={() => handleSaveJob(job.id)}
                    />
                    
                    {/* Save Button Overlay */}
                    <button
                      onClick={() => handleSaveJob(job.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md border border-gray-200 hover:border-gray-300 transition-colors"
                      title={savedJobs.has(job.id) ? 'Remove from saved' : 'Save job'}
                    >
                      {savedJobs.has(job.id) ? (
                        <BookmarkSolidIcon className="h-5 w-5 text-orange-500" />
                      ) : (
                        <BookmarkIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Account CTA for non-logged in users */}
            {!isLoggedIn && jobs.length > 0 && (
              <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent p-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <h4 className="font-medium text-orange-900 mb-1">Save Your Job Search</h4>
                  <p className="text-sm text-orange-700 mb-3">
                    Create an account to save jobs and get personalized matches
                  </p>
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    Sign Up Free
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}