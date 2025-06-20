import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

// GET /api/dashboard/application-stats - Get application statistics for job seeker
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== 'jobseeker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get application statistics
    const [
      totalApplications,
      pendingApplications,
      interviewsScheduled,
      offersReceived,
      savedJobs,
      profileViews,
      applications,
    ] = await Promise.all([
      // Total applications
      prisma.jobApplication.count({
        where: {
          userId: user.id,
          status: { notIn: ['saved', 'archived'] },
        },
      }),

      // Pending applications
      prisma.jobApplication.count({
        where: {
          userId: user.id,
          status: 'pending',
        },
      }),

      // Interviews scheduled
      prisma.jobApplication.count({
        where: {
          userId: user.id,
          status: 'interview',
        },
      }),

      // Offers received
      prisma.jobApplication.count({
        where: {
          userId: user.id,
          status: 'offer',
        },
      }),

      // Saved jobs
      prisma.jobApplication.count({
        where: {
          userId: user.id,
          status: 'saved',
        },
      }),

      // Profile views (from audit logs)
      prisma.auditLog.count({
        where: {
          action: 'profile_viewed',
          details: {
            path: ['userId'],
            equals: user.id,
          },
        },
      }),

      // All applications for response rate calculation
      prisma.jobApplication.findMany({
        where: {
          userId: user.id,
          status: { notIn: ['saved', 'archived'] },
        },
        select: {
          status: true,
          appliedAt: true,
        },
      }),
    ]);

    // Calculate response rate
    let responseRate = 0;
    if (totalApplications > 0) {
      const responsesReceived = applications.filter(app => 
        app.status !== 'pending' && app.status !== 'reviewing'
      ).length;
      responseRate = Math.round((responsesReceived / totalApplications) * 100);
    }

    const stats = {
      totalApplications,
      pendingApplications,
      interviewsScheduled,
      offersReceived,
      savedJobs,
      profileViews,
      responseRate,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching application stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application stats' },
      { status: 500 }
    );
  }
}
