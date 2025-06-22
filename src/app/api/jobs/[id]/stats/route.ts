import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

// GET /api/jobs/:id/stats - Get job statistics (employer only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;

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

    const jobId = (await params).id;

    // Verify the job belongs to this employer
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, employerId: true, title: true, company: true, postedAt: true },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.employerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get job statistics
    const [
      totalApplications,
      newApplications,
      shortlistedApplications,
      hiredApplications,
      recentApplications,
    ] = await Promise.all([
      // Total applications to this job
      prisma.jobApplication.count({
        where: {
          jobId: jobId,
          status: { not: 'saved' }, // Exclude saved jobs
        },
      }),

      // New applications (last 7 days)
      prisma.jobApplication.count({
        where: {
          jobId: jobId,
          status: { not: 'saved' },
          appliedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Shortlisted applications
      prisma.jobApplication.count({
        where: {
          jobId: jobId,
          status: 'shortlisted',
        },
      }),

      // Hired applications
      prisma.jobApplication.count({
        where: {
          jobId: jobId,
          status: 'hired',
        },
      }),

      // Recent applications (last 5)
      prisma.jobApplication.findMany({
        where: {
          jobId: jobId,
          status: { not: 'saved' },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              location: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        take: 5,
      }),
    ]);

    // Calculate trends (compare with previous period)
    const previousPeriodStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const previousApplications = await prisma.jobApplication.count({
      where: {
        jobId: jobId,
        status: { not: 'saved' },
        appliedAt: {
          gte: previousPeriodStart,
          lt: previousPeriodEnd,
        },
      },
    });

    // Calculate percentage change
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
    };

    const applicationTrend = calculateTrend(newApplications, previousApplications);

    // Format recent applicants
    const formattedApplicants = recentApplications.map(app => ({
      id: app.id,
      name: app.user.name || 'Anonymous',
      email: app.user.email,
      applied: formatTimeAgo(app.appliedAt),
      appliedAt: app.appliedAt,
      status: app.status || 'new',
      score: 85, // TODO: Implement actual scoring algorithm
      location: app.user.location || 'Not specified',
    }));

    // Job statistics
    const stats = {
      totalViews: 0, // TODO: Implement view tracking
      totalApplications,
      shortlisted: shortlistedApplications,
      hired: hiredApplications,
      trends: {
        applications: {
          current: newApplications,
          previous: previousApplications,
          change: applicationTrend,
          trend: newApplications >= previousApplications ? 'up' : 'down',
        },
      },
    };

    return NextResponse.json({
      stats,
      recentApplicants: formattedApplicants,
      jobInfo: {
        id: job.id,
        title: job.title,
        company: job.company,
        postedAt: job.postedAt,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job statistics' },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
