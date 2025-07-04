import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET() {
  try {
    // Try a simple count query
    const jobCount = await prisma.job.count({
      where: { status: 'active' }
    });

    // Try to get one job
    const sampleJob = await prisma.job.findFirst({
      where: { status: 'active' },
      select: {
        id: true,
        title: true,
        company: true,
      }
    });

    return NextResponse.json({
      success: true,
      activeJobs: jobCount,
      sampleJob: sampleJob,
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error',
        type: error?.constructor?.name,
        details: error
      },
      { status: 500 }
    );
  }
}