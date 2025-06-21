import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { RegionalJobService } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database to check role
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email },
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
