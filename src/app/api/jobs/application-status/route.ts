import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

// GET /api/jobs/application-status - Check application status for multiple jobs
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're a job seeker
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'jobseeker') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const jobIdsParam = searchParams.get('jobIds');

    if (!jobIdsParam) {
      return NextResponse.json({ error: 'Job IDs are required' }, { status: 400 });
    }

    // Parse job IDs from comma-separated string
    const jobIds = jobIdsParam.split(',').filter(id => id.trim());

    if (jobIds.length === 0) {
      return NextResponse.json({ error: 'Valid job IDs are required' }, { status: 400 });
    }

    // Get applications for these jobs by this user
    const applications = await prisma.jobApplication.findMany({
      where: {
        userId: user.id,
        jobId: {
          in: jobIds,
        },
      },
      select: {
        jobId: true,
        status: true,
        appliedAt: true,
      },
    });

    // Create a map of jobId -> application status
    const applicationStatus: Record<string, {
      applied: boolean;
      status: string;
      appliedAt: string;
    }> = {};

    applications.forEach(app => {
      applicationStatus[app.jobId] = {
        applied: true,
        status: app.status || 'pending',
        appliedAt: app.appliedAt.toISOString(),
      };
    });

    // Ensure all requested job IDs are in the response
    jobIds.forEach(jobId => {
      if (!applicationStatus[jobId]) {
        applicationStatus[jobId] = {
          applied: false,
          status: '',
          appliedAt: '',
        };
      }
    });

    return NextResponse.json({
      success: true,
      applicationStatus,
    });
  } catch (error) {
    console.error('Error checking application status:', error);
    return NextResponse.json(
      { error: 'Failed to check application status' },
      { status: 500 }
    );
  }
}

// POST /api/jobs/application-status - Check application status for a single job
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRecord = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're a job seeker
    const userRecord = await prisma.user.findUnique({
      where: { email: user?.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'jobseeker') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'Valid job ID is required' }, { status: 400 });
    }

    // Check if user has applied to this job
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
      success: true,
      applied: !!application,
      application: application ? {
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt.toISOString(),
        hasCoverLetter: !!application.coverLetter,
      } : null,
    });
  } catch (error) {
    console.error('Error checking single job application status:', error);
    return NextResponse.json(
      { error: 'Failed to check application status' },
      { status: 500 }
    );
  }
}
