import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

// Schema for updating application status
const updateApplicationSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  status: z.enum([
    'pending',
    'reviewing',
    'interview',
    'offer',
    'rejected',
    'withdrawn',
  ]),
});

// GET /api/profile/applications - Get user's job applications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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
        { error: 'Only job seekers can view applications' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const status = url.searchParams.get('status');
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      userId: user.id,
      status: { not: 'saved' }, // Exclude saved jobs
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Get applications with job details
    const [applications, totalCount] = await Promise.all([
      prisma.jobApplication.findMany({
        where: whereClause,
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
              url: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.jobApplication.count({
        where: whereClause,
      }),
    ]);

    // Get status counts for summary
    const statusCounts = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: {
        userId: user.id,
        status: { not: 'saved' },
      },
      _count: {
        status: true,
      },
    });

    const statusSummary = statusCounts.reduce(
      (acc, item) => {
        if (item.status) {
          acc[item.status] = item._count.status;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // Format the response
    const formattedApplications = applications.map(app => ({
      id: app.id,
      status: app.status,
      appliedAt: app.appliedAt,
      coverLetter: app.coverLetter,
      resumeUrl: app.resumeUrl,
      linkedinUrl: app.linkedinUrl,
      job: {
        id: app.job.id,
        title: app.job.title,
        company: app.job.company,
        location: app.job.location,
        jobType: app.job.jobType,
        salaryMin: app.job.salaryMin,
        salaryMax: app.job.salaryMax,
        description: app.job.description,
        postedAt: app.job.postedAt,
        expiresAt: app.job.expiresAt,
        isRemote: app.job.isRemote,
        categories: app.job.categories,
        url: app.job.url,
      },
    }));

    return NextResponse.json({
      success: true,
      applications: formattedApplications,
      statusSummary,
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
    console.error('Get applications error:', error);
    return NextResponse.json(
      { error: 'Failed to get applications' },
      { status: 500 }
    );
  }
}

// PATCH /api/profile/applications - Update application status or notes
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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
        { error: 'Only job seekers can update applications' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { applicationId, status } = updateApplicationSchema.parse(body);

    // Check if application exists and belongs to user
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        userId: user.id,
      },
      include: {
        job: {
          select: {
            title: true,
            company: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update the application
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
    });

    // Log the status change for tracking (using AuditLog instead of UserActivity)
    await prisma.auditLog
      .create({
        data: {
          userId: user.id,
          action: 'application_status_updated',
          resource: 'job_application',
          resourceId: applicationId,
          details: {
            applicationId,
            jobId: application.jobId,
            jobTitle: application.job.title,
            company: application.job.company,
            oldStatus: application.status,
            newStatus: status,
            updatedAt: new Date().toISOString(),
          },
        },
      })
      .catch(error => {
        // Don't fail the request if activity logging fails
        console.error('Failed to log application status update:', error);
      });

    return NextResponse.json({
      success: true,
      message: `Updated application status to "${status}"`,
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status,
        job: updatedApplication.job,
      },
    });
  } catch (error) {
    console.error('Update application error:', error);

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
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/applications - Withdraw an application
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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

    // Update application status to withdrawn instead of deleting
    const updatedApplication = await prisma.jobApplication.updateMany({
      where: {
        id: applicationId,
        userId: user.id,
        status: { not: 'saved' }, // Don't allow withdrawing saved jobs
      },
      data: {
        status: 'withdrawn',
      },
    });

    if (updatedApplication.count === 0) {
      return NextResponse.json(
        { error: 'Application not found or cannot be withdrawn' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Application withdrawn successfully',
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw application' },
      { status: 500 }
    );
  }
}
