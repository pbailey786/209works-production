import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import JobAlertEmail from '@/components/emails/job-alert-email';

export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Test data for the email
    const testJobData = {
      userName: 'Test User',
      jobTitle: 'Senior Software Developer',
      companyName: 'Tech Innovations Inc.',
      location: 'Modesto, CA',
      salary: '$80,000 - $120,000',
      jobType: 'Full-time',
      description:
        'We are seeking a talented Senior Software Developer to join our growing team. You will be responsible for developing scalable web applications, collaborating with cross-functional teams, and mentoring junior developers. This is an excellent opportunity to work with modern technologies and make a significant impact.',
      jobUrl: 'https://209jobs.com/jobs/test-job',
      unsubscribeUrl: 'https://209jobs.com/unsubscribe',
    };

    // Send test email
    const result = await sendEmail({
      to,
      subject: '🧪 Test: New Job Alert - Senior Software Developer',
      react: JobAlertEmail(testJobData),
    });

    if (result.success) {
      return NextResponse.json({
        message: 'Test email sent successfully!',
        emailId:
          (result as any).data?.id ||
          (result as any).id ||
          (result as any).messageId ||
          'unknown',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send test email', details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message:
      'Email test endpoint is ready. Send a POST request with {"to": "your-email@example.com"} to test.',
    endpoints: {
      test: 'POST /api/test/email',
      body: { to: 'your-email@example.com' },
    },
  });
}
