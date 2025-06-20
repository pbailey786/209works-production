import { useState, useEffect, useRef } from '@/components/ui/card';
import { JobWithOptionalFields } from '@/lib/types/component-props';

interface UseJobSearchOptions {
  pageSize?: number;
  debounceDelay?: number;
}

interface UseJobSearchReturn {
  // State
  jobs: JobWithOptionalFields[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
  page: number;
  totalPages: number;
  query: string;
  location: string;
  searchQuery: string;
  searchLocation: string;

  // Actions
  setQuery: (query: string) => void;
  setLocation: (location: string) => void;
  setPage: (page: number) => void;
  handleSearch: (e: React.FormEvent) => void;
  refetch: () => void;
}

export function useJobSearch(
  options: UseJobSearchOptions = {}
): UseJobSearchReturn {
  const { pageSize = 20, debounceDelay = 500 } = options;

  // Search state
  const [jobs, setJobs] = useState<JobWithOptionalFields[]>([]);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounced values
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [debouncedLocation, setDebouncedLocation] = useState('');

  // Abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search terms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setDebouncedLocation(searchLocation);
    }, debounceDelay);

    return () => clearTimeout(handler);
  }, [searchQuery, searchLocation, debounceDelay]);

  // Fetch jobs when debounced values change
  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      setError(null);

      // Abort previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch(
          `/api/jobs?query=${encodeURIComponent(debouncedQuery)}&location=${encodeURIComponent(debouncedLocation)}&page=${page}&pageSize=${pageSize}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error(`Server responded with status ${res.status}`);
        }

        const data = await res.json();
        setJobs(data.jobs || []);
        setTotalPages(Math.max(1, Math.ceil((data.total || 0) / pageSize)));
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Ignore aborted requests
          return;
        }
        setJobs([]);
        setError(
          `Failed to load jobs: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        console.error('Job fetch error:', err);
      } finally {
        setLoading(false);
        setFetched(true);
      }
    }

    // Only fetch if debounced values change (not on every keystroke)
    if (debouncedQuery !== '' || debouncedLocation !== '') {
      fetchJobs();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, debouncedLocation, page, pageSize]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
    setSearchLocation(location);
    setPage(1); // Reset to first page on new search
  };

  const refetch = () => {
    setSearchQuery(query);
    setSearchLocation(location);
  };

  return {
    // State
    jobs,
    loading,
    error,
    fetched,
    page,
    totalPages,
    query,
    location,
    searchQuery,
    searchLocation,

    // Actions
    setQuery,
    setLocation,
    setPage,
    handleSearch,
    refetch,
  };
}
