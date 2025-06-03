import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import JobAlertEmail from '@/components/emails/job-alert-email';
import WeeklyDigestEmail from '@/components/emails/weekly-digest-email';

export async function POST(req: NextRequest) {
  try {
    const { to, type = 'job_alert' } = await req.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    if (type === 'job_alert') {
      // Test job alert email
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
        unsubscribeUrl:
          'https://209jobs.com/api/email-alerts/unsubscribe?token=test-token',
      };

      const result = await sendEmail({
        to,
        subject: '🎯 New Job Alert: Senior Software Developer in Modesto',
        react: JobAlertEmail(testJobData),
      });

      return NextResponse.json({
        message: 'Job alert email sent successfully!',
        type: 'job_alert',
        emailId:
          (result as any).data?.id ||
          (result as any).id ||
          (result as any).messageId ||
          'unknown',
      });
    } else if (type === 'weekly_digest') {
      // Test weekly digest email
      const testJobs = [
        {
          id: '1',
          title: 'Frontend Developer',
          company: 'StartupCo',
          location: 'Stockton, CA',
          salary: '$70,000 - $90,000',
          jobType: 'Full-time',
          postedDate: '2 days ago',
          url: 'https://209jobs.com/jobs/1',
        },
        {
          id: '2',
          title: 'Marketing Manager',
          company: 'GrowthCorp',
          location: 'Tracy, CA',
          jobType: 'Full-time',
          postedDate: '1 day ago',
          url: 'https://209jobs.com/jobs/2',
        },
        {
          id: '3',
          title: 'Data Analyst',
          company: 'DataDriven LLC',
          location: 'Modesto, CA',
          salary: '$65,000 - $85,000',
          jobType: 'Full-time',
          postedDate: '3 days ago',
          url: 'https://209jobs.com/jobs/3',
        },
      ];

      const testDigestData = {
        userName: 'Test User',
        jobs: testJobs,
        location: '209 Area',
        unsubscribeUrl:
          'https://209jobs.com/api/email-alerts/unsubscribe?token=test-token',
        manageAlertsUrl: 'https://209jobs.com/dashboard/alerts',
      };

      const result = await sendEmail({
        to,
        subject: '📊 Your Weekly Job Digest: 3 New Jobs in 209 Area',
        react: WeeklyDigestEmail(testDigestData),
      });

      return NextResponse.json({
        message: 'Weekly digest email sent successfully!',
        type: 'weekly_digest',
        emailId:
          (result as any).data?.id ||
          (result as any).id ||
          (result as any).messageId ||
          'unknown',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid email type. Use "job_alert" or "weekly_digest"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Test email alerts error:', error);
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
    message: 'Email Alert System Test Endpoint',
    description: 'Send a POST request to test the email alert system',
    endpoints: {
      test_job_alert: {
        method: 'POST',
        body: {
          to: 'your-email@example.com',
          type: 'job_alert',
        },
      },
      test_weekly_digest: {
        method: 'POST',
        body: {
          to: 'your-email@example.com',
          type: 'weekly_digest',
        },
      },
    },
    status: 'Email Alert System is operational ✅',
    features: [
      '✅ Resend integration configured',
      '✅ React Email templates created',
      '✅ Database models implemented',
      '✅ API endpoints functional',
      '✅ Unsubscribe system ready',
      '🔄 Next: Job matching and scheduling',
    ],
  });
}
