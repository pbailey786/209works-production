'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  HeartIcon,
  EyeIcon,
  ShareIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    type: string;
    postedDate: string;
    description?: string;
    requirements?: string[];
    benefits?: string[];
    remote?: boolean;
    urgent?: boolean;
  };
  compact?: boolean;
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
}

export default function JobCard({ 
  job, 
  compact = false, 
  onApply, 
  onSave, 
  onViewDetails 
}: JobCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (onApply) {
      setIsApplying(true);
      try {
        await onApply(job.id);
      } finally {
        setIsApplying(false);
      }
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (onSave) {
      onSave(job.id);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(job.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
        compact ? 'p-4' : 'p-6'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {job.title}
            </h3>
            {job.urgent && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Urgent
              </span>
            )}
            {job.remote && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Remote
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <BuildingOfficeIcon className="h-4 w-4" />
              <span>{job.company}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPinIcon className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title={isSaved ? 'Remove from saved' : 'Save job'}
        >
          {isSaved ? (
            <HeartSolidIcon className="h-5 w-5 text-red-500" />
          ) : (
            <HeartIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Job Details */}
      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
        {job.salary && (
          <div className="flex items-center space-x-1">
            <CurrencyDollarIcon className="h-4 w-4" />
            <span>{job.salary}</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <ClockIcon className="h-4 w-4" />
          <span>{job.type}</span>
        </div>
        <span className="text-gray-400">•</span>
        <span>{job.postedDate}</span>
      </div>

      {/* Description */}
      {!compact && job.description && (
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {job.description}
        </p>
      )}

      {/* Requirements Preview */}
      {!compact && job.requirements && job.requirements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Key Requirements:</h4>
          <div className="flex flex-wrap gap-2">
            {job.requirements.slice(0, 3).map((req, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
              >
                {req}
              </span>
            ))}
            {job.requirements.length > 3 && (
              <span className="text-xs text-gray-500">
                +{job.requirements.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? (
              <>
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Applying...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Apply Now
              </>
            )}
          </button>
          <button
            onClick={handleViewDetails}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View Details
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Share job"
          >
            <ShareIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat-specific actions */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2 text-xs">
          <button className="text-orange-600 hover:text-orange-700 font-medium">
            Tell me more about this role
          </button>
          <span className="text-gray-300">•</span>
          <button className="text-orange-600 hover:text-orange-700 font-medium">
            Find similar jobs
          </button>
          <span className="text-gray-300">•</span>
          <button className="text-orange-600 hover:text-orange-700 font-medium">
            Should I apply?
          </button>
        </div>
      </div>
    </motion.div>
  );
}
