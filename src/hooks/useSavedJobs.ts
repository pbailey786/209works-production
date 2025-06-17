import { useState, useCallback } from 'react';

interface UseSavedJobsReturn {
  savedJobs: (string | number)[];
  isSaved: (jobId: string | number) => boolean;
  toggleSaveJob: (jobId: string | number) => void;
  saveJob: (jobId: string | number) => void;
  unsaveJob: (jobId: string | number) => void;
  clearSavedJobs: () => void;
}

export function useSavedJobs(
  initialSavedJobs: (string | number)[] = []
): UseSavedJobsReturn {
  const [savedJobs, setSavedJobs] =
    useState<(string | number)[]>(initialSavedJobs);

  const isSaved = useCallback(
    (jobId: string | number): boolean => {
      return savedJobs.includes(jobId);
    },
    [savedJobs]
  );

  const toggleSaveJob = useCallback((jobId: string | number) => {
    setSavedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  }, []);

  const saveJob = useCallback((jobId: string | number) => {
    setSavedJobs(prev => (prev.includes(jobId) ? prev : [...prev, jobId]));
  }, []);

  const unsaveJob = useCallback((jobId: string | number) => {
    setSavedJobs(prev => prev.filter(id => id !== jobId));
  }, []);

  const clearSavedJobs = useCallback(() => {
    setSavedJobs([]);
  }, []);

  return {
    savedJobs,
    isSaved,
    toggleSaveJob,
    saveJob,
    unsaveJob,
    clearSavedJobs,
  };
}
