import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../auth/authOptions';
import { prisma } from '../../auth/prisma';
import type { Session } from 'next-auth';

interface SystemAlert {
  id: string;
  type: 'job_spam' | 'resume_flood' | 'unusual_activity' | 'system_error' | 'security_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data: any;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved') === 'true';

    // Date ranges for analysis
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Detect anomalies and generate alerts
    const alerts: SystemAlert[] = [];

    // 1. Job Spam Detection
    const recentJobsByUser = await prisma.$queryRaw`
      SELECT 
        employerId,
        COUNT(*) as job_count,
        u.email,
        u.name
      FROM Job j
      JOIN User u ON j.employerId = u.id
      WHERE j.createdAt >= ${oneHourAgo}
      GROUP BY employerId, u.email, u.name
      HAVING COUNT(*) > 5
      ORDER BY job_count DESC
    `;

    if (Array.isArray(recentJobsByUser) && recentJobsByUser.length > 0) {
      (recentJobsByUser as any[]).forEach(user => {
        alerts.push({
          id: `job_spam_${user.employerId}_${Date.now()}`,
          type: 'job_spam',
          severity: user.job_count > 10 ? 'high' : 'medium',
          title: 'Potential Job Spam Detected',
          description: `User ${user.email} posted ${user.job_count} jobs in the last hour`,
          data: {
            userId: user.employerId,
            email: user.email,
            jobCount: user.job_count,
            timeframe: '1 hour',
          },
          isResolved: false,
          createdAt: now,
        });
      });
    }

    // 2. Resume Upload Flood Detection
    const recentResumeUploads = await prisma.$queryRaw`
      SELECT 
        userId,
        COUNT(*) as upload_count,
        u.email
      FROM Resume r
      JOIN User u ON r.userId = u.id
      WHERE r.createdAt >= ${oneHourAgo}
      GROUP BY userId, u.email
      HAVING COUNT(*) > 3
    `;

    if (Array.isArray(recentResumeUploads) && recentResumeUploads.length > 0) {
      (recentResumeUploads as any[]).forEach(user => {
        alerts.push({
          id: `resume_flood_${user.userId}_${Date.now()}`,
          type: 'resume_flood',
          severity: user.upload_count > 5 ? 'high' : 'medium',
          title: 'Unusual Resume Upload Activity',
          description: `User ${user.email} uploaded ${user.upload_count} resumes in the last hour`,
          data: {
            userId: user.userId,
            email: user.email,
            uploadCount: user.upload_count,
            timeframe: '1 hour',
          },
          isResolved: false,
          createdAt: now,
        });
      });
    }

    // 3. Unusual Chat Activity
    const unusualChatActivity = await prisma.$queryRaw`
      SELECT 
        userId,
        COUNT(*) as query_count,
        u.email
      FROM ChatAnalytics ca
      JOIN User u ON ca.userId = u.id
      WHERE ca.createdAt >= ${oneHourAgo}
      GROUP BY userId, u.email
      HAVING COUNT(*) > 50
    `;

    if (Array.isArray(unusualChatActivity) && unusualChatActivity.length > 0) {
      (unusualChatActivity as any[]).forEach(user => {
        alerts.push({
          id: `unusual_activity_${user.userId}_${Date.now()}`,
          type: 'unusual_activity',
          severity: user.query_count > 100 ? 'high' : 'medium',
          title: 'Unusual Chat Activity Detected',
          description: `User ${user.email} made ${user.query_count} chat queries in the last hour`,
          data: {
            userId: user.userId,
            email: user.email,
            queryCount: user.query_count,
            timeframe: '1 hour',
          },
          isResolved: false,
          createdAt: now,
        });
      });
    }

    // 4. Failed Login Attempts
    const failedLogins = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as failed_attempts,
        details
      FROM AuditLog
      WHERE action = 'LOGIN_FAILED'
      AND createdAt >= ${oneHourAgo}
      GROUP BY details
      HAVING COUNT(*) > 10
    `;

    if (Array.isArray(failedLogins) && failedLogins.length > 0) {
      (failedLogins as any[]).forEach(attempt => {
        alerts.push({
          id: `security_breach_${Date.now()}`,
          type: 'security_breach',
          severity: attempt.failed_attempts > 20 ? 'critical' : 'high',
          title: 'Multiple Failed Login Attempts',
          description: `${attempt.failed_attempts} failed login attempts detected in the last hour`,
          data: {
            failedAttempts: attempt.failed_attempts,
            details: attempt.details,
            timeframe: '1 hour',
          },
          isResolved: false,
          createdAt: now,
        });
      });
    }

    // 5. System Performance Issues
    const avgResponseTime = await prisma.$queryRaw`
      SELECT AVG(responseTime) as avg_response_time
      FROM ChatAnalytics
      WHERE createdAt >= ${oneHourAgo}
      AND responseTime IS NOT NULL
    `;

    if (Array.isArray(avgResponseTime) && avgResponseTime.length > 0) {
      const avgTime = (avgResponseTime as any[])[0]?.avg_response_time;
      if (avgTime > 5000) { // 5 seconds
        alerts.push({
          id: `system_error_${Date.now()}`,
          type: 'system_error',
          severity: avgTime > 10000 ? 'critical' : 'high',
          title: 'High System Response Time',
          description: `Average response time is ${Math.round(avgTime)}ms in the last hour`,
          data: {
            avgResponseTime: avgTime,
            threshold: 5000,
            timeframe: '1 hour',
          },
          isResolved: false,
          createdAt: now,
        });
      }
    }

    // Filter alerts based on query parameters
    let filteredAlerts = alerts;
    if (severity) {
      filteredAlerts = alerts.filter(alert => alert.severity === severity);
    }

    // Sort by severity and creation time
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    filteredAlerts.sort((a, b) => {
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Get historical alerts from database (if you have an alerts table)
    // For now, we'll return the generated alerts
    const response = {
      alerts: filteredAlerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
        unresolved: alerts.filter(a => !a.isResolved).length,
      },
      lastChecked: now.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system alerts' },
      { status: 500 }
    );
  }
}

// POST endpoint to resolve alerts or create custom alerts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, alertId, customAlert } = body;

    if (action === 'resolve' && alertId) {
      // Mark alert as resolved (you'd need an alerts table for persistence)
      // For now, we'll just log the resolution
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ALERT_RESOLVED',
          resource: 'ALERT',
          resourceId: alertId,
          details: { alertId, resolvedAt: new Date() },
        },
      });

      return NextResponse.json({ success: true, message: 'Alert resolved' });
    }

    if (action === 'create' && customAlert) {
      // Create a custom alert
      const alert: SystemAlert = {
        id: `custom_${Date.now()}`,
        type: customAlert.type || 'system_error',
        severity: customAlert.severity || 'medium',
        title: customAlert.title,
        description: customAlert.description,
        data: customAlert.data || {},
        isResolved: false,
        createdAt: new Date(),
      };

      // Log the custom alert creation
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ALERT_CREATED',
          resource: 'ALERT',
          resourceId: alert.id,
          details: {
            alertId: alert.id,
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            description: alert.description,
            createdAt: alert.createdAt,
          },
        },
      });

      return NextResponse.json({ success: true, alert });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling alert action:', error);
    return NextResponse.json(
      { error: 'Failed to handle alert action' },
      { status: 500 }
    );
  }
}
