import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { prisma } from '@/components/ui/card';
import { z } from '@/components/ui/card';
import { EmailHelpers } from '@/lib/email/email-helpers';
import { sendEmail } from '@/lib/email';

const applySchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().optional(),
  resumeUrl: z.string().url().optional(),
  additionalInfo: z.string().optional(),
  questionResponses: z.record(z.string()).optional(), // question -> answer mapping
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
      select: { id: true, name: true, email: true, resumeUrl: true },
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = applySchema.parse(body);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get job details including application preferences and questions
    const job = await prisma.job.findUnique({
      where: { id: validatedData.jobId },
      select: {
        id: true,
        title: true,
        company: true,
        url: true,
        status: true,
        employerId: true,
        applicationMethod: true,
        externalApplicationUrl: true,
        applicationEmail: true,
        applicationInstructions: true,
        supplementalQuestions: true,
        questionsRequired: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'active') {
      return NextResponse.json(
        { error: 'This job is no longer accepting applications' },
        { status: 400 }
      );
    }

    // Validate required questions if they exist
    if (job.questionsRequired && job.supplementalQuestions && job.supplementalQuestions.length > 0) {
      const questionResponses = validatedData.questionResponses || {};
      const missingAnswers = [];

      for (let i = 0; i < job.supplementalQuestions.length; i++) {
        const question = job.supplementalQuestions[i];
        const answer = questionResponses[i.toString()] || questionResponses[question];

        if (!answer || answer.trim().length === 0) {
          missingAnswers.push(`Question ${i + 1}: ${question}`);
        }
      }

      if (missingAnswers.length > 0) {
        return NextResponse.json({
          error: 'Please answer all required questions',
          missingQuestions: missingAnswers,
        }, { status: 400 });
      }
    }

    // Handle different application methods
    if (job.applicationMethod === 'external_url') {
      // For external applications, we still record the intent but redirect to external URL
      const application = await prisma.jobApplication.create({
        data: {
          userId: user.id,
          jobId: validatedData.jobId,
          status: 'external_redirect',
          coverLetter: validatedData.coverLetter,
          resumeUrl: validatedData.resumeUrl || user.resumeUrl,
          questionResponses: validatedData.questionResponses || {},
          appliedAt: new Date(),
          applicationData: {
            method: 'external_url',
            externalUrl: job.externalApplicationUrl,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Redirecting to company application page',
        applicationId: application.id,
        externalUrl: job.externalApplicationUrl,
        requiresExternalApplication: true,
        nextSteps: 'Please complete your application on the company website.',
      }, { status: 201 });
    }

    if (job.applicationMethod === 'email') {
      // For email applications, create application record and send email
      const application = await prisma.jobApplication.create({
        data: {
          userId: user.id,
          jobId: validatedData.jobId,
          status: 'email_sent',
          coverLetter: validatedData.coverLetter,
          resumeUrl: validatedData.resumeUrl || user.resumeUrl,
          questionResponses: validatedData.questionResponses || {},
          appliedAt: new Date(),
          applicationData: {
            method: 'email',
            applicationEmail: job.applicationEmail,
          },
        },
      });

      // Send email application (implement this based on your email system)
      try {
        await sendEmailApplication({
          to: job.applicationEmail!,
          jobTitle: job.title,
          company: job.company,
          applicantName: user.name || 'Job Applicant',
          applicantEmail: user.email,
          coverLetter: validatedData.coverLetter,
          resumeUrl: validatedData.resumeUrl || user.resumeUrl,
          questionResponses: validatedData.questionResponses,
          applicationInstructions: job.applicationInstructions,
        });
      } catch (emailError) {
        console.error('Failed to send email application:', emailError);
        // Update application status to indicate email failure
        await prisma.jobApplication.update({
          where: { id: application.id },
          data: { status: 'email_failed' },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Application sent via email',
        applicationId: application.id,
        nextSteps: `Your application has been emailed to ${job.applicationEmail}. ${job.applicationInstructions || ''}`,
      }, { status: 201 });
    }

    // Check if user has already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId: validatedData.jobId,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 400 }
      );
    }

    // Create job application (internal method)
    const application = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        jobId: validatedData.jobId,
        status: 'applied',
        coverLetter: validatedData.coverLetter,
        resumeUrl: validatedData.resumeUrl || user.resumeUrl,
        questionResponses: validatedData.questionResponses || {},
        appliedAt: new Date(),
        applicationData: {
          method: 'internal',
        },
      },
    });

    // Send confirmation email to job seeker
    try {
      await EmailHelpers.sendApplicationConfirmation(user.email, {
        userName: user.name || user.email.split('@')[0],
        jobTitle: job.title,
        companyName: job.company || 'Company',
        applicationDate: new Date().toLocaleDateString(),
        jobUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${job.id}`,
      }, {
        userId: user.id,
        priority: 'normal',
      });
      console.log('📧 Application confirmation email sent to job seeker');
    } catch (emailError) {
      console.error('📧 Failed to send application confirmation email:', emailError);
    }

    // Send notification email to employer if job has an employerId
    if (job.employerId) {
      try {
        const employer = await prisma.user.findUnique({
          where: { id: job.employerId },
          select: { email: true, name: true },
        });

        if (employer?.email) {
          await EmailHelpers.sendNewApplicantNotification(employer.email, {
            employerName: employer.name || employer.email.split('@')[0],
            jobTitle: job.title,
            companyName: job.company || 'Your Company',
            applicantName: user.name || user.email.split('@')[0],
            applicantEmail: user.email,
            applicationDate: new Date().toLocaleDateString(),
            jobUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/employers/job/${job.id}`,
            applicantProfileUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/employers/applicants/${application.id}`,
          }, {
            userId: job.employerId,
            priority: 'high',
          });
          console.log('📧 New applicant notification email sent to employer');
        }
      } catch (emailError) {
        console.error('📧 Failed to send employer notification email:', emailError);
      }
    }

    // Log the application for tracking
    await prisma.auditLog
      .create({
        data: {
          userId: user.id,
          action: 'job_application_submitted',
          resource: 'job_application',
          resourceId: application.id,
          details: {
            jobId: job.id,
            jobTitle: job.title,
            company: job.company,
            applicationId: application.id,
            appliedAt: new Date().toISOString(),
          },
        },
      })
      .catch(error => {
        console.error('Failed to log job application:', error);
      });

    // If job has external URL, provide it for reference
    const response = {
      success: true,
      message: 'Application submitted successfully!',
      applicationId: application.id,
      externalUrl: job.url, // Include external URL if available
      nextSteps: job.url
        ? 'Your application has been recorded. You may also want to apply directly on the company website.'
        : 'Your application has been submitted and the employer will be notified.',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Job application error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid application data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRecord = await prisma.user.findUnique({
      where: { clerkId: userId! },
      select: { id: true, email: true },
    });

    if (!userRecord?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has already applied
    const application = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: userRecord.id,
          jobId: jobId,
        },
      },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        coverLetter: true,
      },
    });

    return NextResponse.json({
      hasApplied: !!application,
      application: application || null,
    });
  } catch (error) {
    console.error('Check application error:', error);
    return NextResponse.json(
      { error: 'Failed to check application status' },
      { status: 500 }
    );
  }
}

// Helper function to send email applications
async function sendEmailApplication({
  to,
  jobTitle,
  company,
  applicantName,
  applicantEmail,
  coverLetter,
  resumeUrl,
  questionResponses,
  applicationInstructions,
}: {
  to: string;
  jobTitle: string;
  company: string;
  applicantName: string;
  applicantEmail: string;
  coverLetter?: string;
  resumeUrl?: string;
  questionResponses?: Record<string, string>;
  applicationInstructions?: string;
}) {
  const subject = `Job Application: ${jobTitle} - ${applicantName}`;

  let emailBody = `
Dear Hiring Manager,

You have received a new job application through 209 Works for the position: ${jobTitle}

Applicant Details:
- Name: ${applicantName}
- Email: ${applicantEmail}
- Resume: ${resumeUrl || 'Not provided'}

${coverLetter ? `Cover Letter:\n${coverLetter}\n\n` : ''}`;

  // Add question responses if any
  if (questionResponses && Object.keys(questionResponses).length > 0) {
    emailBody += `Additional Questions:\n`;
    Object.entries(questionResponses).forEach(([question, answer], index) => {
      // Handle both index-based and question-based keys
      const questionText = isNaN(Number(question)) ? question : `Question ${Number(question) + 1}`;
      emailBody += `${questionText}: ${answer}\n`;
    });
    emailBody += '\n';
  }

  if (applicationInstructions) {
    emailBody += `Special Instructions: ${applicationInstructions}\n\n`;
  }

  emailBody += `
This application was submitted through 209 Works (209.works).

Best regards,
209 Works Team
  `;

  await sendEmail({
    to,
    subject,
    text: emailBody,
    priority: 'high',
  });
}
