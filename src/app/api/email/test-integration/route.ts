import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { EmailHelpers } from '@/lib/email/email-helpers';
import type { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const session = await getServerSession() as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users to test email integration
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { testType, recipientEmail } = body;

    if (!testType || !recipientEmail) {
      return NextResponse.json(
        { error: 'testType and recipientEmail are required' },
        { status: 400 }
      );
    }

    const testResults: any = {
      testType,
      recipientEmail,
      timestamp: new Date().toISOString(),
      success: false,
      error: null,
    };

    try {
      switch (testType) {
        case 'welcome_job_seeker':
          await EmailHelpers.sendWelcomeEmail(recipientEmail, {
            userName: 'Test User',
            userType: 'job_seeker',
          }, {
            userId: 'test-user-id',
            priority: 'normal',
          });
          testResults.message = 'Welcome email (job seeker) sent successfully';
          break;

        case 'welcome_employer':
          await EmailHelpers.sendWelcomeEmail(recipientEmail, {
            userName: 'Test Employer',
            userType: 'employer',
          }, {
            userId: 'test-employer-id',
            priority: 'normal',
          });
          testResults.message = 'Welcome email (employer) sent successfully';
          break;

        case 'password_reset':
          await EmailHelpers.sendPasswordReset(recipientEmail, {
            userName: 'Test User',
            resetUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=test-token`,
          }, {
            userId: 'test-user-id',
            priority: 'urgent',
          });
          testResults.message = 'Password reset email sent successfully';
          break;

        case 'application_confirmation':
          await EmailHelpers.sendApplicationConfirmation(recipientEmail, {
            userName: 'Test User',
            jobTitle: 'Software Developer',
            companyName: 'Test Company',
            applicationDate: new Date().toLocaleDateString(),
            jobUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/123`,
          }, {
            userId: 'test-user-id',
            priority: 'normal',
          });
          testResults.message = 'Application confirmation email sent successfully';
          break;

        case 'job_alert':
          await EmailHelpers.sendJobAlert(recipientEmail, {
            userName: 'Test User',
            jobTitle: 'Software Developer',
            companyName: 'Test Company',
            location: 'Modesto, CA',
            salary: '$80,000 - $100,000',
            jobType: 'Full-time',
            description: 'Exciting opportunity to join our development team in the 209 area. We are looking for a talented developer to help build innovative solutions.',
            jobUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/123`,
            unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/email-alerts/unsubscribe?email=${encodeURIComponent(recipientEmail)}&type=job_alert`,
          }, {
            userId: 'test-user-id',
            priority: 'normal',
          });
          testResults.message = 'Job alert email sent successfully';
          break;

        case 'weekly_digest':
          await EmailHelpers.sendWeeklyDigest(recipientEmail, {
            userName: 'Test User',
            jobs: [
              {
                id: '123',
                title: 'Software Developer',
                company: 'Test Company',
                location: 'Modesto, CA',
                salary: '$80,000 - $100,000',
                url: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/123`,
              },
              {
                id: '124',
                title: 'Frontend Developer',
                company: 'Another Company',
                location: 'Stockton, CA',
                salary: '$70,000 - $90,000',
                url: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/124`,
              },
            ],
            unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/email-alerts/unsubscribe?email=${encodeURIComponent(recipientEmail)}&type=weekly_digest`,
          }, {
            userId: 'test-user-id',
            priority: 'low',
          });
          testResults.message = 'Weekly digest email sent successfully';
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid test type' },
            { status: 400 }
          );
      }

      testResults.success = true;

    } catch (emailError) {
      console.error('Email test error:', emailError);
      testResults.error = emailError instanceof Error ? emailError.message : String(emailError);
      testResults.message = 'Email test failed';
    }

    return NextResponse.json(testResults);

  } catch (error) {
    console.error('Email integration test error:', error);
    return NextResponse.json(
      { error: 'Failed to run email integration test' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({
      message: 'Email Integration Test Endpoint',
      availableTests: [
        'welcome_job_seeker',
        'welcome_employer', 
        'password_reset',
        'application_confirmation',
        'job_alert',
        'weekly_digest',
      ],
      usage: {
        method: 'POST',
        body: {
          testType: 'welcome_job_seeker',
          recipientEmail: 'test@example.com',
        },
      },
      environment: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      },
    });

  } catch (error) {
    console.error('Email integration test info error:', error);
    return NextResponse.json(
      { error: 'Failed to get email integration test info' },
      { status: 500 }
    );
  }
}
