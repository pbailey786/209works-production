/**
 * Enterprise Security System for 209 Works
 * Comprehensive security framework with advanced threat detection, compliance, and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import { AuditLogger } from '@/lib/monitoring/error-monitor';
import { getDomainConfig } from '@/lib/domain/config';

export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'suspicious_activity' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
  region: string;
  blocked: boolean;
}

export interface ThreatDetectionRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | ((event: SecurityEvent) => boolean);
  severity: SecurityEvent['severity'];
  action: 'log' | 'block' | 'alert' | 'quarantine';
  enabled: boolean;
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  regulation: 'GDPR' | 'CCPA' | 'SOX' | 'HIPAA' | 'PCI_DSS';
  validator: (data: any) => boolean;
  remediation: string;
}

/**
 * Enterprise Security Manager
 */
export class EnterpriseSecurityManager {
  private static instance: EnterpriseSecurityManager;
  private threatRules: ThreatDetectionRule[] = [];
  private complianceRules: ComplianceRequirement[] = [];
  private securityEvents: SecurityEvent[] = [];
  private blockedIPs: Set<string> = new Set();
  private suspiciousUsers: Set<string> = new Set();

  private constructor() {
    this.initializeThreatDetectionRules();
    this.initializeComplianceRules();
    this.loadBlockedIPs();
  }

  static getInstance(): EnterpriseSecurityManager {
    if (!this.instance) {
      this.instance = new EnterpriseSecurityManager();
    }
    return this.instance;
  }

