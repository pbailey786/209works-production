import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Simple status check starting...');
    
    const status = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'exists' : 'missing',
      connection: false,
      basicCounts: {} as Record<string, number | string>,
      errors: [] as string[]
    };

    // Test basic database connection
    try {
      console.log('Testing database connection...');
      await prisma.$connect();
      status.connection = true;
      console.log('Database connection successful');

      // Try to get basic counts
      try {
        const userCount = await prisma.user.count();
        status.basicCounts.users = userCount;
        console.log(`Found ${userCount} users`);
      } catch (error) {
        status.basicCounts.users = 'error';
        status.errors.push(`User count error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      try {
        const jobCount = await prisma.job.count();
        status.basicCounts.jobs = jobCount;
        console.log(`Found ${jobCount} jobs`);
      } catch (error) {
        status.basicCounts.jobs = 'error';
        status.errors.push(`Job count error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      try {
        const applicationCount = await prisma.jobApplication.count();
        status.basicCounts.applications = applicationCount;
        console.log(`Found ${applicationCount} applications`);
      } catch (error) {
        status.basicCounts.applications = 'error';
        status.errors.push(`Application count error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      try {
        const savedJobCount = await prisma.savedJob.count();
        status.basicCounts.savedJobs = savedJobCount;
        console.log(`Found ${savedJobCount} saved jobs`);
      } catch (error) {
        status.basicCounts.savedJobs = 'error';
        status.errors.push(`Saved job count error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      try {
        const chatHistoryCount = await prisma.chatHistory.count();
        status.basicCounts.chatHistory = chatHistoryCount;
        console.log(`Found ${chatHistoryCount} chat history records`);
      } catch (error) {
        status.basicCounts.chatHistory = 'error';
        status.errors.push(`Chat history count error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

    } catch (connectionError) {
      status.errors.push(`Database connection failed: ${connectionError instanceof Error ? connectionError.message : 'Unknown connection error'}`);
      console.error('Database connection failed:', connectionError);
    }

    return NextResponse.json({
      success: true,
      status,
      summary: {
        healthy: status.connection && status.errors.length === 0,
        tablesChecked: Object.keys(status.basicCounts).length,
        errorsFound: status.errors.length
      }
    });

  } catch (error) {
    console.error('Simple status check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
}
