import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TemplateManager } from '@/lib/email/template-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const templateId = params.templateId;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Get template manager
    const templateManager = new TemplateManager();

    // Generate sample data based on template type
    const sampleData = getSampleDataForTemplate(templateId);

    try {
      // Render the template with sample data
      const rendered = await templateManager.renderTemplate(templateId, sampleData);

      if (format === 'html') {
        // Return raw HTML for new tab viewing
        return new NextResponse(rendered.html, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }

      // Return JSON with template data
      return NextResponse.json({
        templateId,
        subject: rendered.subject,
        html: rendered.html,
        sampleData,
      });

    } catch (templateError) {
      console.error('Template rendering error:', templateError);
      return NextResponse.json(
        { error: 'Failed to render template', details: templateError.message },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getSampleDataForTemplate(templateId: string) {
  const baseData = {
    user: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
    company: {
      name: '209 Works',
      website: 'https://209.works',
      logo: 'https://209.works/logo.png',
    },
    supportEmail: 'support@209.works',
    unsubscribeUrl: 'https://209.works/unsubscribe',
  };

  switch (templateId) {
    case 'welcome':
      return {
        ...baseData,
        welcomeMessage: 'Welcome to 209 Works! We\'re excited to help you find your next opportunity in the Central Valley.',
        nextSteps: [
          'Complete your profile',
          'Upload your resume',
          'Start browsing jobs',
        ],
      };

    case 'job-alert':
      return {
        ...baseData,
        jobs: [
          {
            id: '1',
            title: 'Software Developer',
            company: 'Tech Solutions Inc.',
            location: 'Modesto, CA',
            salary: '$75,000 - $95,000',
            url: 'https://209.works/jobs/1',
            description: 'Join our growing team as a Software Developer...',
          },
          {
            id: '2',
            title: 'Marketing Manager',
            company: 'Local Business Co.',
            location: 'Stockton, CA',
            salary: '$60,000 - $80,000',
            url: 'https://209.works/jobs/2',
            description: 'Lead our marketing efforts in the Central Valley...',
          },
        ],
        searchCriteria: 'Software Developer in Modesto, CA',
        totalJobs: 15,
      };

    case 'application-confirmation':
      return {
        ...baseData,
        job: {
          id: '1',
          title: 'Software Developer',
          company: 'Tech Solutions Inc.',
          location: 'Modesto, CA',
          url: 'https://209.works/jobs/1',
        },
        applicationDate: new Date().toLocaleDateString(),
        applicationId: 'APP-2024-001',
      };

    case 'employer-welcome':
      return {
        ...baseData,
        employer: {
          name: 'Tech Solutions Inc.',
          contactName: 'Jane Smith',
          email: 'jane@techsolutions.com',
        },
        dashboardUrl: 'https://209.works/employer/dashboard',
        postJobUrl: 'https://209.works/employer/post-job',
      };

    case 'password-reset':
      return {
        ...baseData,
        resetUrl: 'https://209.works/reset-password?token=sample-token',
        expiryTime: '24 hours',
      };

    case 'email-verification':
      return {
        ...baseData,
        verificationUrl: 'https://209.works/verify-email?token=sample-token',
        expiryTime: '24 hours',
      };

    default:
      return {
        ...baseData,
        message: 'This is a sample email template preview.',
        title: 'Sample Email',
      };
  }
}
