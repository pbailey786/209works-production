import { NextRequest } from 'next/server';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Request log entry interface
export interface RequestLogEntry {
  requestId: string;
  timestamp: string;
  method: string;
  url: string;
  path: string;
  userAgent?: string;
  ip: string;
  userId?: string;
  userRole?: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: any;
  statusCode?: number;
  responseTime?: number;
  responseSize?: number;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  level: LogLevel;
}

// Performance metrics
export interface PerformanceMetrics {
  requestId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  databaseQueries?: number;
  cacheHits?: number;
  cacheMisses?: number;
}

// In-memory performance tracking (in production, use Redis or similar)
const performanceMetrics = new Map<string, PerformanceMetrics>();

// Logger utility
class APILogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(entry: RequestLogEntry): string {
    if (this.isDevelopment) {
      return this.formatDevelopmentLog(entry);
    }
    return JSON.stringify(entry);
  }

  private formatDevelopmentLog(entry: RequestLogEntry): string {
    const { method, path, statusCode, responseTime, userId, error } = entry;
    const userInfo = userId ? ` [User: ${userId}]` : '';
    const timeInfo = responseTime ? ` (${responseTime}ms)` : '';
    const errorInfo = error ? ` ERROR: ${error.message}` : '';

    return `${method} ${path}${userInfo} -> ${statusCode}${timeInfo}${errorInfo}`;
  }

  private getLogLevel(statusCode?: number, error?: any): LogLevel {
    if (error) return LogLevel.ERROR;
    if (statusCode && statusCode >= 500) return LogLevel.ERROR;
    if (statusCode && statusCode >= 400) return LogLevel.WARN;
    return LogLevel.INFO;
  }

  log(entry: RequestLogEntry): void {
    const logString = this.formatLog(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) console.debug(logString);
        break;
      default:
        console.log(logString);
    }

    // In production, you might want to send logs to external service
    // this.sendToExternalLogger(entry);
  }

  // Future: Send to external logging service (DataDog, LogRocket, etc.)
  private sendToExternalLogger(entry: RequestLogEntry): void {
    // Implementation for external logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to your logging service
      // await loggingService.send(entry);
    }
  }
}

const logger = new APILogger();

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

// Extract request information
function extractRequestInfo(
  req: NextRequest,
  requestId: string
): Partial<RequestLogEntry> {
  const url = new URL(req.url);
  const headers: Record<string, string> = {};

  // Extract relevant headers (avoid logging sensitive data)
  const safeHeaders = [
    'user-agent',
    'accept',
    'accept-language',
    'content-type',
    'content-length',
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
  ];

  safeHeaders.forEach(headerName => {
    const value = req.headers.get(headerName);
    if (value) {
      headers[headerName] = value;
    }
  });

  // Extract query parameters
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    path: url.pathname,
    userAgent: req.headers.get('user-agent') || undefined,
    ip: getClientIP(req),
    headers,
    query,
    level: LogLevel.INFO,
  };
}

// Start request logging
export function startRequestLogging(
  req: NextRequest,
  requestId: string,
  options?: {
    userId?: string;
    userRole?: string;
    includeBody?: boolean;
  }
): void {
  const requestInfo = extractRequestInfo(req, requestId);

  if (options?.userId) {
    requestInfo.userId = options.userId;
  }

  if (options?.userRole) {
    requestInfo.userRole = options.userRole;
  }

  // Start performance tracking
  const metrics: PerformanceMetrics = {
    requestId,
    startTime: Date.now(),
    memoryUsage: process.memoryUsage(),
  };

  performanceMetrics.set(requestId, metrics);

  // Log request start (in development)
  if (process.env.NODE_ENV === 'development') {
    logger.log({
      ...requestInfo,
      level: LogLevel.DEBUG,
    } as RequestLogEntry);
  }
}

// End request logging
export function endRequestLogging(
  requestId: string,
  statusCode: number,
  options?: {
    error?: any;
    responseSize?: number;
    additionalMetrics?: {
      databaseQueries?: number;
      cacheHits?: number;
      cacheMisses?: number;
    };
  }
): void {
  const metrics = performanceMetrics.get(requestId);
  if (!metrics) return;

  // Calculate performance metrics
  metrics.endTime = Date.now();
  metrics.duration = metrics.endTime - metrics.startTime;

  if (options?.additionalMetrics) {
    Object.assign(metrics, options.additionalMetrics);
  }

  // Create log entry
  const logEntry: RequestLogEntry = {
    requestId,
    timestamp: new Date().toISOString(),
    method: '', // These will be filled from stored request info if needed
    url: '',
    path: '',
    ip: '',
    headers: {},
    query: {},
    statusCode,
    responseTime: metrics.duration,
    responseSize: options?.responseSize,
    level: LogLevel.INFO,
  };

  // Add error information if present
  if (options?.error) {
    logEntry.error = {
      message: options.error.message || 'Unknown error',
      stack:
        process.env.NODE_ENV === 'development'
          ? options.error.stack
          : undefined,
      code: options.error.code || options.error.name,
    };
    logEntry.level = LogLevel.ERROR;
  } else {
    logEntry.level =
      statusCode >= 500
        ? LogLevel.ERROR
        : statusCode >= 400
          ? LogLevel.WARN
          : LogLevel.INFO;
  }

  logger.log(logEntry);

  // Clean up performance metrics
  performanceMetrics.delete(requestId);

  // Log performance warning for slow requests
  if (metrics.duration > 1000) {
    // More than 1 second
    logger.log({
      ...logEntry,
      level: LogLevel.WARN,
    });
  }
}

// Get current performance metrics
export function getPerformanceMetrics(
  requestId: string
): PerformanceMetrics | undefined {
  return performanceMetrics.get(requestId);
}

// Utility for database query tracking
export function trackDatabaseQuery(requestId: string): void {
  const metrics = performanceMetrics.get(requestId);
  if (metrics) {
    metrics.databaseQueries = (metrics.databaseQueries || 0) + 1;
  }
}

// Utility for cache tracking
export function trackCacheHit(requestId: string): void {
  const metrics = performanceMetrics.get(requestId);
  if (metrics) {
    metrics.cacheHits = (metrics.cacheHits || 0) + 1;
  }
}

export function trackCacheMiss(requestId: string): void {
  const metrics = performanceMetrics.get(requestId);
  if (metrics) {
    metrics.cacheMisses = (metrics.cacheMisses || 0) + 1;
  }
}

// Export logger for custom logging
export { logger };
