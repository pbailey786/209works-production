import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: jobId } = params;

    // Verify job ownership and update status
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        employerId: userId
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      );
    }

    // Update job status to paused
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'PAUSED',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Job paused successfully',
      job: {
        id: updatedJob.id,
        status: updatedJob.status
      }
    });

  } catch (error) {
    console.error('Error pausing job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
