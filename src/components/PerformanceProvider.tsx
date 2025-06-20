import { useEffect } from 'react';

'use client';

  reportWebVitals,
  PerformanceMonitor,
} from '@/lib/performance/performance-monitor';

export default function PerformanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize performance monitoring
    const monitor = PerformanceMonitor.getInstance();
    monitor.startMonitoring();

    // Set up web vitals reporting
    if (typeof window !== 'undefined') {
      // Dynamic import to avoid SSR issues
      import('web-vitals')
        .then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
          onCLS(reportWebVitals);
          onFCP(reportWebVitals);
          onLCP(reportWebVitals);
          onTTFB(reportWebVitals);
          onINP(reportWebVitals);
        })
        .catch(() => {
          // Fallback if web-vitals is not available
          console.warn('Web Vitals library not available');
        });
    }

    return () => {
      monitor.stopMonitoring();
    };
  }, []);

  return <>{children}</>;
}
