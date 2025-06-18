import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import { emailService } from '@/lib/email/email-service';
import { EmailHelpers } from '@/lib/email/email-helpers';
import { SecurityLogger } from '@/lib/security/security-monitor';
import type { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await getServerSession() as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role || 'guest';
    if (!hasPermission(userRole, Permission.MANAGE_EMAIL_TEMPLATES)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      type,
      recipients,
      templateId,
      templateProps = {},
      subject,
      priority = 'normal',
      scheduledAt,
      campaignName,
    } = body;

    // Validate input
    if (!type) {
      return NextResponse.json({ error: 'Email type is required' }, { status: 400 });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Recipients array is required' }, { status: 400 });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json({ 
        error: `Invalid email addresses: ${invalidEmails.join(', ')}` 
      }, { status: 400 });
    }

    const userId = (session.user as any)?.id;
    let result;

    switch (type) {
      case 'template':
        if (!templateId) {
          return NextResponse.json({ error: 'Template ID is required for template emails' }, { status: 400 });
        }

        // Send to multiple recipients
        const templateResults = await Promise.allSettled(
          recipients.map(email => 
            emailService.sendTemplatedEmail(templateId, email, templateProps, {
              priority,
              userId,
              metadata: { 
                source: 'admin-send',
                campaignName: campaignName || 'Admin Email',
              },
            })
          )
        );

        const successful = templateResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = templateResults.length - successful;

        result = {
          success: true,
          message: `Email sent to ${successful} recipients${failed > 0 ? `, ${failed} failed` : ''}`,
          details: {
            total: recipients.length,
            successful,
            failed,
          },
        };
        break;

      case 'job-alert':
        const jobAlertData = {
          userName: templateProps.userName || 'Job Seeker',
          jobTitle: templateProps.jobTitle || 'New Position',
          companyName: templateProps.companyName || 'Local Company',
          location: templateProps.location || 'Modesto, CA',
          salary: templateProps.salary,
          jobType: templateProps.jobType || 'Full-time',
          description: templateProps.description || 'Exciting opportunity in the 209 area.',
          jobUrl: templateProps.jobUrl || 'https://209.works/jobs',
          unsubscribeUrl: templateProps.unsubscribeUrl || 'https://209.works/unsubscribe',
        };

        const jobAlertResults = await Promise.allSettled(
          recipients.map(email => 
            EmailHelpers.sendJobAlert(email, jobAlertData, { priority, userId })
          )
        );

        const jobAlertSuccessful = jobAlertResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const jobAlertFailed = jobAlertResults.length - jobAlertSuccessful;

        result = {
          success: true,
          message: `Job alert sent to ${jobAlertSuccessful} recipients${jobAlertFailed > 0 ? `, ${jobAlertFailed} failed` : ''}`,
          details: {
            total: recipients.length,
            successful: jobAlertSuccessful,
            failed: jobAlertFailed,
          },
        };
        break;

      case 'weekly-digest':
        const digestData = {
          userName: templateProps.userName || 'Job Seeker',
          jobs: templateProps.jobs || [],
          unsubscribeUrl: templateProps.unsubscribeUrl || 'https://209.works/unsubscribe',
        };

        const digestResults = await Promise.allSettled(
          recipients.map(email => 
            EmailHelpers.sendWeeklyDigest(email, digestData, { priority, userId })
          )
        );

        const digestSuccessful = digestResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const digestFailed = digestResults.length - digestSuccessful;

        result = {
          success: true,
          message: `Weekly digest sent to ${digestSuccessful} recipients${digestFailed > 0 ? `, ${digestFailed} failed` : ''}`,
          details: {
            total: recipients.length,
            successful: digestSuccessful,
            failed: digestFailed,
          },
        };
        break;

      case 'welcome':
        const welcomeResults = await Promise.allSettled(
          recipients.map(email => 
            EmailHelpers.sendWelcomeEmail(email, {
              userName: templateProps.userName || 'User',
              userType: templateProps.userType || 'job_seeker',
            }, { priority, userId })
          )
        );

        const welcomeSuccessful = welcomeResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const welcomeFailed = welcomeResults.length - welcomeSuccessful;

        result = {
          success: true,
          message: `Welcome email sent to ${welcomeSuccessful} recipients${welcomeFailed > 0 ? `, ${welcomeFailed} failed` : ''}`,
          details: {
            total: recipients.length,
            successful: welcomeSuccessful,
            failed: welcomeFailed,
          },
        };
        break;

      case 'bulk-template':
        if (!templateId) {
          return NextResponse.json({ error: 'Template ID is required for bulk template emails' }, { status: 400 });
        }

        // Prepare recipients with individual props
        const bulkRecipients = recipients.map((email, index) => ({
          email,
          props: {
            ...templateProps,
            // Allow per-recipient customization if provided
            ...(templateProps.recipientData?.[index] || {}),
          },
        }));

        const bulkResult = await emailService.sendBulkTemplatedEmails(
          templateId,
          bulkRecipients,
          {
            priority,
            userId,
            metadata: { 
              source: 'admin-bulk-send',
              campaignName: campaignName || 'Admin Bulk Email',
            },
            batchSize: 50,
            delayBetweenBatches: 2000,
          }
        );

        result = {
          success: true,
          message: `Bulk email campaign initiated for ${recipients.length} recipients`,
          details: {
            total: recipients.length,
            successful: bulkResult.summary.sent,
            failed: bulkResult.summary.bounced,
            summary: bulkResult.summary,
          },
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Log the email send action
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    SecurityLogger.loginSuccess(
      userId || 'admin',
      clientIp,
      `Admin email sent: ${type} to ${recipients.length} recipients`
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API] Admin email send error:', error);
    
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
    const session = await getServerSession() as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role || 'guest';
    if (!hasPermission(userRole, Permission.MANAGE_EMAIL_TEMPLATES)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get available email types and templates
    const templates = emailService.getAvailableTemplates();
    
    const emailTypes = [
      { 
        id: 'template', 
        name: 'Template Email', 
        description: 'Send emails using predefined templates',
        requiresTemplate: true,
      },
      { 
        id: 'job-alert', 
        name: 'Job Alert', 
        description: 'Send job alert notifications',
        requiresTemplate: false,
      },
      { 
        id: 'weekly-digest', 
        name: 'Weekly Digest', 
        description: 'Send weekly job digest emails',
        requiresTemplate: false,
      },
      { 
        id: 'welcome', 
        name: 'Welcome Email', 
        description: 'Send welcome emails to new users',
        requiresTemplate: false,
      },
      { 
        id: 'bulk-template', 
        name: 'Bulk Template Email', 
        description: 'Send bulk emails with rate limiting',
        requiresTemplate: true,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        emailTypes,
        templates: templates.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          requiredProps: t.requiredProps,
        })),
      },
    });

  } catch (error) {
    console.error('[API] Get email send options error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
