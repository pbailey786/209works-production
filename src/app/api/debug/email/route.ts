import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { emailService } from '@/lib/email/email-service';
import { templateManager } from '@/lib/email/template-manager';
import { emailAgent } from '@/lib/agents/email-agent';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });
    if (!user?.email || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasResendKey: !!process.env.RESEND_API_KEY,
        resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
        resendEmailFrom: process.env.RESEND_EMAIL_FROM || 'not set',
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'not set',
      },
      templates: {},
      emailAgent: {},
      errors: [],
    };

    // Test template manager
    try {
      const templates = templateManager.getAllTemplatesArray();
      debugInfo.templates = {
        count: templates.length,
        available: templates.map((t: any) => ({ id: t.id, name: t.name, category: t.category })),
      };

      // Test template rendering
      try {
        const welcomePreview = await templateManager.previewTemplate('welcome-email');
        debugInfo.templates.welcomePreview = {
          hasHtml: !!welcomePreview.html,
          htmlLength: welcomePreview.html?.length || 0,
          hasText: !!welcomePreview.text,
          subject: welcomePreview.subject,
          htmlPreview: welcomePreview.html?.substring(0, 200) + '...',
        };
      } catch (error) {
        debugInfo.errors.push(`Template preview error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    } catch (error) {
      debugInfo.errors.push(`Template manager error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    // Test email agent configuration
    try {
      const configTest = await emailAgent.testConfiguration();
      debugInfo.emailAgent = {
        configurationTest: configTest,
      };
    } catch (error) {
      debugInfo.errors.push(`Email agent error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    // Test email service
    try {
      const availableTemplates = emailService.getAvailableTemplates();
      debugInfo.emailService = {
        templateCount: availableTemplates.length,
        templates: availableTemplates.map((t: any) => t.id),
      };
    } catch (error) {
      debugInfo.errors.push(`Email service error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Email debug error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get email debug info',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });
    if (!user?.email || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, email } = body;

    if (action === 'test-simple-email' && email) {
      // Test sending a very simple email directly through Resend
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const result = await resend.emails.send({
          from: process.env.RESEND_EMAIL_FROM || 'noreply@209.works',
          to: email,
          subject: '209 Works - Simple Test Email',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #2d4a3e;">209 Works Email Test</h1>
              <p>This is a simple test email sent directly through Resend API.</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
              <p>If you received this email, the basic email configuration is working!</p>
            </div>
          `,
          text: `209 Works Email Test - This is a simple test email sent directly through Resend API. Timestamp: ${new Date().toISOString()}`,
        });

        return NextResponse.json({
          success: true,
          message: 'Simple test email sent successfully',
          result: result.data,
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Failed to send simple test email',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (action === 'test-template-email' && email) {
      // Test sending through our email system
      try {
        const result = await emailService.sendTestEmail(email, 'welcome-email', {
          userName: 'Debug Test User',
          userType: 'job_seeker',
        });

        return NextResponse.json({
          success: result.success,
          message: result.success ? 'Template test email sent successfully' : 'Template test email failed',
          result: result,
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Failed to send template test email',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action or missing email' }, { status: 400 });

  } catch (error) {
    console.error('Email debug test error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run email debug test',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
