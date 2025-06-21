import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import EnterpriseSecurityManager from '@/lib/security/enterprise-security';
import GDPRComplianceManager from '@/lib/compliance/gdpr-compliance';
import { getDomainConfig } from '@/lib/domain/config';
import { prisma } from '@/lib/database/prisma';

/**
 * GET /api/admin/security
 * Get comprehensive security dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add proper admin role check
    // Only admin users should access security dashboard

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const region = searchParams.get('region');

    // Get domain context
    const hostname = request.headers.get('host') || '';
    const domainConfig = getDomainConfig(hostname);
    const targetRegion = region || domainConfig.areaCode;

    // Calculate time window
    const timeWindowMs = parseTimeRange(timeRange);

    // Get security and compliance managers
    const securityManager = EnterpriseSecurityManager.getInstance();
    const complianceManager = GDPRComplianceManager.getInstance();

    // Gather security metrics
    const [
      securityMetrics,
      complianceReport,
      recentAlerts,
      blockedIPs,
      suspiciousUsers,
      systemHealth,
    ] = await Promise.all([
      securityManager.getSecurityMetrics(timeWindowMs),
      complianceManager.getComplianceReport(),
      getRecentSecurityAlerts(timeWindowMs),
      getBlockedIPs(),
      getSuspiciousUsers(),
      getSystemHealthMetrics(),
    ]);

    // Calculate security score
    const securityScore = calculateSecurityScore(securityMetrics, complianceReport);

    const response = {
      success: true,
      data: {
        overview: {
          securityScore,
          timeRange,
          region: domainConfig.region,
          lastUpdated: new Date().toISOString(),
        },
        security: {
          metrics: securityMetrics,
          alerts: recentAlerts,
          blockedIPs: blockedIPs.length,
          suspiciousUsers: suspiciousUsers.length,
          threatLevel: calculateThreatLevel(securityMetrics),
        },
        compliance: {
          report: complianceReport,
          gdprCompliant: complianceReport.dataRetention.compliant,
          consentRate: Object.values(complianceReport.consent.consentRate).reduce((a, b) => a + b, 0) / Object.keys(complianceReport.consent.consentRate).length || 0,
        },
        system: {
          health: systemHealth,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
        recommendations: generateSecurityRecommendations(securityMetrics, complianceReport),
      },
      meta: {
        timestamp: new Date().toISOString(),
        region: domainConfig.region,
        domain: domainConfig.domain,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Security dashboard error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load security dashboard',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/security
 * Handle security actions (block IP, quarantine user, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add proper admin role check

    const body = await request.json();
    const { action, target, reason, duration } = body;

    const securityManager = EnterpriseSecurityManager.getInstance();

    switch (action) {
      case 'block_ip':
        await blockIP(target, reason, duration);
        break;

      case 'unblock_ip':
        await unblockIP(target);
        break;

      case 'quarantine_user':
        await quarantineUser(target, reason);
        break;

      case 'unquarantine_user':
        await unquarantineUser(target);
        break;

      case 'acknowledge_alert':
        await acknowledgeAlert(target, userId);
        break;

      case 'dismiss_alert':
        await dismissAlert(target, userId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} completed successfully`,
      action,
      target,
    });

  } catch (error) {
    console.error('Security action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute security action' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/security
 * Update security configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add proper admin role check

    const body = await request.json();
    const { config } = body;

    // Update security configuration
    await updateSecurityConfig(config, userId);

    return NextResponse.json({
      success: true,
      message: 'Security configuration updated',
      config,
    });

  } catch (error) {
    console.error('Security config update error:', error);
    return NextResponse.json(
      { error: 'Failed to update security configuration' },
      { status: 500 }
    );
  }
}

/**
 * Helper functions
 */

function parseTimeRange(timeRange: string): number {
  const ranges: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  
  return ranges[timeRange] || ranges['24h'];
}

