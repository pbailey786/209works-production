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
    <div className="mb-4 mt-6 flex justify-center">
      <nav
        className="flex items-center gap-2 sm:gap-4"
        aria-label="Job search pagination"
      >
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={!canGoPrevious || loading}
          className="h-12 rounded-lg border px-4 py-3 text-base font-medium transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          aria-label="Go to previous page"
        >
          Previous
        </button>

        <span className="whitespace-nowrap px-3 text-sm text-gray-600 sm:text-base">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={!canGoNext || loading}
          className="h-12 rounded-lg border px-4 py-3 text-base font-medium transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          aria-label="Go to next page"
        >
          Next
        </button>
      </nav>
    </div>
  );
}
