import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session-validator';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🔍 Dashboard stats API called');

    // Check authentication using modern session validator
    const { user: authUser } = await requireRole(['employer', 'admin']);

    console.log('🔍 Session check:', {
      hasUser: !!authUser,
      hasEmail: !!authUser?.email,
      hasId: !!authUser?.id,
      userEmail: authUser?.email,
      userId: authUser?.id
    });

    console.log('✅ User authenticated as employer, fetching stats...');

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch employer-specific statistics with timeout protection
    let stats;
    try {
      console.log('🔍 Executing database queries for user:', authUser.id);

      const queryTimeout = 5000; // 5 second timeout
      const queryPromise = Promise.all([
        // Total jobs posted by this employer
        prisma.job.count({
          where: {
            employerId: authUser.id,
            deletedAt: null // Exclude soft-deleted jobs
          }
        }),

        // Active jobs by this employer
        prisma.job.count({
          where: {
            employerId: authUser.id,
            status: {
              in: ['active', 'published']
            },
            deletedAt: null
          }
        }),

        // Total applications to this employer's jobs
        prisma.jobApplication.count({
          where: {
            job: {
              employerId: authUser.id,
              deletedAt: null
            }
          }
        }),

        // New applications in last 30 days
        prisma.jobApplication.count({
          where: {
            job: {
              employerId: authUser.id,
              deletedAt: null
            },
            appliedAt: {
              gte: thirtyDaysAgo
            }
          }
        }),
      ]);

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), queryTimeout);
      });

      const [
        totalJobs,
        activeJobs,
        totalApplications,
        newApplications,
      ] = await Promise.race([queryPromise, timeoutPromise]) as number[];

      stats = {
        totalJobs,
        activeJobs,
        totalApplications,
        newApplications
      };

      console.log('✅ Database queries completed:', stats);

    } catch (dbError) {
      console.error('❌ Database query error:', dbError);

      // Return default stats if database fails
      stats = {
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        newApplications: 0
      };

      console.log('⚠️ Using default stats due to database error');
    }

    // Calculate profile views (placeholder - you can implement view tracking)
    const profileViews = 0; // TODO: Implement view tracking

    // Calculate response rate (placeholder)
    const responseRate = stats.totalApplications > 0 ?
      Math.round((stats.newApplications / stats.totalApplications) * 100) : 0;

    const finalStats = {
      ...stats,
      profileViews,
      responseRate,
      lastUpdated: now.toISOString(),
      queryTime: Date.now() - startTime
    };

    console.log('✅ Dashboard stats response:', finalStats);

    return NextResponse.json(finalStats);

  } catch (error) {
    console.error('❌ Unexpected error in dashboard stats API:', error);

    // Return structured error response
    const errorResponse = {
      error: 'Internal Server Error',
      message: 'Failed to fetch employer dashboard stats',
      timestamp: new Date().toISOString(),
      queryTime: Date.now() - startTime
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
