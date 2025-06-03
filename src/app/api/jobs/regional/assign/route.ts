import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { RegionalJobService } from '@/lib/services/regional-job-service';
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions) as Session | null;

    if (!session!.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { email: session!.user?.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Assign regions to existing jobs
    const result = await RegionalJobService.assignRegionsToExistingJobs();

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully assigned regions to ${result.assignedJobs} out of ${result.totalJobs} jobs`,
    });
  } catch (error) {
    console.error('Regional assignment API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to assign regions to jobs',
      },
      { status: 500 }
    );
  }
}
