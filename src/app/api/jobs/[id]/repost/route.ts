import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { JobPostingCreditsService } from '@/lib/services/job-posting-credits';

// Type for NextAuth session
interface AuthSession {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = (await getServerSession(authOptions)) as AuthSession;
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'employer') {
      return NextResponse.json(
        { error: 'Only employers can repost jobs' },
        { status: 403 }
      );
    }

    const { id: jobId } = await params;

    // Get the job and verify ownership
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        company: true,
        employerId: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.employerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only repost your own jobs' },
        { status: 403 }
      );
    }

    // Check if user has job posting credits
    const canPost = await JobPostingCreditsService.canPostJob(user.id);
    if (!canPost) {
      return NextResponse.json(
        {
          error: 'No job posting credits available',
          code: 'NO_CREDITS',
          message: 'You need job posting credits to repost this job. Purchase credits or a new package.',
        },
        { status: 402 } // Payment Required
      );
    }

    // Use a job posting credit for the repost
    const creditResult = await JobPostingCreditsService.useJobPostCredit(user.id, jobId);
    
    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.error || 'Failed to use job posting credit' },
        { status: 402 }
      );
    }

    // Update the job with new expiration date and active status
    const newExpirationDate = new Date();
    // Check if this was a free basic post (shorter duration)
    const isFreePost = existingJob.source === 'free_basic_post';
    newExpirationDate.setDate(newExpirationDate.getDate() + (isFreePost ? 7 : 30));

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'active',
        expiresAt: newExpirationDate,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        company: true,
        status: true,
        expiresAt: true,
        postedAt: true,
      },
    });

    // Get updated credits
    const updatedCredits = await JobPostingCreditsService.getUserCredits(user.id);

    return NextResponse.json({
      success: true,
      message: 'Job reposted successfully',
      job: updatedJob,
      creditsRemaining: updatedCredits.jobPost,
      newExpirationDate: newExpirationDate.toISOString(),
    });

  } catch (error) {
    console.error('Error reposting job:', error);
    return NextResponse.json(
      { error: 'Failed to repost job' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if a job can be reposted
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = (await getServerSession(authOptions)) as AuthSession;
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id: jobId } = await params;

    // Get the job and verify ownership
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        employerId: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.employerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only check your own jobs' },
        { status: 403 }
      );
    }

    // Check if user has credits
    const hasCredits = await JobPostingCreditsService.canPostJob(user.id);
    const userCredits = await JobPostingCreditsService.getUserCredits(user.id);

    // Determine if job can be reposted
    const isExpired = job.expiresAt && new Date(job.expiresAt) < new Date();
    const isInactive = job.status !== 'active';
    const canRepost = (isExpired || isInactive) && hasCredits;

    return NextResponse.json({
      canRepost,
      hasCredits,
      creditsAvailable: userCredits.jobPost,
      jobStatus: job.status,
      isExpired,
      expiresAt: job.expiresAt,
      reasons: {
        noCredits: !hasCredits,
        jobActive: job.status === 'active' && !isExpired,
      },
    });

  } catch (error) {
    console.error('Error checking repost eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check repost eligibility' },
      { status: 500 }
    );
  }
}
