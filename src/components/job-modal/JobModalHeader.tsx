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
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
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
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-4 flex items-center gap-4">
            {job.companyInfo.logo && (
              <img
                src={job.companyInfo.logo}
                alt={`${job.company} logo`}
                className="h-16 w-16 rounded-lg bg-white p-2"
              />
            )}
            <div>
              <h1 className="mb-1 text-2xl font-bold">{job.title}</h1>
              <div className="mb-2 flex items-center text-purple-100">
                <BuildingOfficeIcon className="mr-2 h-5 w-5" />
                <span className="text-lg">{job.company}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-purple-100">
                <div className="flex items-center">
                  <MapPinIcon className="mr-1 h-4 w-4" />
                  {job.location}
                  {job.isRemote && (
                    <span className="ml-2 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
                      Remote
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <BriefcaseIcon className="mr-1 h-4 w-4" />
                  {job.type}
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="mr-1 h-4 w-4" />
                  Posted {safeFormatDate(job.postedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center">
              <EyeIcon className="mr-1 h-4 w-4" />
              {job.viewsCount} views
            </div>
            <div className="flex items-center">
              <UserGroupIcon className="mr-1 h-4 w-4" />
              {job.applicantsCount} applicants
            </div>
            <div className="flex items-center">
              <CurrencyDollarIcon className="mr-1 h-4 w-4" />
              {safeFormatSalary(job.salaryMin, job.salaryMax)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={saveLoading}
            className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium transition ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-white text-purple-600 hover:bg-purple-50'
            } ${saveLoading ? 'cursor-not-allowed opacity-50' : ''}`}
            aria-label={saved ? 'Job saved' : 'Save job'}
          >
            {saveLoading ? (
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
            {saveLoading ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </button>

          <button
            onClick={onShare}
            disabled={shareLoading}
            className={`flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-purple-600 transition hover:bg-purple-50 ${
              shareLoading ? 'cursor-not-allowed opacity-50' : ''
            }`}
            aria-label="Share job"
          >
            {shareLoading ? (
              <LoadingSpinner
                size="sm"
                variant="spinner"
                color="primary"
                className="mr-2"
              />
            ) : (
              <ShareIcon className="mr-2 h-4 w-4" />
            )}
            {shareLoading ? 'Sharing...' : 'Share'}
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
  );
}
