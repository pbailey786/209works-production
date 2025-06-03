'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salaryMin?: number;
  salaryMax?: number;
  postedAt: Date;
  savedAt: Date;
}

interface SearchHistory {
  id: string;
  query: string;
  filters: any;
  createdAt: Date;
}

interface Alert {
  id: string;
  type: string;
  jobTitle: string;
  location: string;
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

interface DashboardClientProps {
  recentSavedJobs: Job[];
  recentSearches: SearchHistory[];
  recentAlerts: Alert[];
}

export default function DashboardClient({
  recentSavedJobs,
  recentSearches,
  recentAlerts,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'saved' | 'searches' | 'alerts'>(
    'saved'
  );

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max)
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max?.toLocaleString()}`;
  };

  const formatFilters = (filters: any) => {
    if (!filters || typeof filters !== 'object') return '';
    const filterParts = [];
    if (filters.location) filterParts.push(`Location: ${filters.location}`);
    if (filters.type) filterParts.push(`Type: ${filters.type}`);
    if (filters.salaryMin)
      filterParts.push(`Min Salary: $${filters.salaryMin.toLocaleString()}`);
    return filterParts.join(', ');
  };

  return (
    <div className="mt-8">
      {/* Recent Activity Section */}
      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('saved')}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'saved'
                  ? 'border-[#2d4a3e] text-[#2d4a3e]'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Saved Jobs ({recentSavedJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('searches')}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'searches'
                  ? 'border-[#2d4a3e] text-[#2d4a3e]'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Recent Searches ({recentSearches.length})
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === 'alerts'
                  ? 'border-[#2d4a3e] text-[#2d4a3e]'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Job Alerts ({recentAlerts.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'saved' && (
            <div className="space-y-4">
              {recentSavedJobs.length === 0 ? (
                <div className="py-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No saved jobs
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start saving jobs you're interested in.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/jobs"
                      className="inline-flex items-center rounded-md border border-transparent bg-[#2d4a3e] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1d3a2e]"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {recentSavedJobs.map(job => (
                    <div
                      key={job.id}
                      className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link href={`/jobs/${job.id}`} className="block">
                            <h3 className="text-lg font-medium text-gray-900 hover:text-[#2d4a3e]">
                              {job.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                              {job.company}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <svg
                                  className="mr-1 h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {job.location}
                              </span>
                              <span className="flex items-center">
                                <svg
                                  className="mr-1 h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                                  />
                                </svg>
                                {job.type}
                              </span>
                              <span className="flex items-center">
                                <svg
                                  className="mr-1 h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                  />
                                </svg>
                                {formatSalary(job.salaryMin, job.salaryMax)}
                              </span>
                            </div>
                          </Link>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>
                            Saved{' '}
                            {formatDistanceToNow(new Date(job.savedAt), {
                              addSuffix: true,
                            })}
                          </p>
                          <p className="mt-1">
                            Posted{' '}
                            {formatDistanceToNow(new Date(job.postedAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 text-center">
                    <Link
                      href="/profile/saved"
                      className="text-sm font-medium text-[#2d4a3e] hover:text-[#1d3a2e]"
                    >
                      View all saved jobs →
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'searches' && (
            <div className="space-y-4">
              {recentSearches.length === 0 ? (
                <div className="py-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No search history
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your recent searches will appear here.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/jobs"
                      className="inline-flex items-center rounded-md border border-transparent bg-[#2d4a3e] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1d3a2e]"
                    >
                      Start Searching
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {recentSearches.map(search => (
                    <div
                      key={search.id}
                      className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link
                            href={`/jobs?q=${encodeURIComponent(search.query)}`}
                            className="block"
                          >
                            <h3 className="text-lg font-medium text-gray-900 hover:text-[#2d4a3e]">
                              "{search.query}"
                            </h3>
                            {formatFilters(search.filters) && (
                              <p className="mt-1 text-sm text-gray-600">
                                Filters: {formatFilters(search.filters)}
                              </p>
                            )}
                          </Link>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>
                            {formatDistanceToNow(new Date(search.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {recentAlerts.length === 0 ? (
                <div className="py-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-5 5v-5zM21 7H3a2 2 0 00-2 2v10a2 2 0 002 2h8"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No job alerts
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Set up alerts to get notified about new jobs.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/alerts"
                      className="inline-flex items-center rounded-md border border-transparent bg-[#2d4a3e] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1d3a2e]"
                    >
                      Create Alert
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {recentAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              {alert.jobTitle}
                            </h3>
                            <span
                              className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                alert.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {alert.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <svg
                                className="mr-1 h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {alert.location}
                            </span>
                            <span className="flex items-center">
                              <svg
                                className="mr-1 h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                              </svg>
                              {alert.type}
                            </span>
                          </div>
                          {alert.lastTriggered && (
                            <p className="mt-1 text-sm text-gray-500">
                              Last triggered{' '}
                              {formatDistanceToNow(
                                new Date(alert.lastTriggered),
                                { addSuffix: true }
                              )}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>
                            Created{' '}
                            {formatDistanceToNow(new Date(alert.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 text-center">
                    <Link
                      href="/alerts"
                      className="text-sm font-medium text-[#2d4a3e] hover:text-[#1d3a2e]"
                    >
                      Manage all alerts →
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
