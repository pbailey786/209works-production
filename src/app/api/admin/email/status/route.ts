import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { emailService } from '@/lib/email/email-service';
import { emailAgent } from '@/lib/agents/email-agent';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user?.role || 'guest';
    if (!hasPermission(userRole, Permission.VIEW_EMAIL_ANALYTICS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get email system status
    const [configTest, templates, metrics] = await Promise.allSettled([
      emailAgent.testConfiguration(),
      Promise.resolve(emailService.getAvailableTemplates()),
      emailService.getEmailMetrics('week'),
    ]);

    // Email service configuration
    const emailConfig = {
      provider: 'Resend',
      fromAddress: process.env.RESEND_EMAIL_FROM || 'noreply@209.works',
      apiKeyConfigured: !!process.env.RESEND_API_KEY,
      environment: process.env.NODE_ENV || 'development',
    };

    // Configuration test result
    const configurationStatus = configTest.status === 'fulfilled' 
      ? configTest.value 
      : { success: false, error: 'Configuration test failed' };

    // Templates status
    const templatesData = templates.status === 'fulfilled' 
      ? templates.value 
      : [];

    const templateStats = {
      total: templatesData.length,
      byCategory: {
        job_seeker: templatesData.filter(t => t.category === 'job_seeker').length,
        employer: templatesData.filter(t => t.category === 'employer').length,
        system: templatesData.filter(t => t.category === 'system').length,
        marketing: templatesData.filter(t => t.category === 'marketing').length,
      },
    };

    // Email metrics
    const emailMetrics = metrics.status === 'fulfilled' 
      ? metrics.value 
      : {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          complained: 0,
          unsubscribed: 0,
        };

    // Calculate rates
    const deliveryRate = emailMetrics.sent > 0 
      ? ((emailMetrics.delivered / emailMetrics.sent) * 100).toFixed(1)
      : '0.0';
    
    const openRate = emailMetrics.delivered > 0 
      ? ((emailMetrics.opened / emailMetrics.delivered) * 100).toFixed(1)
      : '0.0';
    
    const clickRate = emailMetrics.delivered > 0 
      ? ((emailMetrics.clicked / emailMetrics.delivered) * 100).toFixed(1)
      : '0.0';

    // System health indicators
    const healthIndicators = [
      {
        name: 'Email Service',
        status: configurationStatus.success ? 'operational' : 'degraded',
        description: configurationStatus.success 
          ? 'Email service is operational' 
          : configurationStatus.error || 'Email service issues detected',
      },
      {
        name: 'Templates',
        status: templatesData.length > 0 ? 'operational' : 'warning',
        description: `${templatesData.length} templates available`,
      },
      {
        name: 'API Configuration',
        status: emailConfig.apiKeyConfigured ? 'operational' : 'error',
        description: emailConfig.apiKeyConfigured 
          ? 'API key configured' 
          : 'API key not configured',
      },
      {
        name: 'Delivery Rate',
        status: parseFloat(deliveryRate) >= 95 ? 'operational' : 
                parseFloat(deliveryRate) >= 90 ? 'warning' : 'error',
        description: `${deliveryRate}% delivery rate`,
      },
    ];

    // Recent activity (mock data - replace with real data)
    const recentActivity = [
      {
        id: '1',
        type: 'email_sent',
        description: 'Job alert sent to 156 recipients',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        id: '2',
        type: 'template_updated',
        description: 'Welcome email template updated',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'info',
      },
      {
        id: '3',
        type: 'campaign_completed',
        description: 'Weekly digest campaign completed',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        id: '4',
        type: 'email_bounced',
        description: '3 emails bounced due to invalid addresses',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: 'warning',
      },
    ];

    // Queue status (mock data - replace with real queue monitoring)
    const queueStatus = {
      pending: 127,
      processing: 5,
      completed: 2450,
      failed: 23,
      retrying: 2,
    };

    return NextResponse.json({
      success: true,
      data: {
        configuration: emailConfig,
        configurationTest: configurationStatus,
        templates: templateStats,
        metrics: {
          ...emailMetrics,
          rates: {
            delivery: parseFloat(deliveryRate),
            open: parseFloat(openRate),
            click: parseFloat(clickRate),
          },
        },
        health: {
          overall: healthIndicators.every(h => h.status === 'operational') 
            ? 'operational' 
            : healthIndicators.some(h => h.status === 'error') 
            ? 'error' 
            : 'warning',
          indicators: healthIndicators,
        },
        queue: queueStatus,
        recentActivity,
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[API] Email status error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
