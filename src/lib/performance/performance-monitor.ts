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

// Enhanced Performance Tracking for Database and API Operations
export interface DatabaseMetric {
  query: string;
  duration: number;
  rowsAffected: number;
  cacheHit: boolean;
  region: string;
  timestamp: Date;
}

export interface APIMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  region: string;
  timestamp: Date;
}

export class EnhancedPerformanceTracker {
  private static dbMetrics: DatabaseMetric[] = [];
  private static apiMetrics: APIMetric[] = [];
  private static readonly MAX_METRICS = 1000;
  private static readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private static readonly SLOW_API_THRESHOLD = 2000; // 2 seconds

  /**
   * Track database query performance
   */
  static trackDatabaseQuery(metric: Omit<DatabaseMetric, 'timestamp'>) {
    const fullMetric: DatabaseMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.dbMetrics.push(fullMetric);
    this.trimMetrics(this.dbMetrics);

    // Log slow queries
    if (metric.duration > this.SLOW_QUERY_THRESHOLD) {
      console.warn(`🐌 Slow Query: ${metric.query.substring(0, 50)}... took ${metric.duration}ms in ${metric.region}`);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendDatabaseMetricToAnalytics(fullMetric);
    }
  }

  /**
   * Track API endpoint performance
   */
  static trackAPICall(metric: Omit<APIMetric, 'timestamp'>) {
    const fullMetric: APIMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.apiMetrics.push(fullMetric);
    this.trimMetrics(this.apiMetrics);

    // Log slow APIs
    if (metric.duration > this.SLOW_API_THRESHOLD) {
      console.warn(`🐌 Slow API: ${metric.method} ${metric.endpoint} took ${metric.duration}ms in ${metric.region}`);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendAPIMetricToAnalytics(fullMetric);
    }
  }

  /**
   * Get performance summary
   */
  static getPerformanceSummary(region?: string) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentDbMetrics = this.dbMetrics.filter(m =>
      m.timestamp >= oneHourAgo && (!region || m.region === region)
    );

    const recentApiMetrics = this.apiMetrics.filter(m =>
      m.timestamp >= oneHourAgo && (!region || m.region === region)
    );

    return {
      database: {
        totalQueries: recentDbMetrics.length,
        averageDuration: this.calculateAverage(recentDbMetrics.map(m => m.duration)),
        slowQueries: recentDbMetrics.filter(m => m.duration > this.SLOW_QUERY_THRESHOLD).length,
        cacheHitRate: this.calculateCacheHitRate(recentDbMetrics),
      },
      api: {
        totalCalls: recentApiMetrics.length,
        averageDuration: this.calculateAverage(recentApiMetrics.map(m => m.duration)),
        slowCalls: recentApiMetrics.filter(m => m.duration > this.SLOW_API_THRESHOLD).length,
        errorRate: this.calculateErrorRate(recentApiMetrics),
      },
      region: region || 'all',
      timestamp: now,
    };
  }

  private static trimMetrics<T>(metrics: T[]) {
    if (metrics.length > this.MAX_METRICS) {
      metrics.splice(0, metrics.length - this.MAX_METRICS);
    }
  }

  private static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  }

  private static calculateCacheHitRate(metrics: DatabaseMetric[]): number {
    if (metrics.length === 0) return 0;
    const hits = metrics.filter(m => m.cacheHit).length;
    return Math.round((hits / metrics.length) * 100);
  }

  private static calculateErrorRate(metrics: APIMetric[]): number {
    if (metrics.length === 0) return 0;
    const errors = metrics.filter(m => m.statusCode >= 400).length;
    return Math.round((errors / metrics.length) * 100);
  }

  private static sendDatabaseMetricToAnalytics(metric: DatabaseMetric) {
    // Send to your analytics service
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'database', ...metric }),
    }).catch(console.error);
  }

  private static sendAPIMetricToAnalytics(metric: APIMetric) {
    // Send to your analytics service
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'api', ...metric }),
    }).catch(console.error);
  }
}

/**
 * Performance decorator for automatic tracking
 */
export function TrackPerformance(metricName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        // Track as database query if it looks like a database operation
        if (name.toLowerCase().includes('query') || name.toLowerCase().includes('find') || name.toLowerCase().includes('create')) {
          EnhancedPerformanceTracker.trackDatabaseQuery({
            query: name,
            duration,
            rowsAffected: Array.isArray(result) ? result.length : 1,
            cacheHit: duration < 50, // Assume cache hit if very fast
            region: '209', // Default region
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`Performance tracking error in ${name}:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}
