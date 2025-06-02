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
      className="flex flex-col md:flex-row items-center gap-4 w-full max-w-3xl mb-6"
    >
      <label htmlFor="job-search" className="sr-only">
        Job title or keyword
      </label>
      <input
        type="text"
        id="job-search"
        placeholder="Job title, keyword"
        className="w-full md:w-1/2 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
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
        className="w-full md:w-1/3 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        value={location}
        onChange={(e) => onLocationChange(e.target.value)}
        aria-label="Location"
        disabled={loading}
      />
      
      <button
        className={`px-5 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
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