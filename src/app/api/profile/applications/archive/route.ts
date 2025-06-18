import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

// PATCH /api/profile/applications/archive - Archive an application
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'jobseeker') {
      return NextResponse.json(
        { error: 'Only job seekers can archive applications' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Verify the application belongs to this user
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      select: { userId: true, status: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only archive your own applications' },
        { status: 403 }
      );
    }

    // Update application status to archived
    await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: 'archived' },
    });

    return NextResponse.json({
      success: true,
      message: 'Application archived successfully',
    });
  } catch (error) {
    console.error('Archive application error:', error);
    return NextResponse.json(
      { error: 'Failed to archive application' },
      { status: 500 }
    );
  }
}
