import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🔍 Dashboard stats API called');

    // Get session with enhanced logging - NextAuth v5 beta
    const session = await auth() as Session | null;

    console.log('🔍 Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasEmail: !!session?.user?.email,
      hasId: !!(session?.user as any)?.id,
      userEmail: session?.user?.email,
      userId: (session?.user as any)?.id
    });

    if (!session?.user?.email) {
      console.warn('❌ No session or user email found');
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'No valid session found'
      }, { status: 401 });
    }

    // Get the current user with enhanced error handling
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          role: true,
          name: true
        }
      });

      console.log('🔍 User lookup result:', {
        found: !!user,
        userId: user?.id,
        userRole: user?.role
      });
    } catch (dbError) {
      console.error('❌ Database error during user lookup:', dbError);
      return NextResponse.json({
        error: 'Database Error',
        message: 'Failed to verify user credentials'
      }, { status: 500 });
    }

    if (!user) {
      console.warn('❌ User not found in database:', session.user.email);
      return NextResponse.json({
        error: 'User Not Found',
        message: 'User account not found in database'
      }, { status: 404 });
    }

    if (user.role !== 'employer') {
      console.warn('❌ User is not an employer:', { userId: user.id, role: user.role });
      return NextResponse.json({
        error: 'Forbidden',
        message: 'Access denied. Employer role required.'
      }, { status: 403 });
    }

    console.log('✅ User authenticated as employer, fetching stats...');

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch employer-specific statistics with timeout protection
    let stats;
    try {
      console.log('🔍 Executing database queries for user:', user.id);

      const queryTimeout = 5000; // 5 second timeout
      const queryPromise = Promise.all([
        // Total jobs posted by this employer
        prisma.job.count({
          where: {
            employerId: user.id,
            deletedAt: null // Exclude soft-deleted jobs
          }
        }),

        // Active jobs by this employer
        prisma.job.count({
          where: {
            employerId: user.id,
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
              employerId: user.id,
              deletedAt: null
            }
          }
        }),

        // New applications in last 30 days
        prisma.jobApplication.count({
          where: {
            job: {
              employerId: user.id,
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
