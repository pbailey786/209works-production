/**
 * Performance Monitoring Service
 * Comprehensive performance tracking for job board platform
 */

'use client';

import { usePostHog } from '@/lib/analytics/posthog-provider';

// Performance Metric Types
export interface CoreWebVitals {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte

  // Additional Performance Metrics
  domContentLoaded: number;
  loadComplete: number;
  navigationTiming: PerformanceNavigationTiming | null;

  // Page-specific metrics
  pageLoadTime: number;
  renderTime: number;
  interactionTime: number;
}

export interface APIPerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  size: number;
  timestamp: number;
  success: boolean;
  errorMessage?: string;
  retryCount?: number;
}

export interface SystemHealthMetric {
  // Memory Usage
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };

  // Network Performance
  networkInfo: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };

  // Device Information
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    cookieEnabled: boolean;
    onLine: boolean;
    hardwareConcurrency: number;
  };

  // Browser Performance
  browserPerformance: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };

  timestamp: number;
}

export interface UserExperienceMetric {
  // User Interaction Metrics
  timeToInteractive: number;
  firstInputDelay: number;
  totalBlockingTime: number;

  // Page Performance
  pageViews: number;
  bounceRate: number;
  sessionDuration: number;

  // Error Tracking
  jsErrors: number;
  networkErrors: number;
  renderErrors: number;

  // User Satisfaction
  performanceScore: number;
  userSatisfactionScore: number;

  timestamp: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  resolved: boolean;
}

/**
 * Performance Monitor Hook
 * Provides comprehensive performance tracking and monitoring
 */