async function getRecentSecurityAlerts(timeWindowMs: number) {
  const cutoff = new Date(Date.now() - timeWindowMs);
  
  return prisma.securityAlert.findMany({
    where: {
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

async function getBlockedIPs() {
  return prisma.securityBlock.findMany({
    where: {
      type: 'ip_address',
      active: true,
      expiresAt: { gt: new Date() },
    },
  });
}

async function getSuspiciousUsers() {
  return prisma.securityBlock.findMany({
    where: {
      type: 'user_id',
      active: true,
      expiresAt: { gt: new Date() },
    },
  });
}

async function getSystemHealthMetrics() {
  // Get basic system health metrics
  const [
    totalUsers,
    activeUsers,
    totalJobs,
    errorRate,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.job.count({ where: { status: 'ACTIVE' } }),
    calculateErrorRate(),
  ]);

  return {
    totalUsers,
    activeUsers,
    totalJobs,
    errorRate,
    databaseConnected: true, // Would check actual DB connection
    servicesOnline: true, // Would check external services
  };
}

async function calculateErrorRate(): Promise<number> {
  // This would calculate actual error rate from logs
  // For now, return a mock value
  return 0.5; // 0.5% error rate
}

function calculateSecurityScore(securityMetrics: any, complianceReport: any): number {
  let score = 100;

  // Deduct points for security issues
  score -= securityMetrics.criticalEvents * 10;
  score -= securityMetrics.highSeverityEvents * 5;
  score -= securityMetrics.blockedEvents * 2;

  // Deduct points for compliance issues
  if (!complianceReport.dataRetention.compliant) {
    score -= 20;
  }

  // Deduct points for low consent rates
  const avgConsentRate = Object.values(complianceReport.consent.consentRate).reduce((a: number, b: number) => a + b, 0) / Object.keys(complianceReport.consent.consentRate).length || 0;
  if (avgConsentRate < 50) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateThreatLevel(securityMetrics: any): 'low' | 'medium' | 'high' | 'critical' {
  if (securityMetrics.criticalEvents > 0) return 'critical';
  if (securityMetrics.highSeverityEvents > 5) return 'high';
  if (securityMetrics.blockedEvents > 10) return 'medium';
  return 'low';
}

function generateSecurityRecommendations(securityMetrics: any, complianceReport: any): string[] {
  const recommendations: string[] = [];

  if (securityMetrics.criticalEvents > 0) {
    recommendations.push('Investigate and resolve critical security events immediately');
  }

  if (securityMetrics.blockedIPs > 10) {
    recommendations.push('Review blocked IP list and consider implementing additional rate limiting');
  }

  if (!complianceReport.dataRetention.compliant) {
    recommendations.push('Review and clean up expired data to ensure GDPR compliance');
  }

  if (complianceReport.overview.pendingRequests > 5) {
    recommendations.push('Process pending data subject requests within required timeframes');
  }

  const avgConsentRate = Object.values(complianceReport.consent.consentRate).reduce((a: number, b: number) => a + b, 0) / Object.keys(complianceReport.consent.consentRate).length || 0;
  if (avgConsentRate < 70) {
    recommendations.push('Improve consent collection and user education about data processing');
  }

  if (recommendations.length === 0) {
    recommendations.push('Security posture is good. Continue monitoring and regular security reviews.');
  }

  return recommendations;
}

async function blockIP(ipAddress: string, reason: string, duration: number) {
  const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000); // duration in hours
  
  await prisma.securityBlock.create({
    data: {
      type: 'ip_address',
      value: ipAddress,
      reason,
      active: true,
      expiresAt,
    },
  });
}

async function unblockIP(ipAddress: string) {
  await prisma.securityBlock.updateMany({
    where: {
      type: 'ip_address',
      value: ipAddress,
      active: true,
    },
    data: {
      active: false,
    },
  });
}

async function quarantineUser(userId: string, reason: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'quarantined',
      quarantineReason: reason,
      quarantinedAt: new Date(),
    },
  });
}

async function unquarantineUser(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'active',
      quarantineReason: null,
      quarantinedAt: null,
    },
  });
}

async function acknowledgeAlert(alertId: string, adminUserId: string) {
  await prisma.securityAlert.update({
    where: { id: alertId },
    data: {
      acknowledged: true,
      acknowledgedBy: adminUserId,
      acknowledgedAt: new Date(),
    },
  });
}

async function dismissAlert(alertId: string, adminUserId: string) {
  await prisma.securityAlert.update({
    where: { id: alertId },
    data: {
      dismissed: true,
      dismissedBy: adminUserId,
      dismissedAt: new Date(),
    },
  });
}

async function updateSecurityConfig(config: any, adminUserId: string) {
  // Store security configuration updates
  // This would be implemented based on your security config model
  console.log('Security config updated:', { config, adminUserId });
}
