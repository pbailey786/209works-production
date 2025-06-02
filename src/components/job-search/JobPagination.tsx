import React from 'react';

interface JobPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function JobPagination({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
}: JobPaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="flex justify-center mt-6 mb-4">
      <nav 
        className="flex items-center gap-2 sm:gap-4" 
        aria-label="Job search pagination"
      >
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={!canGoPrevious || loading}
          className="px-4 py-3 h-12 rounded-lg border disabled:opacity-50 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-base font-medium"
          aria-label="Go to previous page"
        >
          Previous
        </button>
        
        <span className="text-sm sm:text-base text-gray-600 px-3 whitespace-nowrap">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={!canGoNext || loading}
          className="px-4 py-3 h-12 rounded-lg border disabled:opacity-50 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-base font-medium"
          aria-label="Go to next page"
        >
          Next
        </button>
      </nav>
    </div>
  );
} 