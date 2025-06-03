'use client';

import React, { useState, useEffect } from 'react';
import {
  CloudArrowDownIcon,
  TrashIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ImportStats {
  totalAdzunaJobs: number;
  recentJobs: number;
  oldestJob: string | null;
  newestJob: string | null;
  jobsByType: Record<string, number>;
}

interface ImportResult {
  success: boolean;
  message: string;
  stats: {
    imported: number;
    skipped: number;
    duplicates: number;
    errors: number;
  };
  details: string[];
}

export default function AdzunaImportPage() {
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Import options
  const [importOptions, setImportOptions] = useState({
    resultsPerCity: 25,
    maxJobs: 500,
    filterQuality: true,
    cleanupOld: false,
  });

  // Load initial data
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/adzuna-import');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setHasCredentials(data.hasCredentials);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const startImport = async () => {
    setImporting(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/admin/adzuna-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importOptions),
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        // Reload stats after successful import
        await loadStats();
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        message: 'Import failed due to network error',
        stats: { imported: 0, skipped: 0, duplicates: 0, errors: 1 },
        details: ['Network error occurred'],
      });
    } finally {
      setImporting(false);
    }
  };

  const cleanupOldJobs = async () => {
    setCleaning(true);

    try {
      const response = await fetch('/api/admin/adzuna-import', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert(`Cleanup completed: ${result.deleted} jobs deleted`);
        await loadStats();
      } else {
        alert(`Cleanup failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Cleanup failed due to network error');
    } finally {
      setCleaning(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysAgo = (dateString: string | null) => {
    if (!dateString) return null;
    const days = Math.floor(
      (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Adzuna Job Import
          </h1>
          <p className="mt-2 text-gray-600">
            Import jobs from Adzuna API to populate your job board with 209 area
            code opportunities
          </p>
          <div className="mt-3 space-y-2">
            <div className="inline-block rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-600">
              🎯 Hyper-local focus: Stockton, Modesto, Tracy, Manteca, Lodi,
              Turlock, Merced + 18 more 209 cities
            </div>
            <div className="inline-block rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">
              🚫 Enhanced filtering: Removes remote jobs, MLM/insurance spam,
              and repetitive postings
            </div>
          </div>
        </div>

        {/* Credentials Check */}
        {!hasCredentials && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="mr-3 mt-0.5 h-5 w-5 text-yellow-400" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Adzuna API Credentials Missing
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Please add ADZUNA_APP_ID and ADZUNA_APP_KEY to your
                  environment variables to enable job imports.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Statistics Panel */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <ChartBarIcon className="mr-2 h-5 w-5" />
                Import Statistics
              </h2>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                  <div className="h-4 w-2/3 rounded bg-gray-200"></div>
                </div>
              ) : stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-blue-50 p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.totalAdzunaJobs.toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-800">
                        Total Adzuna Jobs
                      </div>
                    </div>

                    <div className="rounded-lg bg-green-50 p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.recentJobs.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-800">
                        Recent Jobs (7 days)
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="mb-2 font-medium text-gray-900">
                      Import Timeline
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Oldest Job:</span>
                        <span className="font-medium">
                          {formatDate(stats.oldestJob)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Newest Job:</span>
                        <span className="font-medium">
                          {formatDate(stats.newestJob)}
                          {stats.newestJob && (
                            <span className="ml-2 text-gray-500">
                              ({getDaysAgo(stats.newestJob)} days ago)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="mb-2 font-medium text-gray-900">
                      Jobs by Type
                    </h3>
                    <div className="space-y-1">
                      {Object.entries(stats.jobsByType).map(([type, count]) => (
                        <div
                          key={type}
                          className="flex justify-between text-sm"
                        >
                          <span className="capitalize text-gray-600">
                            {type.replace('_', ' ')}
                          </span>
                          <span className="font-medium">
                            {count.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Failed to load statistics</div>
              )}
            </div>
          </div>

          {/* Import Controls */}
          <div className="space-y-6">
            {/* Import Options */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Import Options
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Results per City
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="50"
                    value={importOptions.resultsPerCity || 25}
                    onChange={e =>
                      setImportOptions(prev => ({
                        ...prev,
                        resultsPerCity: parseInt(e.target.value) || 25,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Max Total Jobs
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="1000"
                    value={importOptions.maxJobs || 500}
                    onChange={e =>
                      setImportOptions(prev => ({
                        ...prev,
                        maxJobs: parseInt(e.target.value) || 500,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOptions.filterQuality}
                      onChange={e =>
                        setImportOptions(prev => ({
                          ...prev,
                          filterQuality: e.target.checked,
                        }))
                      }
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Filter low-quality jobs
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOptions.cleanupOld}
                      onChange={e =>
                        setImportOptions(prev => ({
                          ...prev,
                          cleanupOld: e.target.checked,
                        }))
                      }
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Clean up old jobs first
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Actions
              </h2>

              <div className="space-y-3">
                <button
                  onClick={startImport}
                  disabled={importing || !hasCredentials}
                  className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {importing ? (
                    <>
                      <ClockIcon className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CloudArrowDownIcon className="mr-2 h-4 w-4" />
                      Start Import
                    </>
                  )}
                </button>

                <button
                  onClick={cleanupOldJobs}
                  disabled={cleaning || !hasCredentials}
                  className="flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {cleaning ? (
                    <>
                      <ClockIcon className="mr-2 h-4 w-4 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Cleanup Old Jobs
                    </>
                  )}
                </button>

                <button
                  onClick={loadStats}
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-md bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  Refresh Stats
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Import Results */}
        {importResult && (
          <div className="mt-6">
            <div
              className={`rounded-lg p-6 ${
                importResult.success
                  ? 'border border-green-200 bg-green-50'
                  : 'border border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start">
                {importResult.success ? (
                  <CheckCircleIcon className="mr-3 mt-0.5 h-5 w-5 text-green-400" />
                ) : (
                  <ExclamationTriangleIcon className="mr-3 mt-0.5 h-5 w-5 text-red-400" />
                )}
                <div className="flex-1">
                  <h3
                    className={`text-sm font-medium ${
                      importResult.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {importResult.message}
                  </h3>

                  {importResult.success && (
                    <div className="mt-2 text-sm text-green-700">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          Imported:{' '}
                          <span className="font-medium">
                            {importResult.stats.imported}
                          </span>
                        </div>
                        <div>
                          Skipped:{' '}
                          <span className="font-medium">
                            {importResult.stats.skipped}
                          </span>
                        </div>
                        <div>
                          Duplicates:{' '}
                          <span className="font-medium">
                            {importResult.stats.duplicates}
                          </span>
                        </div>
                        <div>
                          Errors:{' '}
                          <span className="font-medium">
                            {importResult.stats.errors}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {importResult.details && importResult.details.length > 0 && (
                    <div className="mt-3">
                      <details className="text-sm">
                        <summary
                          className={`cursor-pointer ${
                            importResult.success
                              ? 'text-green-700'
                              : 'text-red-700'
                          }`}
                        >
                          View Details
                        </summary>
                        <div className="mt-2 space-y-1">
                          {importResult.details.map((detail, index) => (
                            <div
                              key={index}
                              className={`${
                                importResult.success
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {detail}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
