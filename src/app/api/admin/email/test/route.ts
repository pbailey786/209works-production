import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { emailService } from '@/lib/email/email-service';
import { EmailHelpers } from '@/lib/email/email-helpers';
import type { Session } from 'next-auth';
import { SecurityLogger } from '@/lib/security/security-monitor';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role || 'guest';
    if (!hasPermission(userRole, Permission.MANAGE_EMAIL_TEMPLATES)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      templateId, 
      recipientEmail, 
      templateProps = {},
      testType = 'template' 
    } = body;

    // Validate input
    if (!recipientEmail) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    let result;
    const userId = (session.user as any)?.id;

    switch (testType) {
      case 'template':
        if (!templateId) {
          return NextResponse.json({ error: 'Template ID is required for template test' }, { status: 400 });
        }
        
        result = await emailService.sendTestEmail(recipientEmail, templateId, templateProps);
        break;

      case 'job-alert':
        result = await EmailHelpers.sendJobAlert(recipientEmail, {
          userName: 'Test User',
          jobTitle: 'Senior Software Engineer',
          companyName: 'Test Company Inc',
          location: 'Modesto, CA',
          salary: '$80,000 - $120,000',
          jobType: 'Full-time',
          description: 'This is a test job alert email. Join our dynamic team and work on exciting projects in the heart of the 209 area.',
          jobUrl: 'https://209.works/jobs/test-123',
          unsubscribeUrl: 'https://209.works/unsubscribe?token=test',
        }, { userId });
        break;

      case 'weekly-digest':
        result = await EmailHelpers.sendWeeklyDigest(recipientEmail, {
          userName: 'Test User',
          jobs: [
            {
              id: '1',
              title: 'Marketing Manager',
              company: 'Local Business Inc',
              location: 'Stockton, CA',
              salary: '$60,000 - $75,000',
              url: 'https://209.works/jobs/1',
            },
            {
              id: '2',
              title: 'Registered Nurse',
              company: 'Central Valley Hospital',
              location: 'Turlock, CA',
              salary: '$70,000 - $85,000',
              url: 'https://209.works/jobs/2',
            },
            {
              id: '3',
              title: 'Elementary Teacher',
              company: 'Modesto City Schools',
              location: 'Modesto, CA',
              salary: '$55,000 - $70,000',
              url: 'https://209.works/jobs/3',
            },
          ],
          unsubscribeUrl: 'https://209.works/unsubscribe?token=test',
        }, { userId });
        break;

      case 'welcome':
        result = await EmailHelpers.sendWelcomeEmail(recipientEmail, {
          userName: 'Test User',
          userType: templateProps.userType || 'job_seeker',
        }, { userId });
        break;

      case 'password-reset':
        result = await EmailHelpers.sendPasswordReset(recipientEmail, {
          userName: 'Test User',
          resetUrl: 'https://209.works/reset-password?token=test-token-123',
        }, { userId });
        break;

      case 'application-confirmation':
        result = await EmailHelpers.sendApplicationConfirmation(recipientEmail, {
          userName: 'Test User',
          jobTitle: 'Software Developer',
          companyName: 'Tech Innovations LLC',
          applicationDate: new Date().toLocaleDateString(),
          jobUrl: 'https://209.works/jobs/test-456',
        }, { userId });
        break;

      case 'new-applicant':
        result = await EmailHelpers.sendNewApplicantNotification(recipientEmail, {
          employerName: 'Test Employer',
          jobTitle: 'Software Developer',
          applicantName: 'John Doe',
          applicantEmail: 'john.doe@example.com',
          applicationDate: new Date().toLocaleDateString(),
          dashboardUrl: 'https://209.works/employers/dashboard',
        }, { userId });
        break;

      case 'job-posting-confirmation':
        result = await EmailHelpers.sendJobPostingConfirmation(recipientEmail, {
          employerName: 'Test Employer',
          jobTitle: 'Software Developer',
          jobId: 'TEST-789',
          jobUrl: 'https://209.works/jobs/test-789',
          dashboardUrl: 'https://209.works/employers/dashboard',
        }, { userId });
        break;

      case 'system-notification':
        result = await EmailHelpers.sendSystemNotification(
          recipientEmail,
          'Test System Notification',
          '<p>This is a test system notification email from 209 Works.</p><p>All systems are functioning normally.</p>',
          { userId }
        );
        break;

      case 'configuration-test':
        result = await emailService.testEmailConfiguration();
        break;

      default:
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });
    }

    // Log the test email action
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    SecurityLogger.loginSuccess(
      userId || 'admin',
      clientIp,
      `Test email sent: ${testType} to ${recipientEmail}`
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: (result as any).messageId || null,
        testType,
        recipientEmail,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send test email',
        testType,
        recipientEmail,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[API] Test email error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role || 'guest';
    if (!hasPermission(userRole, Permission.MANAGE_EMAIL_TEMPLATES)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get available test types and templates
    const templates = emailService.getAvailableTemplates();
    
    const testTypes = [
      { id: 'job-alert', name: 'Job Alert', description: 'Test job alert notification' },
      { id: 'weekly-digest', name: 'Weekly Digest', description: 'Test weekly job digest' },
      { id: 'welcome', name: 'Welcome Email', description: 'Test welcome email for new users' },
      { id: 'password-reset', name: 'Password Reset', description: 'Test password reset email' },
      { id: 'application-confirmation', name: 'Application Confirmation', description: 'Test application confirmation' },
      { id: 'new-applicant', name: 'New Applicant Alert', description: 'Test new applicant notification' },
      { id: 'job-posting-confirmation', name: 'Job Posting Confirmation', description: 'Test job posting confirmation' },
      { id: 'system-notification', name: 'System Notification', description: 'Test system notification' },
      { id: 'configuration-test', name: 'Configuration Test', description: 'Test email system configuration' },
    ];

    return NextResponse.json({
      success: true,
      data: {
        testTypes,
        templates: templates.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
        })),
      },
    });

  } catch (error) {
    console.error('[API] Get test email options error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