  /**
   * Initialize threat detection rules
   */
  private initializeThreatDetectionRules() {
    this.threatRules = [
      {
        id: 'brute_force_login',
        name: 'Brute Force Login Detection',
        description: 'Detects multiple failed login attempts from same IP',
        pattern: (event) => {
          if (event.type !== 'authentication' || event.action !== 'login_failed') return false;
          const recentFailures = this.getRecentEvents(event.ipAddress, 'authentication', 15 * 60 * 1000);
          return recentFailures.filter(e => e.action === 'login_failed').length >= 5;
        },
        severity: 'high',
        action: 'block',
        enabled: true,
      },
      {
        id: 'suspicious_data_access',
        name: 'Suspicious Data Access Pattern',
        description: 'Detects unusual data access patterns',
        pattern: (event) => {
          if (event.type !== 'data_access') return false;
          const recentAccess = this.getRecentEvents(event.userId || '', 'data_access', 60 * 60 * 1000);
          return recentAccess.length > 100; // More than 100 data access events in 1 hour
        },
        severity: 'medium',
        action: 'alert',
        enabled: true,
      },
      {
        id: 'cross_region_access',
        name: 'Cross-Region Access Detection',
        description: 'Detects access from multiple regions in short time',
        pattern: (event) => {
          if (!event.userId) return false;
          const recentEvents = this.getRecentEvents(event.userId, 'authentication', 30 * 60 * 1000);
          const regions = new Set(recentEvents.map(e => e.region));
          return regions.size > 2; // Access from more than 2 regions in 30 minutes
        },
        severity: 'medium',
        action: 'alert',
        enabled: true,
      },
      {
        id: 'admin_privilege_escalation',
        name: 'Admin Privilege Escalation',
        description: 'Detects attempts to escalate privileges',
        pattern: (event) => {
          return event.type === 'authorization' && 
                 event.action.includes('admin') && 
                 event.details.previousRole !== 'admin';
        },
        severity: 'critical',
        action: 'block',
        enabled: true,
      },
      {
        id: 'sql_injection_attempt',
        name: 'SQL Injection Detection',
        description: 'Detects potential SQL injection attempts',
        pattern: /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b|\bEXEC\b)/i,
        severity: 'critical',
        action: 'block',
        enabled: true,
      },
      {
        id: 'xss_attempt',
        name: 'XSS Attack Detection',
        description: 'Detects potential XSS attacks',
        pattern: /(<script|javascript:|onload=|onerror=|onclick=)/i,
        severity: 'high',
        action: 'block',
        enabled: true,
      },
    ];
  }

  /**
   * Initialize compliance rules
   */
  private initializeComplianceRules() {
    this.complianceRules = [
      {
        id: 'gdpr_data_retention',
        name: 'GDPR Data Retention',
        description: 'Ensures data is not retained longer than necessary',
        regulation: 'GDPR',
        validator: (data) => {
          const retentionPeriod = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years
          return Date.now() - new Date(data.createdAt).getTime() < retentionPeriod;
        },
        remediation: 'Delete or anonymize data older than retention period',
      },
      {
        id: 'gdpr_consent_tracking',
        name: 'GDPR Consent Tracking',
        description: 'Ensures proper consent is tracked for data processing',
        regulation: 'GDPR',
        validator: (data) => {
          return data.consentGiven && data.consentTimestamp && data.consentVersion;
        },
        remediation: 'Obtain and record proper consent before processing personal data',
      },
      {
        id: 'ccpa_data_disclosure',
        name: 'CCPA Data Disclosure',
        description: 'Ensures data sharing is properly disclosed',
        regulation: 'CCPA',
        validator: (data) => {
          return !data.sharedWithThirdParties || data.disclosureNotified;
        },
        remediation: 'Notify users of data sharing with third parties',
      },
      {
        id: 'pci_dss_payment_data',
        name: 'PCI DSS Payment Data Protection',
        description: 'Ensures payment data is properly protected',
        regulation: 'PCI_DSS',
        validator: (data) => {
          return !data.paymentInfo || (data.paymentInfo.encrypted && data.paymentInfo.tokenized);
        },
        remediation: 'Encrypt and tokenize all payment card data',
      },
    ];
  }

  /**
   * Load blocked IPs from database
   */
  private async loadBlockedIPs() {
    try {
      const blockedIPs = await prisma.securityBlock.findMany({
        where: {
          type: 'ip_address',
          active: true,
          expiresAt: { gt: new Date() },
        },
      });
      
      this.blockedIPs = new Set(blockedIPs.map(block => block.value));
    } catch (error) {
      console.error('Error loading blocked IPs:', error);
    }
  }

  /**
   * Process security event
   */
  async processSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<SecurityEvent> {
    const fullEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    // Store event
    this.securityEvents.push(fullEvent);
    
    // Keep only recent events in memory (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.securityEvents = this.securityEvents.filter(e => e.timestamp.getTime() > oneDayAgo);

    // Check against threat detection rules
    await this.evaluateThreatRules(fullEvent);

    // Log to audit system
    AuditLogger.log({
      action: fullEvent.action,
      resource: fullEvent.resource,
      resourceId: fullEvent.details.resourceId,
      userId: fullEvent.userId,
      userEmail: fullEvent.details.userEmail,
      ipAddress: fullEvent.ipAddress,
      timestamp: fullEvent.timestamp,
      success: !fullEvent.blocked,
      details: fullEvent.details,
    });

    // Store in database for long-term analysis
    await this.storeSecurityEvent(fullEvent);

    return fullEvent;
  }

  /**
   * Evaluate threat detection rules
   */
  private async evaluateThreatRules(event: SecurityEvent) {
    for (const rule of this.threatRules.filter(r => r.enabled)) {
      let matches = false;

      if (typeof rule.pattern === 'function') {
        matches = rule.pattern(event);
      } else if (rule.pattern instanceof RegExp) {
        const searchText = JSON.stringify(event.details);
        matches = rule.pattern.test(searchText);
      }

      if (matches) {
        await this.handleThreatDetection(event, rule);
      }
    }
  }

  /**
   * Handle threat detection
   */
  private async handleThreatDetection(event: SecurityEvent, rule: ThreatDetectionRule) {
    console.warn(`🚨 Threat detected: ${rule.name}`, {
      eventId: event.id,
      ruleId: rule.id,
      severity: rule.severity,
      action: rule.action,
    });

    switch (rule.action) {
      case 'block':
        await this.blockIP(event.ipAddress, rule.name);
        if (event.userId) {
          await this.flagSuspiciousUser(event.userId, rule.name);
        }
        break;

      case 'alert':
        await this.sendSecurityAlert(event, rule);
        break;

      case 'quarantine':
        if (event.userId) {
          await this.quarantineUser(event.userId, rule.name);
        }
        break;

      case 'log':
        // Already logged above
        break;
    }
  }

  /**
   * Block IP address
   */
  private async blockIP(ipAddress: string, reason: string) {
    this.blockedIPs.add(ipAddress);
    
    try {
      await prisma.securityBlock.create({
        data: {
          type: 'ip_address',
          value: ipAddress,
          reason,
          active: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });
    } catch (error) {
      console.error('Error blocking IP:', error);
    }
  }

  /**
   * Flag suspicious user
   */
  private async flagSuspiciousUser(userId: string, reason: string) {
    this.suspiciousUsers.add(userId);
    
    try {
      await prisma.securityBlock.create({
        data: {
          type: 'user_id',
          value: userId,
          reason,
          active: true,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    } catch (error) {
      console.error('Error flagging user:', error);
    }
  }

  /**
   * Quarantine user
   */
  private async quarantineUser(userId: string, reason: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'quarantined',
          quarantineReason: reason,
          quarantinedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error quarantining user:', error);
    }
  }

  /**
   * Send security alert
   */
  private async sendSecurityAlert(event: SecurityEvent, rule: ThreatDetectionRule) {
    // In production, this would send alerts to security team
    console.warn(`🚨 Security Alert: ${rule.name}`, {
      event,
      rule,
      timestamp: new Date().toISOString(),
    });

    // Store alert in database
    try {
      await prisma.securityAlert.create({
        data: {
          type: rule.name,
          severity: rule.severity,
          description: rule.description,
          eventId: event.id,
          userId: event.userId,
          ipAddress: event.ipAddress,
          details: event.details,
          acknowledged: false,
        },
      });
    } catch (error) {
      console.error('Error storing security alert:', error);
    }
  }

  /**
   * Store security event in database
   */
  private async storeSecurityEvent(event: SecurityEvent) {
    try {
      await prisma.securityEvent.create({
        data: {
          id: event.id,
          type: event.type,
          severity: event.severity,
          userId: event.userId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          resource: event.resource,
          action: event.action,
          details: event.details,
          region: event.region,
          blocked: event.blocked,
          timestamp: event.timestamp,
        },
      });
    } catch (error) {
      console.error('Error storing security event:', error);
    }
  }

  /**
   * Get recent events for analysis
   */
  private getRecentEvents(
    identifier: string, 
    type: SecurityEvent['type'], 
    timeWindowMs: number
  ): SecurityEvent[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.securityEvents.filter(event => 
      event.timestamp.getTime() > cutoff &&
      event.type === type &&
      (event.userId === identifier || event.ipAddress === identifier)
    );
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  /**
   * Check if user is suspicious
   */
  isUserSuspicious(userId: string): boolean {
    return this.suspiciousUsers.has(userId);
  }

  /**
   * Validate compliance requirements
   */
  async validateCompliance(data: any, regulation?: string): Promise<{
    compliant: boolean;
    violations: ComplianceRequirement[];
  }> {
    const applicableRules = regulation 
      ? this.complianceRules.filter(rule => rule.regulation === regulation)
      : this.complianceRules;

    const violations: ComplianceRequirement[] = [];

    for (const rule of applicableRules) {
      if (!rule.validator(data)) {
        violations.push(rule);
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(timeWindowMs: number = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - timeWindowMs;
    const recentEvents = this.securityEvents.filter(e => e.timestamp.getTime() > cutoff);

    return {
      totalEvents: recentEvents.length,
      blockedEvents: recentEvents.filter(e => e.blocked).length,
      criticalEvents: recentEvents.filter(e => e.severity === 'critical').length,
      highSeverityEvents: recentEvents.filter(e => e.severity === 'high').length,
      blockedIPs: this.blockedIPs.size,
      suspiciousUsers: this.suspiciousUsers.size,
      eventsByType: this.groupEventsByType(recentEvents),
      eventsByRegion: this.groupEventsByRegion(recentEvents),
    };
  }

  private groupEventsByType(events: SecurityEvent[]) {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupEventsByRegion(events: SecurityEvent[]) {
    return events.reduce((acc, event) => {
      acc[event.region] = (acc[event.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

export default EnterpriseSecurityManager;
