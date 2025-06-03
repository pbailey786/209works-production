import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/app/api/auth/prisma';

// GET /api/jobs/save - Get saved jobs for the authenticated user
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get saved jobs for the user
    const savedJobs = await prisma.savedJob.findMany({
      where: {
        userId: user.id,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            jobType: true,
            salaryMin: true,
            salaryMax: true,
            postedAt: true,
            description: true,
            categories: true,
            url: true,
          },
        },
      },
      orderBy: {
        savedAt: 'desc',
      },
    });

    return NextResponse.json({
      savedJobs: savedJobs.map(save => ({
        ...save.job,
        savedAt: save.savedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/jobs/save - Save or unsave a job for the authenticated user
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if job is already saved by this user
    const existingSave = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId: jobId,
        },
      },
    });

    if (existingSave) {
      // Remove the saved job
      await prisma.savedJob.delete({
        where: {
          userId_jobId: {
            userId: user.id,
            jobId: jobId,
          },
        },
      });

      return NextResponse.json({
        saved: false,
        message: 'Job removed from saved jobs',
      });
    } else {
      // Save the job
      await prisma.savedJob.create({
        data: {
          userId: user.id,
          jobId: jobId,
        },
      });

      return NextResponse.json({
        saved: true,
        message: 'Job saved successfully',
      });
    }
  } catch (error) {
    console.error('Error saving job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
