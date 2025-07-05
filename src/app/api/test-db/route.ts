import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET() {
  try {
    // Test basic database connection
    const jobCount = await prisma.job.count();
    console.log('Database connection successful, job count:', jobCount);
    
    return NextResponse.json({
      success: true,
      jobCount,
      message: 'Database connection working'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Database connection failed',
        details: error
      },
      { status: 500 }
    );
  }
}
