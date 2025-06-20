import { NextRequest } from 'next/server';


export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories for better organization
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  RATE_LIMIT = 'rate_limit',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  USER_INPUT = 'user_input',
}

// Error context interface
export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
  sessionId?: string;
  timestamp?: string;
  environment?: string;
  version?: string;
  additionalData?: Record<string, any>;
}

// Performance metrics interface
export interface PerformanceMetrics {
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  databaseQueries?: number;
  cacheHits?: number;
  cacheMisses?: number;
  apiCalls?: number;
  cpuUsage?: number;
}

// Audit event interface
export interface AuditEvent {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  details?: Record<string, any>;
  changes?: {
    before?: any;
    after?: any;
  };
}

// Error monitoring service
export class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  // Initialize the monitoring service
  public initialize(): void {
    if (this.isInitialized) return;

    // Configure Sentry user context
    Sentry.withScope((scope: Sentry.Scope) => {
      scope.setTag('service', '209jobs');
      scope.setTag('environment', process.env.NODE_ENV || 'development');
      scope.setTag('version', process.env.npm_package_version || 'unknown');
    });

    this.isInitialized = true;
    console.log('✅ Error monitoring service initialized');
  }

  // Log an error with context
  public logError(
    error: Error | string,
    context: ErrorContext = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.SYSTEM
  ): void {
    try {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const errorStack = typeof error === 'string' ? undefined : error.stack;

      // Enhanced context
      const enhancedContext = {
        ...context,
        timestamp: context.timestamp || new Date().toISOString(),
        environment:
          context.environment || process.env.NODE_ENV || 'development',
        version:
          context.version || process.env.npm_package_version || 'unknown',
        category,
        severity,
      };

      // Log to console with structured format
      this.logToConsole('ERROR', errorMessage, enhancedContext, errorStack);

      // Send to Sentry
      this.sendToSentry(error, enhancedContext, severity, category);

      // Send to external logging service if configured
      this.sendToExternalLogger(
        'error',
        errorMessage,
        enhancedContext,
        errorStack
      );
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
      // Fallback logging
      console.error('Original error:', error);
    }
  }

  // Log performance issues
  public logPerformanceIssue(
    operation: string,
    metrics: PerformanceMetrics,
    context: ErrorContext = {},
    threshold?: number
  ): void {
    try {
      const duration = metrics.duration || 0;
      const defaultThreshold = threshold || 1000; // 1 second default

      if (duration > defaultThreshold) {
        const severity =
          duration > 5000 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;

        const performanceContext = {
          ...context,
          operation,
          metrics,
          threshold: defaultThreshold,
          category: ErrorCategory.PERFORMANCE,
          severity,
        };

        this.logToConsole(
          'PERFORMANCE',
          `Slow operation: ${operation} (${duration}ms)`,
          performanceContext
        );

        // Send to Sentry as performance issue
        Sentry.addBreadcrumb({
          message: `Slow operation: ${operation}`,
          level: 'warning',
          data: performanceContext,
        });

        this.sendToExternalLogger(
          'performance',
          `Slow operation: ${operation}`,
          performanceContext
        );
      }
    } catch (error) {
      console.error('Failed to log performance issue:', error);
    }
  }

  // Log audit events
  public logAuditEvent(event: AuditEvent): void {
    try {
      const auditContext = {
        ...event,
        timestamp: event.timestamp.toISOString(),
        category: 'audit',
        type: 'audit_event',
      };

      this.logToConsole(
        'AUDIT',
        `${event.action} on ${event.resource}`,
        auditContext
      );

      // Send to external logging service
      this.sendToExternalLogger(
        'audit',
        `${event.action} on ${event.resource}`,
        auditContext
      );

      // Add to Sentry as breadcrumb for context
      Sentry.addBreadcrumb({
        message: `Audit: ${event.action} on ${event.resource}`,
        level: event.success ? 'info' : 'warning',
        data: auditContext,
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  // Log security events
  public logSecurityEvent(
    event: string,
    context: ErrorContext = {},
    severity: ErrorSeverity = ErrorSeverity.HIGH
  ): void {
    try {
      const securityContext = {
        ...context,
        category: ErrorCategory.SECURITY,
        severity,
        timestamp: new Date().toISOString(),
      };

      this.logToConsole('SECURITY', event, securityContext);

      // Send to Sentry with high priority
      Sentry.captureMessage(event, {
        level: severity === ErrorSeverity.CRITICAL ? 'fatal' : 'error',
        tags: {
          category: ErrorCategory.SECURITY,
          severity,
        },
        extra: securityContext,
      });

      this.sendToExternalLogger('security', event, securityContext);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Set user context for all subsequent logs
  public setUserContext(user: {
    id: string;
    email?: string;
    role?: string;
  }): void {
    try {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.email,
      });

      Sentry.setTag('userRole', user.role || 'unknown');
    } catch (error) {
      console.error('Failed to set user context:', error);
    }
  }

  // Clear user context (e.g., on logout)
  public clearUserContext(): void {
    try {
      Sentry.setUser(null);
    } catch (error) {
      console.error('Failed to clear user context:', error);
    }
  }

  // Add breadcrumb for debugging
  public addBreadcrumb(
    message: string,
    data?: Record<string, any>,
    level: 'debug' | 'info' | 'warning' | 'error' = 'info'
  ): void {
    try {
      Sentry.addBreadcrumb({
        message,
        level,
        data,
        timestamp: Date.now() / 1000,
      });
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  // Private methods

  private logToConsole(
    level: string,
    message: string,
    context: any,
    stack?: string
  ): void {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      // Detailed logging in development
      console.group(`🔍 [${level}] ${message}`);
      console.log('Context:', JSON.stringify(context, null, 2));
      if (stack) {
        console.log('Stack:', stack);
      }
      console.groupEnd();
    } else {
      // Structured JSON logging in production
      const logEntry = {
        level,
        message,
        context,
        stack,
        timestamp: new Date().toISOString(),
      };
      console.log(JSON.stringify(logEntry));
    }
  }

  private sendToSentry(
    error: Error | string,
    context: any,
    severity: ErrorSeverity,
    category: ErrorCategory
  ): void {
    try {
      const sentryLevel = this.mapSeverityToSentryLevel(severity);

      if (typeof error === 'string') {
        Sentry.captureMessage(error, {
          level: sentryLevel,
          tags: {
            category,
            severity,
          },
          extra: context,
        });
      } else {
        Sentry.captureException(error, {
          level: sentryLevel,
          tags: {
            category,
            severity,
          },
          extra: context,
        });
      }
    } catch (sentryError) {
      console.error('Failed to send to Sentry:', sentryError);
    }
  }

  private sendToExternalLogger(
    type: string,
    message: string,
    context: any,
    stack?: string
  ): void {
    // This is where you would integrate with external logging services
    // like DataDog, LogRocket, New Relic, etc.

    if (process.env.NODE_ENV === 'production') {
      // Example integration points:

      // DataDog
      if (process.env.DATADOG_API_KEY) {
        // this.sendToDataDog(type, message, context, stack);
      }

      // LogRocket
      if (process.env.LOGROCKET_APP_ID) {
        // this.sendToLogRocket(type, message, context, stack);
      }

      // Custom webhook
      if (process.env.LOGGING_WEBHOOK_URL) {
        // this.sendToWebhook(type, message, context, stack);
      }
    }
  }

  private mapSeverityToSentryLevel(
    severity: ErrorSeverity
  ): Sentry.SeverityLevel {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'info';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.CRITICAL:
        return 'fatal';
      default:
        return 'error';
    }
  }
}

// Convenience functions for common error types
export const ErrorLogger = {
  // Database errors
  database: (error: Error, context: ErrorContext = {}) =>
    ErrorMonitoringService.getInstance().logError(
      error,
      context,
      ErrorSeverity.HIGH,
      ErrorCategory.DATABASE
    ),

  // API errors
  api: (error: Error, context: ErrorContext = {}) =>
    ErrorMonitoringService.getInstance().logError(
      error,
      context,
      ErrorSeverity.MEDIUM,
      ErrorCategory.EXTERNAL_API
    ),

  // Authentication errors
  auth: (error: Error | string, context: ErrorContext = {}) =>
    ErrorMonitoringService.getInstance().logError(
      error,
      context,
      ErrorSeverity.HIGH,
      ErrorCategory.AUTHENTICATION
    ),

  // Validation errors
  validation: (error: Error | string, context: ErrorContext = {}) =>
    ErrorMonitoringService.getInstance().logError(
      error,
      context,
      ErrorSeverity.LOW,
      ErrorCategory.VALIDATION
    ),

  // Security errors
  security: (error: Error | string, context: ErrorContext = {}) =>
    ErrorMonitoringService.getInstance().logSecurityEvent(
      typeof error === 'string' ? error : error.message,
      context,
      ErrorSeverity.CRITICAL
    ),

  // Performance issues
  performance: (
    operation: string,
    metrics: PerformanceMetrics,
    context: ErrorContext = {}
  ) =>
    ErrorMonitoringService.getInstance().logPerformanceIssue(
      operation,
      metrics,
      context
    ),

  // Business logic errors
  business: (error: Error | string, context: ErrorContext = {}) =>
    ErrorMonitoringService.getInstance().logError(
      error,
      context,
      ErrorSeverity.MEDIUM,
      ErrorCategory.BUSINESS_LOGIC
    ),
};

// Audit logger
export const AuditLogger = {
  log: (event: AuditEvent) =>
    ErrorMonitoringService.getInstance().logAuditEvent(event),

  // Common audit events
  userLogin: (
    userId: string,
    email: string,
    ipAddress: string,
    success: boolean
  ) =>
    ErrorMonitoringService.getInstance().logAuditEvent({
      action: 'user_login',
      resource: 'user',
      resourceId: userId,
      userId,
      userEmail: email,
      ipAddress,
      timestamp: new Date(),
      success,
    }),

  userLogout: (userId: string, email: string, ipAddress: string) =>
    ErrorMonitoringService.getInstance().logAuditEvent({
      action: 'user_logout',
      resource: 'user',
      resourceId: userId,
      userId,
      userEmail: email,
      ipAddress,
      timestamp: new Date(),
      success: true,
    }),

  dataAccess: (
    userId: string,
    resource: string,
    resourceId: string,
    ipAddress: string
  ) =>
    ErrorMonitoringService.getInstance().logAuditEvent({
      action: 'data_access',
      resource,
      resourceId,
      userId,
      ipAddress,
      timestamp: new Date(),
      success: true,
    }),

  dataModification: (
    userId: string,
    resource: string,
    resourceId: string,
    ipAddress: string,
    changes: { before?: any; after?: any }
  ) =>
    ErrorMonitoringService.getInstance().logAuditEvent({
      action: 'data_modification',
      resource,
      resourceId,
      userId,
      ipAddress,
      timestamp: new Date(),
      success: true,
      changes,
    }),
};

// Initialize the service
export const errorMonitor = ErrorMonitoringService.getInstance();

// Export for middleware integration
export function createErrorContext(
  req: NextRequest,
  additionalContext: Partial<ErrorContext> = {}
): ErrorContext {
  const clientIP = getClientIP(req);
  return {
    requestId: req.headers.get('x-request-id') || undefined,
    ipAddress: clientIP,
    userAgent: req.headers.get('user-agent') || undefined,
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };
}

// Helper function to get client IP from NextRequest
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}
