import { prisma } from '@/lib/database/prisma';

// Security event types
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_SUCCESS = 'password_reset_success',
  TWO_FA_ENABLED = 'two_fa_enabled',
  TWO_FA_DISABLED = 'two_fa_disabled',
  TWO_FA_FAILURE = 'two_fa_failure',

  // Authorization events
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PRIVILEGE_ESCALATION_ATTEMPT = 'privilege_escalation_attempt',

  // Application security events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_REQUEST = 'suspicious_request',
  INJECTION_ATTEMPT = 'injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',

  // Data security events
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  DATA_EXPORT = 'data_export',
  BULK_DATA_ACCESS = 'bulk_data_access',

  // System security events
  SECURITY_SCAN_COMPLETE = 'security_scan_complete',
  VULNERABILITY_DETECTED = 'vulnerability_detected',
  SECURITY_UPDATE_APPLIED = 'security_update_applied',

  // Incident events
  SECURITY_INCIDENT_CREATED = 'security_incident_created',
  SECURITY_INCIDENT_RESOLVED = 'security_incident_resolved',
}

// Security event severity levels
export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Security event interface
export interface SecurityEvent {
  id?: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress: string;
  userAgent?: string;
  resource?: string;
  details: Record<string, any>;
  requestId?: string;
  sessionId?: string;
  resolved: boolean;
  incidentId?: string;
}

// Threat detection patterns
const THREAT_PATTERNS = {
  // Multiple failed login attempts
  BRUTE_FORCE_LOGIN: {
    type: SecurityEventType.LOGIN_FAILURE,
    threshold: 5,
    timeWindow: 15 * 60 * 1000, // 15 minutes
    severity: SecuritySeverity.HIGH,
  },

  // Multiple rate limit violations
  RATE_LIMIT_ABUSE: {
    type: SecurityEventType.RATE_LIMIT_EXCEEDED,
    threshold: 10,
    timeWindow: 5 * 60 * 1000, // 5 minutes
    severity: SecuritySeverity.MEDIUM,
  },

  // Multiple unauthorized access attempts
  UNAUTHORIZED_ACCESS_PATTERN: {
    type: SecurityEventType.UNAUTHORIZED_ACCESS,
    threshold: 3,
    timeWindow: 10 * 60 * 1000, // 10 minutes
    severity: SecuritySeverity.HIGH,
  },

  // Bulk data access from single IP
  BULK_DATA_SCRAPING: {
    type: SecurityEventType.BULK_DATA_ACCESS,
    threshold: 2,
    timeWindow: 60 * 60 * 1000, // 1 hour
    severity: SecuritySeverity.CRITICAL,
  },
};

export class SecurityMonitor {
  private static instance: SecurityMonitor;

