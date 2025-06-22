# Comprehensive Error Monitoring and Logging System

## Overview

This document describes the comprehensive error monitoring and logging system implemented for the 209jobs application. The system provides centralized error handling, performance monitoring, database query tracking, and health monitoring capabilities.

## Architecture

### Core Components

1. **Error Monitoring Service** (`src/lib/monitoring/error-monitor.ts`)

   - Centralized error logging and categorization
   - Integration with Sentry for error tracking
   - Audit logging for security events
   - Performance issue detection

2. **Database Monitoring Service** (`src/lib/monitoring/database-monitor.ts`)

   - Query performance tracking
   - Slow query detection
   - Connection health monitoring
   - Database health reporting

3. **Health Monitoring Endpoint** (`src/app/api/health/monitoring/route.ts`)

   - System health status reporting
   - Performance metrics aggregation
   - Real-time health checks

4. **Enhanced API Middleware** (`src/lib/middleware/api.ts`)
   - Automatic error logging
   - Performance tracking
   - User context management
   - Request/response monitoring

## Features

### Error Monitoring

#### Error Categories

- **Authentication**: Login/logout failures, token issues
- **Authorization**: Permission denied, role violations
- **Validation**: Input validation failures, schema errors
- **Database**: Query failures, connection issues
- **External API**: Third-party service failures
- **Rate Limit**: Rate limiting violations
- **Security**: Suspicious activities, injection attempts
- **Performance**: Slow queries, high memory usage
- **Business Logic**: Application-specific errors
- **System**: Infrastructure failures
- **User Input**: Malformed requests

#### Error Severity Levels

- **LOW**: Minor issues, validation errors
- **MEDIUM**: Recoverable errors, performance warnings
- **HIGH**: Significant issues requiring attention
- **CRITICAL**: System-threatening issues requiring immediate action

#### Error Context

Each error is logged with comprehensive context:

```typescript
interface ErrorContext {
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
```

### Database Monitoring

#### Query Performance Tracking

- **Slow Query Detection**: Queries > 1 second (warning), > 5 seconds (error), > 10 seconds (critical)
- **Query Size Monitoring**: Large queries > 10KB
- **Result Set Tracking**: Monitor result counts and data volume
- **Operation Classification**: CREATE, READ, UPDATE, DELETE, AGGREGATE, BATCH

#### Connection Health

- **Connection Attempt Tracking**: Success/failure rates
- **Connection Pool Monitoring**: Active connections, pool utilization
- **Health Check Integration**: Automated health status reporting

#### Performance Metrics

```typescript
interface QueryMetrics {
  operation: string;
  model: string;
  duration: number;
  timestamp: Date;
  querySize: number;
  resultCount?: number;
  requestId?: string;
  userId?: string;
  isSlowQuery: boolean;
  isCriticalQuery: boolean;
}
```

### Health Monitoring

#### System Health Checks

- **Database Health**: Query performance, connection status
- **Memory Health**: Heap usage, memory leaks detection
- **Performance Health**: Response times, request rates
- **Error Health**: Error rates, critical error detection

#### Health Status Levels

- **Healthy**: All systems operating normally
- **Degraded**: Some performance issues detected
- **Unhealthy**: Critical issues requiring immediate attention

#### Health Metrics

```typescript
interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: { status: string; responseTime?: number; details: any };
    memory: { status: string; usage: NodeJS.MemoryUsage; details: any };
    errors: { status: string; details: any };
    performance: { status: string; details: any };
  };
  metrics: {
    requests: {
      total: number;
      successful: number;
      failed: number;
      averageResponseTime: number;
    };
    database: {
      totalQueries: number;
      slowQueries: number;
      averageQueryTime: number;
      connectionHealth: number;
    };
    memory: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    errors: {
      total: number;
      byCategory: Record<string, number>;
      bySeverity: Record<string, number>;
    };
  };
}
```

## Usage

### Error Logging

#### Basic Error Logging

```typescript
import { ErrorLogger } from '@/lib/monitoring/error-monitor';

// Database errors
ErrorLogger.database(error, context);

// API errors
ErrorLogger.api(error, context);

// Authentication errors
ErrorLogger.auth(error, context);

// Validation errors
ErrorLogger.validation(error, context);

// Security errors
ErrorLogger.security(error, context);

// Performance issues
ErrorLogger.performance(operation, metrics, context);

// Business logic errors
ErrorLogger.business(error, context);
```

#### Audit Logging

```typescript
import { AuditLogger } from '@/lib/monitoring/error-monitor';

// User login
AuditLogger.userLogin(userId, email, ipAddress, success);

// User logout
AuditLogger.userLogout(userId, email, ipAddress);

// Data access
AuditLogger.dataAccess(userId, resource, resourceId, ipAddress);

// Data modification
AuditLogger.dataModification(userId, resource, resourceId, ipAddress, changes);
```

### Database Monitoring

#### Automatic Monitoring

Database monitoring is automatically applied via Prisma middleware:

```typescript
import { createDatabaseMonitoringMiddleware } from '@/lib/monitoring/database-monitor';

// Applied automatically in prisma.ts
prisma.$use(createDatabaseMonitoringMiddleware());
```

#### Manual Query Tracking

```typescript
import { trackDatabaseQuery } from '@/lib/monitoring/database-monitor';

const startTime = Date.now();
const result = await someOperation();
const duration = Date.now() - startTime;

trackDatabaseQuery('findMany', 'User', duration, {
  requestId: context.requestId,
  userId: context.user?.id,
  resultCount: result.length,
});
```

### Health Monitoring

#### Health Check Endpoint

```
GET /api/health/monitoring
```

Returns comprehensive system health information including:

