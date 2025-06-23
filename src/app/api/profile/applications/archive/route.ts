import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

// PATCH /api/profile/applications/archive - Archive an application
export async function PATCH(req: NextRequest) {
  try {
    // Check authentication with Clerk
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
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
