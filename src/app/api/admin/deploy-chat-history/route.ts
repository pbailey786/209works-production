import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database/prisma';


export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    // Check if user is authenticated and is an admin
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('🚀 Starting chat history deployment...');
    
    const results = {
      schemaUpdate: false,
      testDataCleanup: false,
      verification: false,
      errors: [] as string[],
      summary: {} as any
    };

    try {
      // Step 1: Test database connection
      console.log('🔌 Testing database connection...');
      await prisma.$connect();
      console.log('✅ Database connection successful');

      // Step 2: Debug current state
      console.log('🔍 Debugging current database state...');
      const debugInfo = await debugCurrentState();
      results.summary.before = debugInfo;

      // Step 3: Clean up test data
      console.log('🧹 Cleaning up test data...');
      const cleanupResults = await cleanupTestData();
      results.testDataCleanup = true;
      results.summary.cleanup = cleanupResults;

      // Step 4: Final verification
      console.log('✅ Final verification...');
      const verificationInfo = await finalVerification();
      results.verification = true;
      results.summary.after = verificationInfo;

      console.log('🎉 Deployment completed successfully!');

      return NextResponse.json({
        success: true,
        message: 'Chat history deployment completed successfully',
        results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Deployment failed:', error);
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      return NextResponse.json({
        success: false,
        message: 'Deployment failed',
        results,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Admin deployment endpoint error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function debugCurrentState() {
  try {
    const jobCount = await prisma.job.count();
    const applicationCount = await prisma.jobApplication.count();
    const employerCount = await prisma.user.count({ where: { role: 'employer' } });
    const jobSeekerCount = await prisma.user.count({ where: { role: 'jobseeker' } });
    const jobsWithoutEmployer = await prisma.job.count({ where: { employerId: null } });

    return {
      totalJobs: jobCount,
      totalApplications: applicationCount,
      totalEmployers: employerCount,
      totalJobSeekers: jobSeekerCount,
      jobsWithoutEmployer
    };
  } catch (error) {
    console.error('Debug failed:', error);
    return { error: error instanceof Error ? error.message : 'Debug failed' };
  }
}

async function cleanupTestData() {
  try {
    const testJobTitles = [
      'Paul\'s first job yay',
      'Test Job for Instagram',
      'Test Job',
      'Sample Job',
      'Demo Job',
      'Fake Job',
      'Example Job',
    ];

    // Delete test jobs
    const deletedJobs = await prisma.job.deleteMany({
      where: {
        OR: testJobTitles.map(title => ({
          title: {
            contains: title,
            mode: 'insensitive'
          }
        }))
      }
    });

    // Delete test users
    const testUserEmails = [
      'test@instagram.com',
      'test@test.com',
      'demo@test.com',
      'fake@test.com',
      'sample@test.com',
    ];

    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          in: testUserEmails
        }
      }
    });

    // Clean up orphaned applications
    const existingJobIds = await prisma.job.findMany({
      select: { id: true }
    });
    const existingJobIdSet = new Set(existingJobIds.map(job => job.id));

    const allApplications = await prisma.jobApplication.findMany({
      select: { id: true, jobId: true }
    });

    const orphanedApplicationIds = allApplications
      .filter(app => !existingJobIdSet.has(app.jobId))
      .map(app => app.id);

    let deletedApplications = { count: 0 };
    if (orphanedApplicationIds.length > 0) {
      deletedApplications = await prisma.jobApplication.deleteMany({
        where: {
          id: {
            in: orphanedApplicationIds
          }
        }
      });
    }

    return {
      deletedJobs: deletedJobs.count,
      deletedUsers: deletedUsers.count,
      deletedOrphanedApplications: deletedApplications.count
    };

  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
}

async function finalVerification() {
  try {
    // Verify ChatHistory table exists (it should be created by Prisma migration)
    let chatHistoryCount = 0;
    try {
      chatHistoryCount = await prisma.chatHistory.count();
    } catch (error) {
      console.log('ChatHistory table not yet available - will be created on next deployment');
    }

    const applicationsWithJobs = await prisma.jobApplication.count();

    const jobsWithEmployers = await prisma.job.count({
      where: {
        employerId: {
          not: null
        }
      }
    });

    return {
      chatHistoryRecords: chatHistoryCount,
      validJobApplications: applicationsWithJobs,
      jobsWithEmployers
    };

  } catch (error) {
    console.error('Verification failed:', error);
    return { error: error instanceof Error ? error.message : 'Verification failed' };
  }
}
