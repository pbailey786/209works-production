import React, { useState, useEffect, useRef, useReducer } from '@/components/ui/card';
import { JobWithOptionalFields } from '@/lib/types/component-props';


interface AsyncOperationState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  errorType: 'error' | 'network' | 'timeout' | 'validation';
  canRetry: boolean;
  attemptCount: number;
  maxRetries: number;
}

const createAsyncState = (): AsyncOperationState => ({
  isLoading: false,
  hasError: false,
  errorMessage: null,
  errorType: 'error',
  canRetry: true,
  attemptCount: 0,
  maxRetries: 3,
});

const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
};

// State interface for useReducer
interface JobListState {
  jobs: JobWithOptionalFields[];
  selectedJob: JobWithOptionalFields | null;
  query: string;
  location: string;
  searchQuery: string;
  searchLocation: string;
  fetchState: AsyncOperationState;
  fetched: boolean;
  page: number;
  totalPages: number;
  debouncedQuery: string;
  debouncedLocation: string;
  modalOpen: boolean;
  savedJobs: (string | number)[];
}

// Action types
type JobListAction =
  | { type: 'SET_JOBS'; payload: JobWithOptionalFields[] }
  | { type: 'SET_SELECTED_JOB'; payload: JobWithOptionalFields | null }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_LOCATION'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_LOCATION'; payload: string }
  | { type: 'SET_FETCH_STATE'; payload: Partial<AsyncOperationState> }
  | { type: 'SET_FETCHED'; payload: boolean }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_TOTAL_PAGES'; payload: number }
  | { type: 'SET_DEBOUNCED_QUERY'; payload: string }
  | { type: 'SET_DEBOUNCED_LOCATION'; payload: string }
  | { type: 'SET_MODAL_OPEN'; payload: boolean }
  | { type: 'TOGGLE_SAVED_JOB'; payload: string | number }
  | { type: 'RESET_SEARCH' };

// Initial state
const initialState: JobListState = {
  jobs: [],
  selectedJob: null,
  query: '',
  location: '',
  searchQuery: '',
  searchLocation: '',
  fetchState: createAsyncState(),
  fetched: false,
  page: 1,
  totalPages: 1,
  debouncedQuery: '',
  debouncedLocation: '',
  modalOpen: false,
  savedJobs: [],
};