export function usePerformanceMonitor() {
  const { trackEvent, isInitialized } = usePostHog();

  // Track Core Web Vitals
  const trackCoreWebVitals = (): Promise<CoreWebVitals> => {
    return new Promise(resolve => {
      if (typeof window === 'undefined') {
        resolve({
          lcp: 0,
          fid: 0,
          cls: 0,
          fcp: 0,
          ttfb: 0,
          domContentLoaded: 0,
          loadComplete: 0,
          navigationTiming: null,
          pageLoadTime: 0,
          renderTime: 0,
          interactionTime: 0,
        });
        return;
      }

      const vitals: Partial<CoreWebVitals> = {};

      // Get Navigation Timing
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      vitals.navigationTiming = navigation;

      if (navigation) {
        vitals.ttfb = navigation.responseStart - navigation.requestStart;
        vitals.domContentLoaded =
          navigation.domContentLoadedEventEnd - navigation.startTime;
        vitals.loadComplete = navigation.loadEventEnd - navigation.startTime;
        vitals.pageLoadTime = navigation.loadEventEnd - navigation.startTime;
      }

      // Track Core Web Vitals using Performance Observer
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              vitals.lcp = entry.startTime;
              break;
            case 'first-input':
              vitals.fid = (entry as any).processingStart - entry.startTime;
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                vitals.cls = (vitals.cls || 0) + (entry as any).value;
              }
              break;
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime;
              }
              break;
          }
        }
      });

      // Observe different entry types
      try {
        observer.observe({
          entryTypes: [
            'largest-contentful-paint',
            'first-input',
            'layout-shift',
            'paint',
          ],
        });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }

      // Fallback measurements
      setTimeout(() => {
        const finalVitals: CoreWebVitals = {
          lcp: vitals.lcp || 0,
          fid: vitals.fid || 0,
          cls: vitals.cls || 0,
          fcp: vitals.fcp || 0,
          ttfb: vitals.ttfb || 0,
          domContentLoaded: vitals.domContentLoaded || 0,
          loadComplete: vitals.loadComplete || 0,
          navigationTiming: vitals.navigationTiming ?? null,
          pageLoadTime: vitals.pageLoadTime || 0,
          renderTime: performance.now(),
          interactionTime: 0,
        };

        resolve(finalVitals);
        observer.disconnect();
      }, 3000); // Wait 3 seconds for metrics to stabilize
    });
  };

  // Track API Performance
  const trackAPIPerformance = (
    endpoint: string,
    method: string,
    startTime: number,
    endTime: number,
    status: number,
    size: number = 0,
    errorMessage?: string,
    retryCount: number = 0
  ): APIPerformanceMetric => {
    const metric: APIPerformanceMetric = {
      endpoint,
      method,
      duration: endTime - startTime,
      status,
      size,
      timestamp: Date.now(),
      success: status >= 200 && status < 400,
      errorMessage,
      retryCount,
    };

    if (isInitialized) {
      trackEvent('api_performance', {
        endpoint: metric.endpoint,
        method: metric.method,
        duration: metric.duration,
        status: metric.status,
        success: metric.success,
        size: metric.size,
        retry_count: metric.retryCount,
        timestamp: new Date().toISOString(),
      });
    }

    return metric;
  };

  // Get System Health Metrics
  const getSystemHealthMetrics = (): SystemHealthMetric => {
    if (typeof window === 'undefined') {
      return {
        memoryUsage: { used: 0, total: 0, percentage: 0 },
        networkInfo: {
          effectiveType: 'unknown',
          downlink: 0,
          rtt: 0,
          saveData: false,
        },
        deviceInfo: {
          userAgent: '',
          platform: '',
          language: '',
          cookieEnabled: false,
          onLine: false,
          hardwareConcurrency: 0,
        },
        browserPerformance: {
          jsHeapSizeLimit: 0,
          totalJSHeapSize: 0,
          usedJSHeapSize: 0,
        },
        timestamp: Date.now(),
      };
    }

    // Memory Usage
    const memory = (performance as any).memory || {};
    const memoryUsage = {
      used: memory.usedJSHeapSize || 0,
      total: memory.totalJSHeapSize || 0,
      percentage: memory.totalJSHeapSize
        ? (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
        : 0,
    };

    // Network Information
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection ||
      {};
    const networkInfo = {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false,
    };

    // Device Information
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
    };

    // Browser Performance
    const browserPerformance = {
      jsHeapSizeLimit: memory.jsHeapSizeLimit || 0,
      totalJSHeapSize: memory.totalJSHeapSize || 0,
      usedJSHeapSize: memory.usedJSHeapSize || 0,
    };

    return {
      memoryUsage,
      networkInfo,
      deviceInfo,
      browserPerformance,
      timestamp: Date.now(),
    };
  };

  // Track User Experience Metrics
  const trackUserExperienceMetrics = (): UserExperienceMetric => {
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;

    const metric: UserExperienceMetric = {
      timeToInteractive: navigation
        ? navigation.domInteractive - navigation.startTime
        : 0,
      firstInputDelay: 0, // This would be tracked via Performance Observer
      totalBlockingTime: 0, // This would be calculated from long tasks
      pageViews: 1,
      bounceRate: 0, // This would be calculated based on session data
      sessionDuration: performance.now(),
      jsErrors: 0, // This would be tracked via error handlers
      networkErrors: 0, // This would be tracked via fetch/xhr monitoring
      renderErrors: 0, // This would be tracked via React error boundaries
      performanceScore: calculatePerformanceScore(),
      userSatisfactionScore: 0, // This would be calculated based on various factors
      timestamp: Date.now(),
    };

    if (isInitialized) {
      trackEvent('user_experience_metrics', {
        time_to_interactive: metric.timeToInteractive,
        performance_score: metric.performanceScore,
        session_duration: metric.sessionDuration,
        timestamp: new Date().toISOString(),
      });
    }

    return metric;
  };

  // Calculate Performance Score (0-100)
  const calculatePerformanceScore = (): number => {
    if (typeof window === 'undefined') return 100;

    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    if (!navigation) return 100;

    // Performance scoring based on Core Web Vitals thresholds
    let score = 100;

    // LCP scoring (good: <2.5s, needs improvement: 2.5-4s, poor: >4s)
    const lcp = navigation.loadEventEnd - navigation.startTime;
    if (lcp > 4000) score -= 30;
    else if (lcp > 2500) score -= 15;

    // FCP scoring (good: <1.8s, needs improvement: 1.8-3s, poor: >3s)
    const fcp = navigation.domContentLoadedEventEnd - navigation.startTime;
    if (fcp > 3000) score -= 25;
    else if (fcp > 1800) score -= 10;

    // TTFB scoring (good: <800ms, needs improvement: 800-1800ms, poor: >1800ms)
    const ttfb = navigation.responseStart - navigation.requestStart;
    if (ttfb > 1800) score -= 20;
    else if (ttfb > 800) score -= 10;

    // Memory usage scoring
    const memory = (performance as any).memory;
    if (memory && memory.totalJSHeapSize) {
      const memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
      if (memoryUsage > 0.8) score -= 15;
      else if (memoryUsage > 0.6) score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  };

  // Generate Performance Alerts
  const generatePerformanceAlerts = (
    vitals: CoreWebVitals,
    systemHealth: SystemHealthMetric,
    userExperience: UserExperienceMetric
  ): PerformanceAlert[] => {
    const alerts: PerformanceAlert[] = [];

    // LCP Alert
    if (vitals.lcp > 4000) {
      alerts.push({
        id: `lcp-${Date.now()}`,
        type: 'critical',
        metric: 'Largest Contentful Paint',
        value: vitals.lcp,
        threshold: 2500,
        message: `LCP of ${(vitals.lcp / 1000).toFixed(2)}s exceeds recommended threshold of 2.5s`,
        timestamp: Date.now(),
        resolved: false,
      });
    } else if (vitals.lcp > 2500) {
      alerts.push({
        id: `lcp-${Date.now()}`,
        type: 'warning',
        metric: 'Largest Contentful Paint',
        value: vitals.lcp,
        threshold: 2500,
        message: `LCP of ${(vitals.lcp / 1000).toFixed(2)}s needs improvement`,
        timestamp: Date.now(),
        resolved: false,
      });
    }

    // Memory Usage Alert
    if (systemHealth.memoryUsage.percentage > 80) {
      alerts.push({
        id: `memory-${Date.now()}`,
        type: 'critical',
        metric: 'Memory Usage',
        value: systemHealth.memoryUsage.percentage,
        threshold: 70,
        message: `Memory usage at ${systemHealth.memoryUsage.percentage.toFixed(1)}% is critically high`,
        timestamp: Date.now(),
        resolved: false,
      });
    } else if (systemHealth.memoryUsage.percentage > 70) {
      alerts.push({
        id: `memory-${Date.now()}`,
        type: 'warning',
        metric: 'Memory Usage',
        value: systemHealth.memoryUsage.percentage,
        threshold: 70,
        message: `Memory usage at ${systemHealth.memoryUsage.percentage.toFixed(1)}% is high`,
        timestamp: Date.now(),
        resolved: false,
      });
    }

    // Performance Score Alert
    if (userExperience.performanceScore < 50) {
      alerts.push({
        id: `performance-${Date.now()}`,
        type: 'critical',
        metric: 'Performance Score',
        value: userExperience.performanceScore,
        threshold: 70,
        message: `Performance score of ${userExperience.performanceScore} is critically low`,
        timestamp: Date.now(),
        resolved: false,
      });
    } else if (userExperience.performanceScore < 70) {
      alerts.push({
        id: `performance-${Date.now()}`,
        type: 'warning',
        metric: 'Performance Score',
        value: userExperience.performanceScore,
        threshold: 70,
        message: `Performance score of ${userExperience.performanceScore} needs improvement`,
        timestamp: Date.now(),
        resolved: false,
      });
    }

    return alerts;
  };

  // Monitor Page Performance
  const monitorPagePerformance = async (pageName: string) => {
    try {
      const vitals = await trackCoreWebVitals();
      const systemHealth = getSystemHealthMetrics();
      const userExperience = trackUserExperienceMetrics();
      const alerts = generatePerformanceAlerts(
        vitals,
        systemHealth,
        userExperience
      );

      if (isInitialized) {
        trackEvent('page_performance_monitored', {
          page_name: pageName,
          lcp: vitals.lcp,
          fcp: vitals.fcp,
          cls: vitals.cls,
          ttfb: vitals.ttfb,
          performance_score: userExperience.performanceScore,
          memory_usage_percentage: systemHealth.memoryUsage.percentage,
          network_type: systemHealth.networkInfo.effectiveType,
          alerts_count: alerts.length,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        vitals,
        systemHealth,
        userExperience,
        alerts,
      };
    } catch (error) {
      console.error('Performance monitoring error:', error);
      return null;
    }
  };

  // Create API Performance Wrapper
  const createAPIMonitor = () => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;
      const options = args[1] || {};
      const method = options.method || 'GET';

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();

        // Get response size if available
        const contentLength = response.headers.get('content-length');
        const size = contentLength ? parseInt(contentLength, 10) : 0;

        trackAPIPerformance(
          url,
          method,
          startTime,
          endTime,
          response.status,
          size
        );

        return response;
      } catch (error) {
        const endTime = performance.now();

        trackAPIPerformance(
          url,
          method,
          startTime,
          endTime,
          0,
          0,
          error instanceof Error ? error.message : 'Unknown error'
        );

        throw error;
      }
    };
  };

  // Initialize Performance Monitoring
  const initializePerformanceMonitoring = () => {
    if (typeof window === 'undefined') return;

    // Set up API monitoring
    createAPIMonitor();

    // Set up error tracking
    window.addEventListener('error', event => {
      if (isInitialized) {
        trackEvent('javascript_error', {
          message: event.message,
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error?.stack,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Set up unhandled promise rejection tracking
    window.addEventListener('unhandledrejection', event => {
      if (isInitialized) {
        trackEvent('unhandled_promise_rejection', {
          reason: event.reason?.toString(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (isInitialized) {
        trackEvent('page_visibility_change', {
          visibility_state: document.visibilityState,
          timestamp: new Date().toISOString(),
        });
      }
    });
  };

  return {
    // Core monitoring functions
    trackCoreWebVitals,
    trackAPIPerformance,
    getSystemHealthMetrics,
    trackUserExperienceMetrics,
    monitorPagePerformance,
    generatePerformanceAlerts,
    calculatePerformanceScore,

    // Setup functions
    initializePerformanceMonitoring,

    // State
    isInitialized,
  };
}
