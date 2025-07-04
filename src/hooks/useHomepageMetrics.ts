/**
 * Homepage Metrics Hook
 * 
 * Client-side hook to fetch real-time metrics for social proof
 * Handles loading states and fallbacks gracefully
 */

import { useState, useEffect } from 'react';

interface HomepageMetrics {
  activeJobs: number;
  recentHires: number;
  localCompanyPercentage: number;
  lastUpdated: Date;
}

interface UseHomepageMetricsReturn {
  metrics: HomepageMetrics;
  isLoading: boolean;
  error: string | null;
}

export function useHomepageMetrics(): UseHomepageMetricsReturn {
  const [metrics, setMetrics] = useState<HomepageMetrics>({
    activeJobs: 47,
    recentHires: 12,
    localCompanyPercentage: 95,
    lastUpdated: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/homepage-metrics');
        const result = await response.json();
        
        if (result.success && result.data) {
          setMetrics({
            ...result.data,
            lastUpdated: new Date(result.data.lastUpdated)
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch homepage metrics:', err);
        setError('Failed to load metrics');
        // Keep fallback values in metrics state
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  return { metrics, isLoading, error };
}