// Reducer function
function jobListReducer(
  state: JobListState,
  action: JobListAction
): JobListState {
  switch (action.type) {
    case 'SET_JOBS':
      return { ...state, jobs: action.payload };
    case 'SET_SELECTED_JOB':
      return { ...state, selectedJob: action.payload };
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    case 'SET_LOCATION':
      return { ...state, location: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SEARCH_LOCATION':
      return { ...state, searchLocation: action.payload };
    case 'SET_FETCH_STATE':
      return {
        ...state,
        fetchState: { ...state.fetchState, ...action.payload },
      };
    case 'SET_FETCHED':
      return { ...state, fetched: action.payload };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_TOTAL_PAGES':
      return { ...state, totalPages: action.payload };
    case 'SET_DEBOUNCED_QUERY':
      return { ...state, debouncedQuery: action.payload };
    case 'SET_DEBOUNCED_LOCATION':
      return { ...state, debouncedLocation: action.payload };
    case 'SET_MODAL_OPEN':
      return { ...state, modalOpen: action.payload };
    case 'TOGGLE_SAVED_JOB':
      return {
        ...state,
        savedJobs: state.savedJobs.includes(action.payload)
          ? state.savedJobs.filter(id => id !== action.payload)
          : [...state.savedJobs, action.payload],
      };
    case 'RESET_SEARCH':
      return {
        ...state,
        query: '',
        location: '',
        searchQuery: '',
        searchLocation: '',
        page: 1,
        jobs: [],
        selectedJob: null,
        fetched: false,
        fetchState: createAsyncState(),
      };
    default:
      return state;
  }
}

export default function JobBoard() {
  const [state, dispatch] = useReducer(jobListReducer, initialState);
  const [isAuthenticated] = useState(false); // This would come from your auth context
  const pageSize = 20;
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce searchQuery and searchLocation
  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch({ type: 'SET_DEBOUNCED_QUERY', payload: state.searchQuery });
      dispatch({
        type: 'SET_DEBOUNCED_LOCATION',
        payload: state.searchLocation,
      });
    }, 500); // 500ms debounce
    return () => clearTimeout(handler);
  }, [state.searchQuery, state.searchLocation]);

  const fetchJobs = async (isRetry: boolean = false) => {
    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    dispatch({
      type: 'SET_FETCH_STATE',
      payload: {
        isLoading: true,
        hasError: false,
        errorMessage: null,
        attemptCount: isRetry ? state.fetchState.attemptCount + 1 : 1,
      },
    });

    try {
      const response = await withTimeout(
        fetch(
          `/api/jobs?query=${encodeURIComponent(state.debouncedQuery)}&location=${encodeURIComponent(state.debouncedLocation)}&page=${state.page}&pageSize=${pageSize}`,
          { signal: controller.signal }
        ),
        30000, // 30 second timeout
        'Request timed out. Please check your connection and try again.'
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `Server error (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Validate response structure
      if (!Array.isArray(data.jobs)) {
        throw new Error('Invalid response format from server');
      }

      dispatch({ type: 'SET_JOBS', payload: data.jobs || [] });
      dispatch({
        type: 'SET_TOTAL_PAGES',
        payload: Math.max(1, Math.ceil((data.total || 0) / pageSize)),
      });
      dispatch({ type: 'SET_FETCH_STATE', payload: createAsyncState() });
      dispatch({ type: 'SET_FETCHED', payload: true });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Ignore aborted requests
        return;
      }

      console.error('Job fetch error:', err);

      // Handle different error types
      let errorType: AsyncOperationState['errorType'] = 'error';
      let errorMessage = 'Failed to load jobs. Please try again.';

      if (err instanceof Error) {
        if (
          err.message.includes('timed out') ||
          err.message.includes('timeout')
        ) {
          errorType = 'timeout';
          errorMessage =
            'Request timed out. Please check your connection and try again.';
        } else if (
          err.message.includes('fetch') ||
          err.message.includes('network')
        ) {
          errorType = 'network';
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }

      dispatch({ type: 'SET_JOBS', payload: [] });
      dispatch({
        type: 'SET_FETCH_STATE',
        payload: {
          ...state.fetchState,
          isLoading: false,
          hasError: true,
          errorMessage,
          errorType,
          canRetry: state.fetchState.attemptCount < state.fetchState.maxRetries,
        },
      });
    }
  };

  const retryFetch = async () => {
    if (state.fetchState.canRetry && !state.fetchState.isLoading) {
      await fetchJobs(true);
    }
  };

  useEffect(() => {
    // Only fetch if debounced values change (not on every keystroke)
    if (state.debouncedQuery !== '' || state.debouncedLocation !== '') {
      fetchJobs();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [state.debouncedQuery, state.debouncedLocation, state.page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: 'SET_SEARCH_QUERY', payload: state.query });
    dispatch({ type: 'SET_SEARCH_LOCATION', payload: state.location });
    dispatch({ type: 'SET_PAGE', payload: 1 }); // Reset to first page on new search
  }

  // Enhanced modal handlers
  const handleViewDetails = (job: JobWithOptionalFields) => {
    // Navigate to job detail page instead of opening modal
    if (job.id) {
      window.location.href = `/jobs/${job.id}`;
    }
  };

  const handleCloseModal = () => {
    dispatch({ type: 'SET_MODAL_OPEN', payload: false });
    // Keep selectedJob for the right panel, just close the modal
  };

  const handleSaveJob = async (jobId: string | number) => {
    try {
      const isSaved = state.savedJobs.includes(jobId);

      const response = await fetch('/api/profile/saved-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: jobId.toString(),
          action: isSaved ? 'unsave' : 'save',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save job');
      }

      // Update local state on success
      dispatch({ type: 'TOGGLE_SAVED_JOB', payload: jobId });
    } catch (error) {
      console.error('Error saving job:', error);
      throw error; // Re-throw to be handled by the component
    }
  };

  const handleModalSave = async () => {
    if (state.selectedJob) {
      await handleSaveJob(state.selectedJob.id);
    }
  };

  const handleModalShare = async () => {
    console.log('Sharing job:', state.selectedJob?.title);
  };

  const handleModalApply = async () => {
    console.log('Applying to job:', state.selectedJob?.title);
  };

  return (
    <div className="flex h-screen w-full flex-col lg:flex-row">
      {/* Left: Search + Jobs */}
      <div className="overflow-y-auto bg-gradient-to-b from-purple-50 to-white p-6 lg:w-[35%]">
        <form
          onSubmit={handleSearch}
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
            value={state.query}
            onChange={e =>
              dispatch({ type: 'SET_QUERY', payload: e.target.value })
            }
            aria-label="Job title or keyword"
            disabled={state.fetchState.isLoading}
          />
          <label htmlFor="location-search" className="sr-only">
            Location
          </label>
          <input
            type="text"
            id="location-search"
            placeholder="Location"
            className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 md:w-1/3"
            value={state.location}
            onChange={e =>
              dispatch({ type: 'SET_LOCATION', payload: e.target.value })
            }
            aria-label="Location"
            disabled={state.fetchState.isLoading}
          />
          <button
            className="flex min-w-[100px] items-center justify-center rounded-lg bg-purple-700 px-5 py-3 text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            aria-label="Search for jobs"
            disabled={state.fetchState.isLoading}
          >
            {state.fetchState.isLoading ? (
              <LoadingSpinner size="sm" variant="spinner" color="white" />
            ) : (
              'Search'
            )}
          </button>
        </form>

        {/* Loading State */}
        {state.fetchState.isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner
              size="lg"
              variant="spinner"
              color="primary"
              message="Loading jobs..."
            />
          </div>
        )}

        {/* Error State */}
        {state.fetchState.hasError && (
          <div className="mb-6">
            <ErrorDisplay
              error={state.fetchState.errorMessage}
              type={state.fetchState.errorType}
              size="md"
              variant="card"
              canRetry={state.fetchState.canRetry}
              onRetry={retryFetch}
              maxRetries={state.fetchState.maxRetries}
              currentAttempt={state.fetchState.attemptCount}
              retryLabel="Retry Search"
            />
          </div>
        )}

        {/* Empty State */}
        {!state.fetchState.isLoading &&
          !state.fetchState.hasError &&
          state.fetched &&
          state.jobs.length === 0 && (
            <div className="mt-16 flex flex-col items-center justify-center">
              <svg
                className="mb-4 h-24 w-24 text-purple-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 48 48"
              >
                <rect x="8" y="16" width="32" height="20" rx="4" />
                <path d="M16 16v-2a8 8 0 0116 0v2" />
                <path d="M24 28v4" />
                <circle cx="24" cy="34" r="2" />
              </svg>
              <div className="text-center text-lg text-gray-500">
                <p className="font-medium">No jobs found</p>
                <p className="mt-1 text-sm">
                  Try adjusting your search criteria or check back later
                </p>
              </div>
            </div>
          )}

        {/* Job Cards */}
        {!state.fetchState.isLoading && !state.fetchState.hasError && (
          <div
            role="list"
            aria-label={`${state.jobs.length} job${state.jobs.length !== 1 ? 's' : ''} found`}
          >
            {state.jobs.map((job, index) => (
              <div key={job.id} role="listitem">
                {/* Insert sponsored search ad after every 3rd job */}
                {index === 2 && (
                  <div className="mb-4">
                    <AdDisplay
                      placement="search"
                      maxAds={1}
                      userLocation={state.location}
                    />
                  </div>
                )}

                <div className="mb-4">
                  <JobCard
                    {...job}
                    type={job.type || 'full_time'} // Handle both field names
                    applyUrl={job.url || `/jobs/${job.id}`}
                    onClick={() =>
                      dispatch({ type: 'SET_SELECTED_JOB', payload: job })
                    }
                    isSelected={state.selectedJob?.id === job.id}
                    onViewDetails={() => handleViewDetails(job)}
                    onSave={() => handleSaveJob(job.id)}
                    saved={state.savedJobs.includes(job.id)}
                    aria-label={`Job ${index + 1} of ${state.jobs.length}: ${job.title} at ${job.company}`}
                  />
                </div>

                {/* Insert featured ad after every 6th job */}
                {index === 5 && (
                  <div className="mb-4">
                    <AdDisplay
                      placement="featured"
                      maxAds={1}
                      userLocation={state.location}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!state.fetchState.isLoading && state.jobs.length > 0 && (
          <div className="mb-4 mt-6 flex justify-center">
            <nav
              className="flex items-center gap-2"
              aria-label="Job search pagination"
            >
              <button
                onClick={() =>
                  dispatch({
                    type: 'SET_PAGE',
                    payload: Math.max(1, state.page - 1),
                  })
                }
                disabled={state.page === 1 || state.fetchState.isLoading}
                className="rounded border px-3 py-1 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Go to previous page (currently on page ${state.page})`}
              >
                Previous
              </button>
              <span className="px-3 text-sm text-gray-600" aria-current="page">
                Page {state.page} of {state.totalPages}
              </span>
              <button
                onClick={() =>
                  dispatch({
                    type: 'SET_PAGE',
                    payload: Math.min(state.totalPages, state.page + 1),
                  })
                }
                disabled={
                  state.page === state.totalPages || state.fetchState.isLoading
                }
                className="rounded border px-3 py-1 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Go to next page (currently on page ${state.page})`}
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Center: Job Details */}
      <div
        className="flex items-center justify-center overflow-y-auto bg-white p-6 lg:w-[45%]"
        role="main"
        aria-label="Job details"
      >
        {state.selectedJob ? (
          <div className="w-full max-w-2xl">
            <h2 id="job-details-title" className="mb-2 text-2xl font-bold">
              {state.selectedJob.title}
            </h2>
            <div className="mb-1 text-gray-600" aria-label="Company name">
              {state.selectedJob.company}
            </div>
            <div
              className="mb-4 text-sm text-gray-400"
              aria-label="Posted date"
            >
              Posted: {state.selectedJob.postedAt}
            </div>
            <div aria-labelledby="job-details-title">
              <h3 className="sr-only">Job Description</h3>
              <p className="whitespace-pre-wrap text-gray-700">
                {state.selectedJob.description}
              </p>
            </div>
            <div
              className="mt-6 flex gap-3"
              role="group"
              aria-label="Job actions"
            >
              <button
                onClick={() =>
                  state.selectedJob && handleViewDetails(state.selectedJob)
                }
                className="rounded-lg bg-purple-700 px-6 py-3 font-semibold text-white transition hover:bg-purple-800"
                aria-label={`View full details for ${state.selectedJob.title} at ${state.selectedJob.company}`}
              >
                View Full Details
              </button>
              <a
                href={state.selectedJob.applyUrl}
                className="inline-block rounded-lg border border-purple-200 bg-white px-6 py-3 font-semibold text-purple-700 transition hover:bg-purple-50"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Apply for ${state.selectedJob.title} at ${state.selectedJob.company} (opens in new tab)`}
              >
                Apply Now
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center" role="status" aria-live="polite">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8"
              />
            </svg>
            <p className="italic text-gray-400">Select a job to view details</p>
          </div>
        )}
      </div>

      {/* Right: Sidebar Ads */}
      <div className="overflow-y-auto border-l border-gray-200 bg-gray-50 p-4 lg:w-[20%]">
        <div className="space-y-6">
          {/* Sidebar Ads */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500">
              Featured Businesses
            </h3>
            <AdDisplay
              placement="sidebar"
              maxAds={3}
              userLocation={state.location}
              className="space-y-4"
            />
          </div>

          {/* Native Ads */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-500">
              Recommended
            </h3>
            <AdDisplay
              placement="native"
              maxAds={2}
              userLocation={state.location}
              className="space-y-3"
            />
          </div>

          {/* Banner Ad */}
          <div>
            <AdDisplay
              placement="banner"
              maxAds={1}
              userLocation={state.location}
            />
          </div>
        </div>
      </div>

      {/* Job modal removed for production - using simple job cards instead */}
    </div>
  );
}
