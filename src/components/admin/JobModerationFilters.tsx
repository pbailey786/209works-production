'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';

interface ModerationStats {
  total: number;
  pending: number;
  flagged: number;
  approved: number;
}

interface JobModerationFiltersProps {
  currentFilters: any;
  stats: ModerationStats;
}

export default function JobModerationFilters({ currentFilters, stats }: JobModerationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(currentFilters.company || '');

  const statusOptions = [
    { value: 'all', label: 'All Jobs', count: stats.total },
    { value: 'pending', label: 'Pending Review', count: stats.pending },
    { value: 'flagged', label: 'Flagged Content', count: stats.flagged },
    { value: 'approved', label: 'Approved', count: stats.approved },
  ];

  const sortOptions = [
    { value: 'createdAt-desc', label: 'Newest First' },
    { value: 'createdAt-asc', label: 'Oldest First' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'company-asc', label: 'Company A-Z' },
  ];

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (value === 'all' || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    // Reset to first page when filtering
    params.delete('page');
    
    router.push(`/admin/moderation/jobs?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    const params = new URLSearchParams(searchParams);
    
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.delete('page');
    
    router.push(`/admin/moderation/jobs?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange('company', searchTerm);
  };

  const clearFilters = () => {
    setSearchTerm('');
    router.push('/admin/moderation/jobs');
  };

  const hasActiveFilters = currentFilters.status || currentFilters.company || currentFilters.category;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleFilterChange('status', option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              (currentFilters.status || 'all') === option.value
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            {option.label}
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white bg-opacity-70">
              {option.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </form>

        {/* Sort */}
        <div className="flex items-center gap-4">
          <select
            value={`${currentFilters.sortBy || 'createdAt'}-${currentFilters.sortOrder || 'desc'}`}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          
          {currentFilters.status && currentFilters.status !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Status: {statusOptions.find(s => s.value === currentFilters.status)?.label}
              <button
                onClick={() => handleFilterChange('status', 'all')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {currentFilters.company && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Company: {currentFilters.company}
              <button
                onClick={() => handleFilterChange('company', '')}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
} 