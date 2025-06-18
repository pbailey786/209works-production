import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import type { Session } from 'next-auth';

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
  notes: z.string().optional(),
});

// GET /api/employers/applications - Get applications for employer's jobs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're an employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const jobId = searchParams.get('jobId');
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      job: {
        employerId: user.id,
      },
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (jobId) {
      whereClause.jobId = jobId;
    }

    // Get applications with job and user details
    const [applications, totalCount, statusSummary] = await Promise.all([
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
              postedAt: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              resumeUrl: true,
              bio: true,
              skills: true,
              location: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        skip: offset,
        take: limit,
      }),

      // Total count for pagination
      prisma.jobApplication.count({
        where: whereClause,
      }),

      // Status summary for employer
      prisma.jobApplication.groupBy({
        by: ['status'],
        where: {
          job: {
            employerId: user.id,
          },
        },
        _count: {
          status: true,
        },
      }),
    ]);

    // Format status summary
    const formattedStatusSummary = statusSummary.reduce((acc, item) => {
      acc[item.status || 'pending'] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      statusSummary: formattedStatusSummary,
    });
  } catch (error) {
    console.error('Error fetching employer applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// PATCH /api/employers/applications - Update application status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're an employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateApplicationSchema.parse(body);

    // Verify the application belongs to this employer's job
    const application = await prisma.jobApplication.findUnique({
      where: { id: validatedData.applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            employerId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

    if (application.job.employerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update application status
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: validatedData.applicationId },
      data: {
        status: validatedData.status,
        ...(validatedData.notes && { notes: validatedData.notes }),
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log the status change for tracking
    await prisma.auditLog
      .create({
        data: {
          userId: user.id,
          action: 'application_status_updated_by_employer',
          resource: 'job_application',
          resourceId: validatedData.applicationId,
          details: {
            applicationId: validatedData.applicationId,
            jobId: application.job.id,
            jobTitle: application.job.title,
            applicantId: application.user.id,
            applicantName: application.user.name,
            oldStatus: application.status,
            newStatus: validatedData.status,
            notes: validatedData.notes,
            updatedAt: new Date().toISOString(),
          },
        },
      })
      .catch(error => {
        console.error('Failed to log application status update:', error);
      });

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: 'Application status updated successfully',
    });
  } catch (error) {
    console.error('Error updating application status:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update application status' },
      { status: 500 }
    );
  }
}
