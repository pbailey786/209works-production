import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { Session } from 'next-auth';

// PATCH /api/employers/candidates/:id/status - Update candidate status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication with Clerk
    const clerkUser = await currentUser();

    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress;

    // Get the current user from database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user || (user.role !== 'employer' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applicationId = (await params).id;
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['applied', 'shortlisted', 'hired', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Fetch the application to verify ownership
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            employerId: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify the application belongs to this employer's job
    if (application.job.employerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the application status
    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
    });

    return NextResponse.json({ 
      success: true, 
      status: updatedApplication.status 
    });
  } catch (error) {
    console.error('Error updating candidate status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
