import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    // Calculate date ranges
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all statistics in parallel
    const [
      totalJobs,
      activeJobs,
      totalCompanies,
      totalUsers,
      recentJobs,
    ] = await Promise.all([
      // Total jobs ever created
      prisma.job.count(),
      
      // Active jobs (not expired, not closed)
      prisma.job.count({
        where: {
          status: {
            in: ['active', 'published']
          }
        }
      }),
      
      // Total companies (employers)
      prisma.user.count({
        where: {
          role: 'employer'
        }
      }),
      
      // Total users (all roles)
      prisma.user.count(),
      
      // Jobs posted in last 7 days
      prisma.job.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        }
      }),
    ]);

    const stats = {
      totalJobs,
      activeJobs,
      totalCompanies,
      totalUsers,
      recentJobs,
      lastUpdated: now.toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching platform statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform statistics' },
      { status: 500 }
    );
  }
}
