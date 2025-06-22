import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch employer-specific statistics
    const [
      totalJobs,
      activeJobs,
      totalApplications,
      newApplications,
    ] = await Promise.all([
      // Total jobs posted by this employer
      prisma.job.count({
        where: {
          employerId: user.id
        }
      }),
      
      // Active jobs by this employer
      prisma.job.count({
        where: {
          employerId: user.id,
          status: {
            in: ['active', 'published']
          }
        }
      }),
      
      // Total applications to this employer's jobs
      prisma.jobApplication.count({
        where: {
          job: {
            employerId: user.id
          }
        }
      }),

      // New applications in last 30 days
      prisma.jobApplication.count({
        where: {
          job: {
            employerId: user.id
          },
          appliedAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
    ]);

    // Calculate profile views (placeholder - you can implement view tracking)
    const profileViews = 0; // TODO: Implement view tracking

    // Calculate response rate (placeholder)
    const responseRate = totalApplications > 0 ? 
      Math.round((newApplications / totalApplications) * 100) : 0;

    const stats = {
      totalJobs,
      activeJobs,
      totalApplications,
      newApplications,
      profileViews,
      responseRate,
      lastUpdated: now.toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching employer dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employer dashboard stats' },
      { status: 500 }
    );
  }
}
