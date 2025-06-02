import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion"; // For animations
import { BookmarkIcon, StarIcon, EyeIcon } from "@heroicons/react/24/outline"; // For icons
import { 
  JobCardProps, 
  validateJobCardProps, 
  defaultJobCardProps,
  safeFormatDate 
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
      setSaveError(error instanceof Error ? error.message : 'Failed to save job');
      
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
      className={`bg-white rounded-xl shadow-md p-4 sm:p-6 flex flex-col gap-3 border transition cursor-pointer hover:shadow-lg ${isSelected ? 'border-[#2d4a3e] ring-2 ring-[#2d4a3e]/20' : 'border-gray-100'}`}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => {
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
        <div className="absolute top-0 right-0 bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
          <StarIcon 
            className="w-4 h-4 inline mr-1" 
            {...ACCESSIBLE_ICONS.decorative}
          />
          Featured
        </div>
      )}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{title}</h2>
          <div className="text-gray-700 text-sm font-medium">{company}</div>
        </div>
        <span className="inline-block bg-[#2d4a3e]/10 text-[#2d4a3e] text-xs font-semibold px-3 py-1 rounded-full mt-2 sm:mt-0">
          {type}
        </span>
      </header>
      <time className="text-gray-500 text-xs mb-2" dateTime={postedAt}>Posted {safeFormatDate(postedAt)}</time>
      <p className="text-gray-700 text-sm line-clamp-3 mb-2">{description}</p>
      
      {/* Save Error Display */}
      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs"
          role="alert"
          aria-live="polite"
        >
          {saveError}
        </motion.div>
      )}
      
      <footer className="flex flex-col sm:flex-row gap-2 mt-auto">
        {/* View Details Button - Primary action for the modal */}
        {onViewDetails && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="px-6 py-3 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-800 transition text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-center"
            aria-label={`View details for ${title} at ${company}`}
            data-testid={`view-details-${title}`}
          >
            <EyeIcon 
              className="w-4 h-4 mr-2" 
              aria-hidden="true"
            />
            View Details
          </button>
        )}
        
        {/* Original Apply/View Job button - now secondary if modal is available */}
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-6 py-3 rounded-lg font-semibold transition text-sm focus:outline-none focus:ring-2 focus:ring-[#2d4a3e] text-center ${
            onViewDetails
              ? 'bg-white text-[#2d4a3e] border border-[#2d4a3e]/20 hover:bg-[#2d4a3e]/5'
              : 'bg-[#2d4a3e] text-white hover:bg-[#1d3a2e]'
          }`}
          aria-label={`Apply for ${title} at ${company}`}
          data-testid={`apply-${title}`}
        >
          {onViewDetails ? 'Quick Apply' : 'View Job'}
        </a>
        
        {onSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition flex items-center justify-center min-w-[100px] ${
              saved
                ? "bg-[#9fdf9f]/20 text-[#2d4a3e] border-[#9fdf9f]/30 cursor-not-allowed"
                : isSaving
                ? "bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed"
                : "bg-white text-[#2d4a3e] border border-[#2d4a3e]/20 hover:bg-[#2d4a3e]/5"
            }`}
            disabled={saved || isSaving}
            aria-label={saved ? `${title} saved` : isSaving ? `Saving ${title}` : `Save ${title}`}
            data-testid={`save-${title}`}
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" variant="spinner" color="gray" className="mr-2" />
                Saving...
              </>
            ) : saved ? (
              <>
                <BookmarkIcon 
                  className="w-5 h-5 mr-1" 
                  aria-hidden="true"
                />
                Saved
              </>
            ) : (
              <>
                <BookmarkIcon 
                  className="w-5 h-5 mr-1" 
                  aria-hidden="true"
                />
                Save
              </>
            )}
          </button>
        )}
      </footer>
    </article>
  );
}