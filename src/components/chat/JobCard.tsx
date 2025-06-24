'use client';

import { useState } from 'react';
import { 
  MapPinIcon, 
  CurrencyDollarIcon, 
  CalendarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  EyeIcon,
  BookmarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

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

interface JobCardProps {
  job: Job;
  compact?: boolean;
  onApply: (jobId: string) => void;
  onViewDetails: (jobId: string) => void;
  onSave: (jobId: string) => void;
}

export default function JobCard({ 
  job, 
  compact = false, 
  onApply, 
  onViewDetails, 
  onSave 
}: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: 'apply' | 'view' | 'save', callback: (id: string) => void) => {
    setActionLoading(action);
    try {
      await callback(job.id);
    } finally {
      setActionLoading(null);
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {job.title}
            </h3>
            {job.urgent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                Urgent
              </span>
            )}
            {job.remote && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Remote OK
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
            <div className="flex items-center space-x-1">
              <BuildingOfficeIcon className="h-3 w-3" />
              <span className="truncate">{job.company}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPinIcon className="h-3 w-3" />
              <span className="truncate">{job.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-3 w-3" />
              <span>{job.type}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs text-gray-500">
            {job.salary && (
              <div className="flex items-center space-x-1">
                <CurrencyDollarIcon className="h-3 w-3" />
                <span>{job.salary}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-3 w-3" />
              <span>{job.postedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-3">
        <p className="text-xs text-gray-700 leading-relaxed">
          {compact && !isExpanded 
            ? truncateText(job.description, 120)
            : job.description
          }
        </p>
        
        {compact && job.description.length > 120 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-orange-600 hover:text-orange-700 mt-1 font-medium"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Requirements (if expanded or not compact) */}
      {(!compact || isExpanded) && job.requirements.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-gray-900 mb-1">Requirements</h4>
          <ul className="text-xs text-gray-600 space-y-0.5 ml-3">
            {job.requirements.slice(0, 3).map((req, index) => (
              <li key={index} className="list-disc">{req}</li>
            ))}
            {job.requirements.length > 3 && (
              <li className="text-gray-500">+{job.requirements.length - 3} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Benefits (if expanded or not compact) */}
      {(!compact || isExpanded) && job.benefits.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-gray-900 mb-1">Benefits</h4>
          <ul className="text-xs text-gray-600 space-y-0.5 ml-3">
            {job.benefits.slice(0, 2).map((benefit, index) => (
              <li key={index} className="list-disc">{benefit}</li>
            ))}
            {job.benefits.length > 2 && (
              <li className="text-gray-500">+{job.benefits.length - 2} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleAction('view', onViewDetails)}
            disabled={actionLoading === 'view'}
            className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
          >
            <EyeIcon className="h-3 w-3" />
            <span>{actionLoading === 'view' ? 'Loading...' : 'View'}</span>
          </button>
          
          <button
            onClick={() => handleAction('save', onSave)}
            disabled={actionLoading === 'save'}
            className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
          >
            <BookmarkIcon className="h-3 w-3" />
            <span>{actionLoading === 'save' ? 'Saving...' : 'Save'}</span>
          </button>
        </div>

        <button
          onClick={() => handleAction('apply', onApply)}
          disabled={actionLoading === 'apply'}
          className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded transition-colors disabled:opacity-50"
        >
          <PaperAirplaneIcon className="h-3 w-3" />
          <span>{actionLoading === 'apply' ? 'Applying...' : 'Apply'}</span>
        </button>
      </div>
    </div>
  );
}