/**
 * Sentry Error Monitoring Configuration
 * Comprehensive error tracking and performance monitoring for 209 Works
 */

import * as Sentry from '@sentry/nextjs';

// Sentry configuration
export const sentryConfig = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  
  // Performance monitoring
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NETLIFY_BUILD_ID || 'development',
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      return event;
    }
    
    // Filter out known non-critical errors
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = error.message as string;
      
      // Skip common non-critical errors
      if (
        message.includes('ResizeObserver loop limit exceeded') ||
        message.includes('Non-Error promise rejection captured') ||
        message.includes('Network request failed') ||
        message.includes('Loading chunk')
      ) {
        return null;
      }
    }
    
    return event;
  },
  
  // Additional context
  initialScope: {
    tags: {
      component: '209-works',
      region: 'california',
    },
  },
};

// Initialize Sentry (call this in your app initialization)
export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init(sentryConfig);
    
    // Set user context from Clerk
    Sentry.setContext('app', {
      name: '209 Works',
      version: process.env.npm_package_version || '1.0.0',
    });
  }
}

// Custom error logging functions
export const ErrorLogger = {
  // Log application errors
  error(error: Error, context?: Record<string, any>) {
    console.error('Application Error:', error);
    
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setContext('error_context', context);
        }
        scope.setLevel('error');
        Sentry.captureException(error);
      });
    }
  },
  
  // Log API errors
  apiError(error: Error, request: {
    method: string;
    url: string;
    userId?: string;
    body?: any;
  }) {
    console.error('API Error:', error, request);
    
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setTag('error_type', 'api_error');
        scope.setContext('request', {
          method: request.method,
          url: request.url,
          userId: request.userId,
          hasBody: !!request.body,
        });
        scope.setLevel('error');
        Sentry.captureException(error);
      });
    }
  },
  
  // Log authentication errors
  authError(error: Error, context: {
    userId?: string;
    action: string;
    userAgent?: string;
    ip?: string;
  }) {
    console.error('Auth Error:', error, context);
    
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setTag('error_type', 'auth_error');
        scope.setContext('auth_context', context);
        scope.setLevel('warning');
        Sentry.captureException(error);
      });
    }
  },
  
  // Log payment errors
  paymentError(error: Error, context: {
    userId?: string;
    amount?: number;
    currency?: string;
    paymentMethod?: string;
    stripeError?: any;
  }) {
    console.error('Payment Error:', error, context);
    
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setTag('error_type', 'payment_error');
        scope.setContext('payment_context', {
          ...context,
          // Don't log sensitive payment data
          stripeError: context.stripeError ? {
            type: context.stripeError.type,
            code: context.stripeError.code,
            message: context.stripeError.message,
          } : undefined,
        });
        scope.setLevel('error');
        Sentry.captureException(error);
      });
    }
  },
  
  // Log JobsGPT errors
  jobsGPTError(error: Error, context: {
    userId?: string;
    query?: string;
    model?: string;
    tokens?: number;
  }) {
    console.error('JobsGPT Error:', error, context);
    
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setTag('error_type', 'jobsgpt_error');
        scope.setContext('ai_context', {
          ...context,
          // Truncate query for privacy
          query: context.query ? context.query.substring(0, 100) + '...' : undefined,
        });
        scope.setLevel('error');
        Sentry.captureException(error);
      });
    }
  },
  
  // Log security events
  security(message: string, context: {
    userId?: string;
    ip?: string;
    userAgent?: string;
    action: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    blocked?: boolean;
  }) {
    console.warn('Security Event:', message, context);
    
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setTag('event_type', 'security_event');
        scope.setTag('security_severity', context.severity);
        scope.setContext('security_context', context);
        scope.setLevel(context.severity === 'critical' ? 'fatal' : 
                      context.severity === 'high' ? 'error' : 'warning');
        Sentry.captureMessage(message);
      });
    }
  },
  
  // Log performance issues
  performance(message: string, metrics: {
    duration: number;
    endpoint?: string;
    userId?: string;
    query?: string;
    dbQueries?: number;
  }) {
    if (metrics.duration > 5000) { // Log slow operations > 5s
      console.warn('Performance Issue:', message, metrics);
      
      if (process.env.SENTRY_DSN) {
        Sentry.withScope((scope) => {
          scope.setTag('event_type', 'performance_issue');
          scope.setContext('performance_context', metrics);
          scope.setLevel('warning');
          Sentry.captureMessage(message);
        });
      }
    }
  },
};

// Performance monitoring utilities
export const PerformanceMonitor = {
  // Start timing an operation
  startTimer(operation: string) {
    return {
      operation,
      startTime: Date.now(),
      
      // End timing and log if slow
      end(context?: Record<string, any>) {
        const duration = Date.now() - this.startTime;
        
        if (duration > 1000) { // Log operations > 1s
          ErrorLogger.performance(`Slow ${operation}`, {
            duration,
            ...context,
          });
        }
        
        return duration;
      },
    };
  },
  
  // Measure database query performance
  measureQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const timer = this.startTimer(`database_query_${queryName}`);
    
    return queryFn()
      .then((result) => {
        timer.end({ queryName, success: true });
        return result;
      })
      .catch((error) => {
        timer.end({ queryName, success: false, error: error.message });
        throw error;
      });
  },
  
  // Measure API endpoint performance
  measureAPI<T>(endpoint: string, apiFn: () => Promise<T>): Promise<T> {
    const timer = this.startTimer(`api_endpoint_${endpoint}`);
    
    return apiFn()
      .then((result) => {
        timer.end({ endpoint, success: true });
        return result;
      })
      .catch((error) => {
        timer.end({ endpoint, success: false, error: error.message });
        throw error;
      });
  },
};

// User context utilities
export const UserContext = {
  // Set user context for error tracking
  setUser(user: {
    id: string;
    email?: string;
    role?: string;
    region?: string;
  }) {
    if (process.env.SENTRY_DSN) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
        region: user.region,
      });
    }
  },
  
  // Clear user context (on logout)
  clearUser() {
    if (process.env.SENTRY_DSN) {
      Sentry.setUser(null);
    }
  },
  
  // Add breadcrumb for user actions
  addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    if (process.env.SENTRY_DSN) {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
        timestamp: Date.now() / 1000,
      });
    }
  },
};

// Export Sentry for direct use if needed
export { Sentry };
