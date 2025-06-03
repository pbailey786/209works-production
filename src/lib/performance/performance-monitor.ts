export interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  navigationType?: string;
}

export interface WebVitalsMetrics {
  CLS?: PerformanceMetrics;
  FID?: PerformanceMetrics;
  FCP?: PerformanceMetrics;
  LCP?: PerformanceMetrics;
  TTFB?: PerformanceMetrics;
  INP?: PerformanceMetrics;
}

// Core Web Vitals thresholds
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function reportWebVitals(metric: PerformanceMetrics) {
  const { name, value, id } = metric;

  // Add rating based on thresholds
  const enhancedMetric = {
    ...metric,
    rating: getRating(name, value),
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}:`, enhancedMetric);
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // Send to your analytics service
    sendToAnalytics(enhancedMetric);
  }

  // Store in session storage for debugging
  if (typeof window !== 'undefined') {
    const existingMetrics = JSON.parse(
      sessionStorage.getItem('webVitals') || '{}'
    );
    existingMetrics[name] = enhancedMetric;
    sessionStorage.setItem('webVitals', JSON.stringify(existingMetrics));
  }
}

function sendToAnalytics(metric: PerformanceMetrics) {
  // Send to your preferred analytics service
  // Example: Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(
        metric.name === 'CLS' ? metric.value * 1000 : metric.value
      ),
      custom_map: {
        metric_rating: metric.rating,
      },
    });
  }

  // Example: Custom API endpoint
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metric),
  }).catch(error => {
    console.error('Failed to send web vitals:', error);
  });
}

// Performance observer for custom metrics
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor navigation timing
    this.observeNavigationTiming();

    // Monitor resource timing
    this.observeResourceTiming();

    // Monitor long tasks
    this.observeLongTasks();
  }

  private observeNavigationTiming() {
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;

            // Calculate custom metrics
            const metrics = {
              domContentLoaded:
                navEntry.domContentLoadedEventEnd -
                navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              firstByte: navEntry.responseStart - navEntry.requestStart,
              domInteractive:
                navEntry.domInteractive - (navEntry.activationStart || 0),
            };

            console.log('[Performance] Navigation Timing:', metrics);
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Navigation timing observation not supported');
    }
  }

  private observeResourceTiming() {
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;

            // Track slow resources
            const duration =
              resourceEntry.responseEnd - resourceEntry.requestStart;
            if (duration > 1000) {
              // Resources taking more than 1 second
              console.warn(
                `[Performance] Slow resource: ${resourceEntry.name} (${duration}ms)`
              );
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Resource timing observation not supported');
    }
  }

  private observeLongTasks() {
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            console.warn(
              `[Performance] Long task detected: ${entry.duration}ms`
            );
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Long task observation not supported');
    }
  }

  stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Utility functions for performance measurement
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();

  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    });
  } else {
    const duration = performance.now() - start;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    return result;
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
