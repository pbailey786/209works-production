import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../auth/authOptions';
import { TemplateManager } from '@/lib/email/template-manager';
import { emailAgent } from '@/lib/agents/email-agent';

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as any;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('template') || 'welcome-job-seeker';
    const action = searchParams.get('action') || 'preview';
    const email = searchParams.get('email') || session.user.email;

    const templateManager = new TemplateManager();

    if (action === 'preview') {
      // Just preview the template
      try {
        const preview = await templateManager.previewTemplate(templateId);
        
        return NextResponse.json({
          success: true,
          templateId,
          preview: {
            subject: preview.subject,
            html: preview.html,
            text: preview.text,
            htmlLength: preview.html.length,
            htmlPreview: preview.html.substring(0, 200) + '...',
          },
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          templateId,
        });
      }
    } else if (action === 'send') {
      // Send test email
      try {
        const rendered = await templateManager.previewTemplate(templateId);
        
        const result = await emailAgent.sendEmail({
          id: `debug_${templateId}_${Date.now()}`,
          to: [email],
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          template: templateId,
          priority: 'normal',
          tags: [
            { name: 'debug', value: 'true' },
            { name: 'template', value: templateId },
          ],
        });

        return NextResponse.json({
          success: result.success,
          templateId,
          email,
          result,
          preview: {
            subject: rendered.subject,
            htmlLength: rendered.html.length,
            htmlPreview: rendered.html.substring(0, 200) + '...',
          },
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          templateId,
          email,
        });
      }
    } else {
      return NextResponse.json({
        error: 'Invalid action. Use ?action=preview or ?action=send',
        availableTemplates: templateManager.getAllTemplatesArray().map(t => t.id),
        usage: {
          preview: '/api/debug/email-template?template=welcome-job-seeker&action=preview',
          send: '/api/debug/email-template?template=welcome-job-seeker&action=send&email=test@example.com',
        },
      });
    }

  } catch (error) {
    console.error('Debug email template error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
    const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } }; // Mock session

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, email, templateProps } = body;

    if (!templateId || !email) {
      return NextResponse.json({ 
        error: 'templateId and email are required',
        example: {
          templateId: 'welcome-job-seeker',
          email: 'test@example.com',
          templateProps: { userName: 'Test User' }
        }
      }, { status: 400 });
    }

    const templateManager = new TemplateManager();

    try {
      // Render template with custom props
      const rendered = await templateManager.renderTemplate(templateId, templateProps || {});
      
      // Send email
      const result = await emailAgent.sendEmail({
        id: `debug_custom_${templateId}_${Date.now()}`,
        to: [email],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        template: templateId,
        priority: 'normal',
        tags: [
          { name: 'debug', value: 'true' },
          { name: 'template', value: templateId },
          { name: 'custom_props', value: 'true' },
        ],
      });

      return NextResponse.json({
        success: result.success,
        templateId,
        email,
        templateProps,
        result,
        preview: {
          subject: rendered.subject,
          htmlLength: rendered.html.length,
          htmlPreview: rendered.html.substring(0, 200) + '...',
        },
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId,
        email,
        templateProps,
      });
    }

  } catch (error) {
    console.error('Debug email template POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