- Overall system status
- Individual component health
- Performance metrics
- Error statistics
- Database health
- Memory usage

#### Programmatic Health Checks

```typescript
import { getDatabaseHealthReport } from '@/lib/monitoring/database-monitor';

const healthReport = await getDatabaseHealthReport();
console.log('Database status:', healthReport.status);
```

### API Middleware Integration

The enhanced API middleware automatically:

- Logs all errors with context
- Tracks request performance
- Records metrics for health monitoring
- Sets user context for error tracking
- Monitors rate limit violations

```typescript
import { withAPIMiddleware, apiConfigs } from '@/lib/middleware/api';

export const POST = withAPIMiddleware(async (req, context) => {
  // Your handler code
  // Errors are automatically logged with context
  // Performance is automatically tracked
  // User context is automatically set
}, apiConfigs.authenticated);
```

## Configuration

### Environment Variables

```bash
# Sentry Configuration
SENTRY_DSN=your_sentry_dsn_here

# Logging Configuration
LOG_LEVEL=info
ENABLE_PERFORMANCE_LOGGING=true
SLOW_REQUEST_THRESHOLD=1000

# Monitoring Configuration
SKIP_RATE_LIMIT=false
ENABLE_SECURITY_HEADERS=true

# External Logging Services (optional)
DATADOG_API_KEY=your_datadog_key
LOGROCKET_APP_ID=your_logrocket_id
LOGGING_WEBHOOK_URL=your_webhook_url
```

### Performance Thresholds

```typescript
export const DB_PERFORMANCE_THRESHOLDS = {
  SLOW_QUERY_WARNING: 1000, // 1 second
  SLOW_QUERY_ERROR: 5000, // 5 seconds
  VERY_SLOW_QUERY_CRITICAL: 10000, // 10 seconds
  MAX_QUERY_SIZE: 10000, // Maximum query size to log
  CONNECTION_TIMEOUT: 30000, // 30 seconds
} as const;
```

## Integration with External Services

### Sentry Integration

- Automatic error reporting
- Performance monitoring
- Release tracking
- User context setting
- Custom tags and metadata

### Future Integrations

The system is designed to easily integrate with:

- **DataDog**: APM and logging
- **LogRocket**: Session replay and logging
- **New Relic**: Performance monitoring
- **Custom Webhooks**: Real-time alerting

## Monitoring Dashboard

### Key Metrics to Monitor

1. **Error Rates**

   - Total errors per hour/day
   - Error rate percentage
   - Critical errors count
   - Errors by category

2. **Performance Metrics**

   - Average response time
   - 95th percentile response time
   - Slow request count
   - Database query performance

3. **System Health**

   - Memory usage trends
   - Database connection health
   - Active user sessions
   - Request volume

4. **Security Metrics**
   - Rate limit violations
   - Authentication failures
   - Suspicious activity alerts
   - Security event frequency

### Alerting Thresholds

- **Critical**: Error rate > 10%, Critical errors > 0, System unhealthy
- **Warning**: Error rate > 5%, Slow queries > 10%, Memory usage > 75%
- **Info**: Performance degradation, High request volume

## Best Practices

### Error Handling

1. Always provide meaningful error messages
2. Include relevant context in error logs
3. Use appropriate error categories and severity levels
4. Don't log sensitive information (passwords, tokens)
5. Implement proper error boundaries

### Performance Monitoring

1. Set realistic performance thresholds
2. Monitor both individual queries and overall performance
3. Track trends over time
4. Optimize based on monitoring data
5. Use caching strategically

### Security Monitoring

1. Log all authentication events
2. Monitor for suspicious patterns
3. Track rate limit violations
4. Audit sensitive data access
5. Implement proper access controls

### Health Monitoring

1. Regular health checks
2. Proactive alerting
3. Trend analysis
4. Capacity planning
5. Incident response procedures

## Troubleshooting

### Common Issues

1. **High Memory Usage**

   - Check for memory leaks
   - Review query result sizes
   - Monitor garbage collection

2. **Slow Database Queries**

   - Review query patterns
   - Check database indexes
   - Optimize complex queries

3. **High Error Rates**

   - Review error logs by category
   - Check for external service issues
   - Validate input handling

4. **Performance Degradation**
   - Monitor resource usage
   - Check database performance
   - Review caching effectiveness

### Debugging Tools

1. **Health Monitoring Endpoint**: Real-time system status
2. **Sentry Dashboard**: Error tracking and analysis
3. **Database Query Logs**: Performance analysis
4. **Performance Metrics**: Trend analysis
5. **Audit Logs**: Security event tracking

## Maintenance

### Regular Tasks

1. **Weekly**

   - Review error trends
   - Check performance metrics
   - Validate alerting thresholds

2. **Monthly**

   - Analyze long-term trends
   - Update performance baselines
   - Review security events

3. **Quarterly**
   - Evaluate monitoring effectiveness
   - Update alerting rules
   - Plan capacity improvements

### Monitoring the Monitoring System

1. Ensure monitoring services are healthy
2. Validate alert delivery
3. Test error reporting
4. Verify metric accuracy
5. Monitor monitoring overhead

## Conclusion

This comprehensive monitoring system provides:

- **Visibility**: Complete insight into system behavior
- **Reliability**: Proactive issue detection and resolution
- **Performance**: Optimization opportunities identification
- **Security**: Threat detection and audit trails
- **Scalability**: Foundation for growth and improvement

The system is designed to be:

- **Extensible**: Easy to add new monitoring capabilities
- **Configurable**: Adaptable to different environments
- **Performant**: Minimal overhead on application performance
- **Reliable**: Robust error handling and fallback mechanisms
