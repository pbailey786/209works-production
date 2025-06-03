import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import type { Session } from 'next-auth';

// Schema for saving/unsaving jobs
const saveJobSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  action: z.enum(['save', 'unsave']),
});

// GET /api/profile/saved-jobs - Get user's saved jobs
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'jobseeker') {
      return NextResponse.json(
        { error: 'Only job seekers can save jobs' },
        { status: 403 }
      );
    }

    // Get pagination parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    // Get saved jobs with job details
    const [savedJobs, totalCount] = await Promise.all([
      prisma.jobApplication.findMany({
        where: {
          userId: user.id,
          status: 'saved',
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
              description: true,
              postedAt: true,
              expiresAt: true,
              isRemote: true,
              categories: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.jobApplication.count({
        where: {
          userId: user.id,
          status: 'saved',
        },
      }),
    ]);

    // Format the response
    const formattedJobs = savedJobs.map(savedJob => ({
      id: savedJob.job.id,
      title: savedJob.job.title,
      company: savedJob.job.company,
      location: savedJob.job.location,
      jobType: savedJob.job.jobType,
      salaryMin: savedJob.job.salaryMin,
      salaryMax: savedJob.job.salaryMax,
      description: savedJob.job.description,
      postedAt: savedJob.job.postedAt,
      expiresAt: savedJob.job.expiresAt,
      isRemote: savedJob.job.isRemote,
      categories: savedJob.job.categories,
      savedAt: savedJob.appliedAt,
      applicationId: savedJob.id,
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to get saved jobs' },
      { status: 500 }
    );
  }
}

// POST /api/profile/saved-jobs - Save or unsave a job
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'jobseeker') {
      return NextResponse.json(
        { error: 'Only job seekers can save jobs' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { jobId, action } = saveJobSchema.parse(body);

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, title: true, company: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (action === 'save') {
      // Check if already saved
      const existingSave = await prisma.jobApplication.findFirst({
        where: {
          userId: user.id,
          jobId: jobId,
          status: 'saved',
        },
      });

      if (existingSave) {
        return NextResponse.json({
          success: true,
          message: 'Job already saved',
          alreadySaved: true,
        });
      }

      // Save the job
      const savedJob = await prisma.jobApplication.create({
        data: {
          userId: user.id,
          jobId: jobId,
          status: 'saved',
          appliedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Saved "${job.title}" at ${job.company}`,
        applicationId: savedJob.id,
      });
    } else if (action === 'unsave') {
      // Remove the saved job
      const deletedSave = await prisma.jobApplication.deleteMany({
        where: {
          userId: user.id,
          jobId: jobId,
          status: 'saved',
        },
      });

      if (deletedSave.count === 0) {
        return NextResponse.json(
          { error: 'Job was not saved' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Removed "${job.title}" from saved jobs`,
      });
    }
  } catch (error) {
    console.error('Save/unsave job error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save/unsave job' },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/saved-jobs - Remove a saved job by application ID
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'jobseeker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const url = new URL(req.url);
    const applicationId = url.searchParams.get('id');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Delete the saved job application
    const deletedSave = await prisma.jobApplication.deleteMany({
      where: {
        id: applicationId,
        userId: user.id,
        status: 'saved',
      },
    });

    if (deletedSave.count === 0) {
      return NextResponse.json(
        { error: 'Saved job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Removed job from saved list',
    });
  } catch (error) {
    console.error('Delete saved job error:', error);
    return NextResponse.json(
      { error: 'Failed to remove saved job' },
      { status: 500 }
    );
  }
}
