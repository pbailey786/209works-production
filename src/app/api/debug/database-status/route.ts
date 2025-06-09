import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    // First, let's check if we can even get a session
    let session: Session | null = null;
    try {
      session = await getServerSession(authOptions) as Session | null;
    } catch (sessionError) {
      return NextResponse.json({
        success: false,
        error: 'Session error',
        message: sessionError instanceof Error ? sessionError.message : 'Unknown session error'
      }, { status: 500 });
    }

    // Only allow admin access
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - No session or email' }, { status: 401 });
    }

    // Try to find the user
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
    } catch (userError) {
      return NextResponse.json({
        success: false,
        error: 'Database error when finding user',
        message: userError instanceof Error ? userError.message : 'Unknown user lookup error'
      }, { status: 500 });
    }

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const status = {
      connection: false,
      tables: {} as Record<string, string>,
      counts: {} as Record<string, number>,
      issues: [] as string[],
      timestamp: new Date().toISOString()
    };

    try {
      // Test basic connection
      console.log('Attempting to connect to database...');
      await prisma.$connect();
      console.log('Database connection successful');
      status.connection = true;

      // Check each table
      const tables = ['chatHistory', 'savedJob', 'jobApplication', 'job', 'user'];
      
      for (const table of tables) {
        try {
          const count = await (prisma as any)[table].count();
          status.tables[table] = 'exists';
          status.counts[table] = count;
        } catch (error) {
          status.tables[table] = 'missing or inaccessible';
          status.issues.push(`${table} table: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Check for test data
      try {
        const testJobs = await prisma.job.findMany({
          where: {
            OR: [
              { title: { contains: 'test', mode: 'insensitive' } },
              { title: { contains: 'sample', mode: 'insensitive' } },
              { title: { contains: 'demo', mode: 'insensitive' } },
              { company: { contains: 'test', mode: 'insensitive' } },
            ]
          },
          select: { id: true, title: true, company: true }
        });
        
        if (testJobs.length > 0) {
          status.issues.push(`Found ${testJobs.length} potential test jobs that should be cleaned up`);
        }
      } catch (error) {
        // Ignore if we can't check test data
      }

      // Check for orphaned applications by checking if referenced jobs exist
      try {
        const allApplications = await prisma.jobApplication.findMany({
          select: { id: true, jobId: true }
        });

        const existingJobIds = await prisma.job.findMany({
          select: { id: true }
        });

        const existingJobIdSet = new Set(existingJobIds.map(job => job.id));
        const orphanedApps = allApplications.filter(app => !existingJobIdSet.has(app.jobId));

        if (orphanedApps.length > 0) {
          status.issues.push(`Found ${orphanedApps.length} orphaned job applications`);
        }
      } catch (error) {
        // Ignore if we can't check orphaned applications
      }

    } catch (error) {
      status.issues.push(`Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return NextResponse.json({
      success: true,
      status,
      summary: {
        healthy: status.connection && status.issues.length === 0,
        tablesChecked: Object.keys(status.tables).length,
        issuesFound: status.issues.length
      }
    });

  } catch (error) {
    console.error('Database status check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check database status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
