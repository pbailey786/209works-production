import React, { useState, useEffect } from '@/components/ui/card';
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
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
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
            body: JSON.stringify({
              query: { keyword: search, type: typeFilter },
            }),
            signal,
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
              const stillExists = data.jobs.find(
                (job: Job) => job.id === prevSelected.id
              );
              return stillExists || data.jobs[0];
            });
          } else {
            setSelectedJob(null);
          }
        } catch (err) {
          if (signal.aborted) return;
          console.error('Error fetching jobs:', err);
          setError('Failed to load jobs.');
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
      <aside className="flex h-full w-full max-w-xs flex-col border-r bg-white">
        <div className="border-b p-6">
          <h1 className="mb-2 text-2xl font-bold text-purple-700">209Jobs</h1>
          <input
            type="text"
            placeholder="Search jobs..."
            className="mb-3 w-full rounded border border-gray-300 p-2"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div
            className="mb-2 flex gap-2"
            role="radiogroup"
            aria-label="Job type filter"
          >
            {['', 'Full-time', 'Part-time', 'Contract'].map(
              (type, idx, arr) => (
                <button
                  key={type || 'all'}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeFilter === type ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-200 bg-gray-100 text-gray-700'}`}
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
              )
            )}
          </div>
        </div>
        {/* Job List */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading && (
            <div className="mt-10 text-center text-gray-400">
              Loading jobs...
            </div>
          )}
          {error && (
            <div className="mt-10 text-center text-red-500">{error}</div>
          )}
          {!loading && !error && filteredJobs.length === 0 && (
            <div className="mt-10 text-center text-gray-400">
              No jobs found.
            </div>
          )}
          {filteredJobs.map((job, index) => (
            <div
              key={job.id}
              tabIndex={0}
              role="button"
              aria-pressed={selectedJob?.id === job.id}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedJob(job);
                }
              }}
              className="rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
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
      <main className="flex flex-1 items-center justify-center bg-white">
        {selectedJob ? (
          <div className="w-full max-w-2xl p-10">
            <h2 className="mb-2 text-2xl font-bold">{selectedJob.title}</h2>
            <div className="mb-1 font-semibold text-purple-700">
              {selectedJob.company}
            </div>
            <div className="mb-4 text-xs text-gray-500">
              {safeDateFormat(selectedJob.postedAt, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }) || 'Date not available'}{' '}
              • {selectedJob.type}
            </div>
            <div className="mb-4 text-gray-700">{selectedJob.description}</div>
            <a
              href={selectedJob.url}
              className="block w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 py-3 text-center text-lg font-semibold text-white shadow hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apply / View Job
            </a>
          </div>
        ) : (
          <div className="text-xl text-gray-400">
            Select a job to view details
          </div>
        )}
      </main>
    </div>
  );
}
