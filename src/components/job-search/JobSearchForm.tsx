import React from 'react';

interface JobSearchFormProps {
  query: string;
  location: string;
  onQueryChange: (query: string) => void;
  onLocationChange: (location: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
}

export default function JobSearchForm({
  query,
  location,
  onQueryChange,
  onLocationChange,
  onSubmit,
  loading = false,
}: JobSearchFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 flex w-full max-w-3xl flex-col items-center gap-4 md:flex-row"
    >
      <label htmlFor="job-search" className="sr-only">
        Job title or keyword
      </label>
      <input
        type="text"
        id="job-search"
        placeholder="Job title, keyword"
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 md:w-1/2"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        aria-label="Job title or keyword"
        disabled={loading}
      />

      <label htmlFor="location-search" className="sr-only">
        Location
      </label>
      <input
        type="text"
        id="location-search"
        placeholder="Location"
        className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 md:w-1/3"
        value={location}
        onChange={e => onLocationChange(e.target.value)}
        aria-label="Location"
        disabled={loading}
      />

      <button
        className={`rounded-lg bg-purple-700 px-5 py-3 text-white transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
          loading ? 'cursor-not-allowed opacity-50' : ''
        }`}
        type="submit"
        aria-label="Search for jobs"
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}