  private constructor() {}

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  // Log a security event
  async logSecurityEvent(
    event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>
  ): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        timestamp: new Date(),
        resolved: false,
      };

      // Store in database (you'll need to create this table in your schema)
      // For now, we'll use console logging and could integrate with external services
      console.log('🚨 Security Event:', JSON.stringify(securityEvent, null, 2));

      // Check for threat patterns
      await this.detectThreats(securityEvent);

      // Send alerts if necessary
      await this.sendAlertsIfNecessary(securityEvent);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Security monitoring error:', errorMessage);
      // Handle error appropriately
    }
  }

  // Detect threat patterns
  private async detectThreats(event: SecurityEvent): Promise<void> {
    for (const [patternName, pattern] of Object.entries(THREAT_PATTERNS)) {
      if (pattern.type === event.type) {
        const recentEvents = await this.getRecentEvents(
          event.type,
          event.ipAddress,
          pattern.timeWindow
        );

        if (recentEvents.length >= pattern.threshold) {
          await this.createSecurityIncident({
            type: `${patternName}_DETECTED`,
            severity: pattern.severity,
            description: `Detected ${patternName}: ${recentEvents.length} events in ${pattern.timeWindow / 1000 / 60} minutes`,
            ipAddress: event.ipAddress,
            userId: event.userId,
            events: recentEvents,
          });
        }
      }
    }
  }

  // Get recent events for threat detection
  private async getRecentEvents(
    type: SecurityEventType,
    ipAddress: string,
    timeWindow: number
  ): Promise<SecurityEvent[]> {
    // This would query your security events table
    // For now, returning mock data
    return [];
  }

  // Create security incident
  private async createSecurityIncident(incident: {
    type: string;
    severity: SecuritySeverity;
    description: string;
    ipAddress: string;
    userId?: string;
    events: SecurityEvent[];
  }): Promise<void> {
    console.log('🚨 SECURITY INCIDENT CREATED:', incident);

    // Log the incident creation
    await this.logSecurityEvent({
      type: SecurityEventType.SECURITY_INCIDENT_CREATED,
      severity: incident.severity,
      ipAddress: incident.ipAddress,
      userId: incident.userId,
      details: {
        incidentType: incident.type,
        description: incident.description,
        eventCount: incident.events.length,
      },
    });

    // Send critical alerts
    if (incident.severity === SecuritySeverity.CRITICAL) {
      await this.sendCriticalAlert(incident);
    }

    // Auto-response actions
    await this.executeAutoResponse(incident);
  }

  // Send alerts when necessary
  private async sendAlertsIfNecessary(event: SecurityEvent): Promise<void> {
    // Send alerts for high/critical events
    if (
      event.severity === SecuritySeverity.HIGH ||
      event.severity === SecuritySeverity.CRITICAL
    ) {
      await this.sendAlert({
        subject: `Security Alert: ${event.type}`,
        message: `A ${event.severity} security event has been detected: ${event.type}`,
        event,
      });
    }
  }

  // Send security alert
  private async sendAlert(alert: {
    subject: string;
    message: string;
    event: SecurityEvent;
  }): Promise<void> {
    // Integration points for alerts
    console.log('📧 Security Alert:', alert);

    // TODO: Integrate with:
    // - Email notifications
    // - Slack/Discord webhooks
    // - SMS alerts
    // - PagerDuty/OpsGenie
    // - Logging services (DataDog, LogRocket, etc.)
  }

  // Send critical alert
  private async sendCriticalAlert(incident: any): Promise<void> {
    console.log('🚨 CRITICAL SECURITY ALERT:', incident);

    // TODO: Implement critical alert channels
    // - Immediate notifications to security team
    // - Auto-escalation if not acknowledged
    // - Integration with incident response tools
  }

  // Execute automated response actions
  private async executeAutoResponse(incident: any): Promise<void> {
    console.log('🤖 Executing auto-response for incident:', incident.type);

    switch (incident.type) {
      case 'BRUTE_FORCE_LOGIN_DETECTED':
        await this.blockIPAddress(incident.ipAddress, '1 hour');
        break;

      case 'RATE_LIMIT_ABUSE_DETECTED':
        await this.temporaryRateLimit(incident.ipAddress, '30 minutes');
        break;

      case 'BULK_DATA_SCRAPING_DETECTED':
        await this.blockIPAddress(incident.ipAddress, '24 hours');
        await this.alertDataProtectionTeam(incident);
        break;

      default:
        console.log(`No auto-response defined for ${incident.type}`);
    }
  }

  // Block IP address
  private async blockIPAddress(
    ipAddress: string,
    duration: string
  ): Promise<void> {
    console.log(`🚫 Blocking IP address ${ipAddress} for ${duration}`);

    // TODO: Implement IP blocking
    // - Add to Redis blocklist
    // - Configure at load balancer level
    // - Update firewall rules
  }

  // Apply temporary rate limiting
  private async temporaryRateLimit(
    ipAddress: string,
    duration: string
  ): Promise<void> {
    console.log(
      `⏱️ Applying temporary rate limit to ${ipAddress} for ${duration}`
    );

    // TODO: Implement temporary rate limiting
    // - Update rate limiter configuration
    // - Add to Redis with TTL
  }

  // Alert data protection team
  private async alertDataProtectionTeam(incident: any): Promise<void> {
    console.log('📞 Alerting data protection team about potential data breach');

    // TODO: Implement data protection team alerts
    // - Send to dedicated security channel
    // - Create ticket in security system
    // - Trigger data breach response procedures
  }

  // Security monitoring dashboard data
  async getSecurityDashboard(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<{
    summary: {
      totalEvents: number;
      criticalEvents: number;
      activeIncidents: number;
      blockedIPs: number;
    };
    topThreats: Array<{
      type: string;
      count: number;
      severity: SecuritySeverity;
    }>;
    eventTimeline: Array<{
      hour: string;
      events: number;
    }>;
  }> {
    // TODO: Implement dashboard data queries
    return {
      summary: {
        totalEvents: 0,
        criticalEvents: 0,
        activeIncidents: 0,
        blockedIPs: 0,
      },
      topThreats: [],
      eventTimeline: [],
    };
  }
}

