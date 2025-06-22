import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export async function GET(request: NextRequest) {
  try {
    // Check if database URL exists
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        status: 'error',
        message: 'DATABASE_URL environment variable not set',
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }

    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test database connection first
    await prisma.$connect();

    // Test if tables exist by trying basic queries with individual error handling
    const tests = [];

    try {
      const userCount = await prisma.user.count();
      tests.push({ table: 'User', status: 'success', count: userCount });
    } catch (error) {
      tests.push({
        table: 'User',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    try {
      const jobCount = await prisma.job.count();
      tests.push({ table: 'Job', status: 'success', count: jobCount });
    } catch (error) {
      tests.push({
        table: 'Job',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    try {
      const applicationCount = await prisma.jobApplication.count();
      tests.push({ table: 'JobApplication', status: 'success', count: applicationCount });
    } catch (error) {
      tests.push({
        table: 'JobApplication',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    try {
      const chatCount = await prisma.chatAnalytics.count();
      tests.push({ table: 'ChatAnalytics', status: 'success', count: chatCount });
    } catch (error) {
      tests.push({
        table: 'ChatAnalytics',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check if user is admin (only if User table exists)
    const userTest = tests.find(t => t.table === 'User');
    if (userTest?.status === 'success') {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { role: true }
        });

        if (!user || user.role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } catch (error) {
        // If we can't check admin status, allow the test to continue
        console.warn('Could not verify admin status:', error);
      }
    }

    const hasErrors = tests.some(test => test.status === 'error');

    return NextResponse.json({
      status: hasErrors ? 'partial' : 'success',
      message: hasErrors ? 'Some database tables are missing' : 'Database connection successful',
      tests,
      timestamp: new Date().toISOString(),
      recommendation: hasErrors ? 'Run: npx prisma migrate deploy or npx prisma db push' : 'Database is ready',
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        recommendation: 'Check DATABASE_URL and run migrations',
      },
      { status: 500 }
    );
  }
}
