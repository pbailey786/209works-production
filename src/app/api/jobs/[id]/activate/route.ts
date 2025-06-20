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

    // Verify job ownership
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

    // Update job status to active and set expiration if not set
    const expiresAt = job.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'ACTIVE',
        expiresAt,
        postedAt: job.postedAt || new Date(), // Set posted date if not set
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Job activated successfully',
      job: {
        id: updatedJob.id,
        status: updatedJob.status,
        expiresAt: updatedJob.expiresAt
      }
    });

  } catch (error) {
    console.error('Error activating job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