// Convenience functions for common security events
export const SecurityLogger = {
  // Authentication events
  loginSuccess: (userId: string, ipAddress: string, userAgent?: string) =>
    SecurityMonitor.getInstance().logSecurityEvent({
      type: SecurityEventType.LOGIN_SUCCESS,
      severity: SecuritySeverity.LOW,
      userId,
      ipAddress,
      userAgent,
      details: { timestamp: new Date().toISOString() },
    }),

  loginFailure: (
    email: string,
    ipAddress: string,
    reason: string,
    userAgent?: string
  ) =>
    SecurityMonitor.getInstance().logSecurityEvent({
      type: SecurityEventType.LOGIN_FAILURE,
      severity: SecuritySeverity.MEDIUM,
      userEmail: email,
      ipAddress,
      userAgent,
      details: { reason, timestamp: new Date().toISOString() },
    }),

  unauthorizedAccess: (
    resource: string,
    ipAddress: string,
    userId?: string,
    userAgent?: string
  ) =>
    SecurityMonitor.getInstance().logSecurityEvent({
      type: SecurityEventType.UNAUTHORIZED_ACCESS,
      severity: SecuritySeverity.HIGH,
      userId,
      ipAddress,
      userAgent,
      resource,
      details: {
        attemptedResource: resource,
        timestamp: new Date().toISOString(),
      },
    }),

  rateLimitExceeded: (ipAddress: string, endpoint: string, userId?: string) =>
    SecurityMonitor.getInstance().logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: SecuritySeverity.MEDIUM,
      userId,
      ipAddress,
      resource: endpoint,
      details: { endpoint, timestamp: new Date().toISOString() },
    }),

  suspiciousRequest: (
    ipAddress: string,
    reason: string,
    requestDetails: any,
    userId?: string
  ) =>
    SecurityMonitor.getInstance().logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_REQUEST,
      severity: SecuritySeverity.HIGH,
      userId,
      ipAddress,
      details: { reason, requestDetails, timestamp: new Date().toISOString() },
    }),

  injectionAttempt: (
    ipAddress: string,
    type: 'sql' | 'nosql' | 'xss' | 'other',
    payload: string,
    userId?: string
  ) =>
    SecurityMonitor.getInstance().logSecurityEvent({
      type: SecurityEventType.INJECTION_ATTEMPT,
      severity: SecuritySeverity.CRITICAL,
      userId,
      ipAddress,
      details: {
        injectionType: type,
        payload: payload.substring(0, 500),
        timestamp: new Date().toISOString(),
      },
    }),

  sensitiveDataAccess: (
    userId: string,
    resource: string,
    ipAddress: string,
    dataType: string
  ) =>
    SecurityMonitor.getInstance().logSecurityEvent({
      type: SecurityEventType.SENSITIVE_DATA_ACCESS,
      severity: SecuritySeverity.MEDIUM,
      userId,
      ipAddress,
      resource,
      details: { dataType, timestamp: new Date().toISOString() },
    }),
};

// Middleware integration for automatic security logging
export function withSecurityLogging<T extends (...args: any[]) => any>(
  handler: T,
  options: {
    logSuccess?: boolean;
    logFailure?: boolean;
    sensitiveResource?: boolean;
  } = {}
): T {
  return (async (...args: any[]) => {
    const [req] = args;
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      req.ip ||
      'unknown';
    const userAgent = req.headers.get('user-agent');

    try {
      const result = await handler(...args);

      if (options.logSuccess) {
        // Log successful access
        if (options.sensitiveResource) {
          SecurityLogger.sensitiveDataAccess(
            'unknown', // Would get from context
            req.url,
            ipAddress,
            'api_access'
          );
        }
      }

      return result;
    } catch (error) {
      if (options.logFailure) {
        SecurityLogger.suspiciousRequest(
          ipAddress,
          `API request failed: ${error instanceof Error ? error.message : String(error)}`,
          { url: req.url, method: req.method }
        );
      }
      throw error;
    }
  }) as T;
}

// Environment configuration validation
export function validateSecurityMonitoringEnvironment(): void {
  const warnings: string[] = [];

  if (!process.env.SECURITY_ALERT_EMAIL) {
    warnings.push(
      'SECURITY_ALERT_EMAIL not configured - security alerts will only be logged'
    );
  }

  if (!process.env.SLACK_SECURITY_WEBHOOK) {
    warnings.push('SLACK_SECURITY_WEBHOOK not configured - no Slack alerts');
  }

  if (warnings.length > 0) {
    console.warn('Security monitoring configuration warnings:');
    warnings.forEach(warning => console.warn(`- ${warning}`));
  }
}
