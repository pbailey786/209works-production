import React, { useState, useEffect } from "react";
import JobCard from "./JobCard";
import { safeDateFormat } from '@/lib/utils/safe-operations';

interface Job {
  id: number;
  title: string;
  company: string;
  type: string;
  postedAt: string;
  description: string;
  url: string;
  isFeatured?: boolean;
}

export default function JobBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch jobs from API
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    // Debounce search to avoid excessive API calls
    const timeoutId = setTimeout(() => {
      async function fetchJobs() {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch('/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: { keyword: search, type: typeFilter } }),
            signal
          });

          if (signal.aborted) return;

          const data = await res.json();
          setJobs(data.jobs || []);
          
          // Auto-select the first job if none selected and jobs are available
          if (data.jobs && data.jobs.length > 0) {
            setSelectedJob(prevSelected => {
              // Only auto-select if no job is currently selected
              if (!prevSelected) {
                return data.jobs[0];
              }
              // Check if the currently selected job still exists in the new results
              const stillExists = data.jobs.find((job: Job) => job.id === prevSelected.id);
              return stillExists || data.jobs[0];
            });
          } else {
            setSelectedJob(null);
          }
        } catch (err) {
          if (signal.aborted) return;
          console.error('Error fetching jobs:', err);
          setError("Failed to load jobs.");
          setJobs([]);
          setSelectedJob(null);
        } finally {
          if (!signal.aborted) {
            setLoading(false);
          }
        }
      }
      fetchJobs();
    }, 300); // 300ms debounce

    // Cleanup function
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [search, typeFilter]); // Removed selectedJob from dependencies

  // Filtered jobs (already filtered by API, but keep for future extension)
  const filteredJobs = jobs;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full max-w-xs bg-white border-r flex flex-col h-full">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-purple-700 mb-2">209Jobs</h1>
          <input
            type="text"
            placeholder="Search jobs..."
            className="w-full p-2 rounded border border-gray-300 mb-3"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-2 mb-2" role="radiogroup" aria-label="Job type filter">
            {['', 'Full-time', 'Part-time', 'Contract'].map((type, idx, arr) => (
              <button
                key={type || 'all'}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${typeFilter === type ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                onClick={() => setTypeFilter(type)}
                aria-label={`Filter by ${type || 'All'} jobs`}
                aria-pressed={typeFilter === type}
                role="radio"
                aria-checked={typeFilter === type}
                tabIndex={typeFilter === type ? 0 : -1}
                onKeyDown={e => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIdx = (idx + 1) % arr.length;
                    setTypeFilter(arr[nextIdx]);
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIdx = (idx - 1 + arr.length) % arr.length;
                    setTypeFilter(arr[prevIdx]);
                  }
                }}
              >
                {type || 'All'}
              </button>
            ))}
          </div>
        </div>
        {/* Job List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && <div className="text-gray-400 text-center mt-10">Loading jobs...</div>}
          {error && <div className="text-red-500 text-center mt-10">{error}</div>}
          {!loading && !error && filteredJobs.length === 0 && (
            <div className="text-gray-400 text-center mt-10">No jobs found.</div>
          )}
          {filteredJobs.map((job, index) => (
            <div 
              key={job.id}
              tabIndex={0}
              role="button"
              aria-pressed={selectedJob?.id === job.id}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedJob(job);
                }
              }}
              className="focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
            >
              <JobCard
                title={job.title}
                company={job.company}
                type={job.type}
                description={job.description}
                applyUrl={job.url}
                postedAt={job.postedAt}
                onClick={() => setSelectedJob(job)}
                isSelected={selectedJob?.id === job.id}
                isFeatured={job.isFeatured}
              />
            </div>
          ))}
        </div>
      </aside>
      {/* Main Panel: Job Details */}
      <main className="flex-1 flex items-center justify-center bg-white">
        {selectedJob ? (
          <div className="max-w-2xl w-full p-10">
            <h2 className="text-2xl font-bold mb-2">{selectedJob.title}</h2>
            <div className="text-purple-700 font-semibold mb-1">{selectedJob.company}</div>
            <div className="text-xs text-gray-500 mb-4">
              {safeDateFormat(selectedJob.postedAt, { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }) || 'Date not available'} • {selectedJob.type}
            </div>
            <div className="text-gray-700 mb-4">{selectedJob.description}</div>
            <a
              href={selectedJob.url}
              className="block w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-center shadow hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-400 text-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apply / View Job
            </a>
          </div>
        ) : (
          <div className="text-gray-400 text-xl">Select a job to view details</div>
        )}
      </main>
    </div>
  );
} 