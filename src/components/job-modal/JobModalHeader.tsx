import React from 'react';
import {
  XMarkIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  EyeIcon,
  ShareIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as BookmarkSolidIcon,
} from '@heroicons/react/24/solid';
import { EnhancedJobData } from '@/lib/mockJobData';
import { safeFormatDate, safeFormatSalary } from '@/lib/types/component-props';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface JobModalHeaderProps {
  job: EnhancedJobData;
  saved: boolean;
  onSave: () => void;
  onShare: () => void;
  onClose: () => void;
  saveLoading?: boolean;
  shareLoading?: boolean;
}

export default function JobModalHeader({
  job,
  saved,
  onSave,
  onShare,
  onClose,
  saveLoading = false,
  shareLoading = false,
}: JobModalHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            {job.companyInfo.logo && (
              <img
                src={job.companyInfo.logo}
                alt={`${job.company} logo`}
                className="w-16 h-16 rounded-lg bg-white p-2"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold mb-1">{job.title}</h1>
              <div className="flex items-center text-purple-100 mb-2">
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                <span className="text-lg">{job.company}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-purple-100">
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {job.location}
                  {job.isRemote && (
                    <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Remote
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <BriefcaseIcon className="h-4 w-4 mr-1" />
                  {job.type}
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Posted {safeFormatDate(job.postedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center">
              <EyeIcon className="h-4 w-4 mr-1" />
              {job.viewsCount} views
            </div>
            <div className="flex items-center">
              <UserGroupIcon className="h-4 w-4 mr-1" />
              {job.applicantsCount} applicants
            </div>
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              {safeFormatSalary(job.salaryMin, job.salaryMax)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={saveLoading}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-white text-purple-600 hover:bg-purple-50'
            } ${saveLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={saved ? 'Job saved' : 'Save job'}
          >
            {saveLoading ? (
              <LoadingSpinner size="sm" variant="spinner" color="primary" className="mr-2" />
            ) : saved ? (
              <BookmarkSolidIcon className="h-4 w-4 mr-2" />
            ) : (
              <BookmarkIcon className="h-4 w-4 mr-2" />
            )}
            {saveLoading ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </button>

          <button
            onClick={onShare}
            disabled={shareLoading}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-purple-600 hover:bg-purple-50 transition ${
              shareLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Share job"
          >
            {shareLoading ? (
              <LoadingSpinner size="sm" variant="spinner" color="primary" className="mr-2" />
            ) : (
              <ShareIcon className="h-4 w-4 mr-2" />
            )}
            {shareLoading ? 'Sharing...' : 'Share'}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
} 