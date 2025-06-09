import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion'; // For animations
import { BookmarkIcon, StarIcon, EyeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'; // For icons
import {
  JobCardProps,
  validateJobCardProps,
  defaultJobCardProps,
  safeFormatDate,
} from '@/lib/types/component-props';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ACCESSIBLE_ICONS } from '@/utils/accessibility';

export default function JobCard(props: JobCardProps) {
  // Validate props and apply defaults
  const validatedProps = validateJobCardProps(props);
  const {
    title,
    company,
    type,
    postedAt,
    description,
    applyUrl,
    isFeatured = defaultJobCardProps.isFeatured!,
    onSave,
    saved = defaultJobCardProps.saved!,
    onClick,
    isSelected = defaultJobCardProps.isSelected!,
    onViewDetails,
    applied = false,
    applicationStatus,
    appliedAt,
  } = validatedProps;

  // Local state for save operation
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<number | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!onSave || isSaving || saved) return;

    setIsSaving(true);
    setSaveError(null);

    // Clear any existing error timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    try {
      await onSave();
    } catch (error) {
      console.error('Failed to save job:', error);
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save job'
      );

      // Clear error after 3 seconds with proper cleanup
      errorTimeoutRef.current = window.setTimeout(() => {
        setSaveError(null);
        errorTimeoutRef.current = null;
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article
      className={`flex cursor-pointer flex-col gap-3 rounded-xl border bg-white p-4 shadow-md transition hover:shadow-lg sm:p-6 ${isSelected ? 'border-[#2d4a3e] ring-2 ring-[#2d4a3e]/20' : 'border-gray-100'}`}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={e => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={isSelected}
      aria-label={`Job listing for ${title} at ${company}`}
      data-testid={`job-card-${title}`}
    >
      {isFeatured && (
        <div className="absolute right-0 top-0 rounded-bl-lg rounded-tr-lg bg-yellow-400 px-3 py-1 text-xs font-bold text-white">
          <StarIcon
            className="mr-1 inline h-4 w-4"
            {...ACCESSIBLE_ICONS.decorative}
          />
          Featured
        </div>
      )}

      {applied && (
        <div className={`absolute ${isFeatured ? 'right-0 top-8' : 'right-0 top-0'} rounded-bl-lg rounded-tr-lg bg-green-500 px-3 py-1 text-xs font-bold text-white`}>
          <CheckCircleIcon
            className="mr-1 inline h-4 w-4"
            {...ACCESSIBLE_ICONS.decorative}
          />
          Applied
        </div>
      )}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">
            {title}
          </h2>
          <div className="text-sm font-medium text-gray-700">{company}</div>
        </div>
        <span className="mt-2 inline-block rounded-full bg-[#2d4a3e]/10 px-3 py-1 text-xs font-semibold text-[#2d4a3e] sm:mt-0">
          {type}
        </span>
      </header>
      <time className="mb-2 text-xs text-gray-500" dateTime={postedAt}>
        Posted {safeFormatDate(postedAt)}
      </time>
      <p className="mb-2 line-clamp-3 text-sm text-gray-700">{description}</p>

      {/* Save Error Display */}
      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          role="alert"
          aria-live="polite"
        >
          {saveError}
        </motion.div>
      )}

      <footer className="mt-auto flex flex-col gap-2 sm:flex-row">
        {/* View Details Button - Primary action for the modal */}
        {onViewDetails && (
          <button
            onClick={e => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="flex items-center justify-center rounded-lg bg-purple-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={`View details for ${title} at ${company}`}
            data-testid={`view-details-${title}`}
          >
            <EyeIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            View Details
          </button>
        )}

        {/* Original Apply/View Job button - now secondary if modal is available */}
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-lg px-6 py-3 text-center text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#2d4a3e] ${
            onViewDetails
              ? 'border border-[#2d4a3e]/20 bg-white text-[#2d4a3e] hover:bg-[#2d4a3e]/5'
              : 'bg-[#2d4a3e] text-white hover:bg-[#1d3a2e]'
          }`}
          aria-label={`Apply for ${title} at ${company}`}
          data-testid={`apply-${title}`}
        >
          {onViewDetails ? 'Quick Apply' : 'View Job'}
        </a>

        {onSave && (
          <button
            onClick={e => {
              e.stopPropagation();
              handleSave();
            }}
            className={`flex min-w-[100px] items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition ${
              saved
                ? 'cursor-not-allowed border-[#9fdf9f]/30 bg-[#9fdf9f]/20 text-[#2d4a3e]'
                : isSaving
                  ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-600'
                  : 'border border-[#2d4a3e]/20 bg-white text-[#2d4a3e] hover:bg-[#2d4a3e]/5'
            }`}
            disabled={saved || isSaving}
            aria-label={
              saved
                ? `${title} saved`
                : isSaving
                  ? `Saving ${title}`
                  : `Save ${title}`
            }
            data-testid={`save-${title}`}
          >
            {isSaving ? (
              <>
                <LoadingSpinner
                  size="sm"
                  variant="spinner"
                  color="gray"
                  className="mr-2"
                />
                Saving...
              </>
            ) : saved ? (
              <>
                <BookmarkIcon className="mr-1 h-5 w-5" aria-hidden="true" />
                Saved
              </>
            ) : (
              <>
                <BookmarkIcon className="mr-1 h-5 w-5" aria-hidden="true" />
                Save
              </>
            )}
          </button>
        )}
      </footer>
    </article>
  );
}
