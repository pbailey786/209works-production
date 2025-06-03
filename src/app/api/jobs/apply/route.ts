import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import type { Session } from 'next-auth';

const applySchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().optional(),
  resumeUrl: z.string().url().optional(),
  additionalInfo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = applySchema.parse(body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true, resumeUrl: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: validatedData.jobId },
      select: {
        id: true,
        title: true,
        company: true,
        url: true,
        status: true,
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

    // Create job application
    const application = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        jobId: validatedData.jobId,
        status: 'applied',
        coverLetter: validatedData.coverLetter,
        resumeUrl: validatedData.resumeUrl || user.resumeUrl,
        appliedAt: new Date(),
      },
    });

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
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
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

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has already applied
    const application = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: user.id,
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
