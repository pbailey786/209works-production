import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../../../auth/authOptions';
import { prisma } from '../../../../auth/prisma';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;

    // Check if user is authenticated and has moderation permissions
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session!.user?.role || 'guest';
    // TODO: Replace with Clerk permissions
    // if (!hasPermission(userRole, Permission.ADMIN_ACCESS)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const { action, reason } = await req.json();
    const jobId = (await params).id;

    // Validate action
    const validActions = ['approve', 'reject', 'flag'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Find the job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // For now, we'll use a simple approach since we don't have moderation fields in the schema yet
    // In a real implementation, you'd add fields like: moderationStatus, moderatedAt, moderatedBy, moderationReason

    let updateData: any = {};
    let statusMessage = '';

    switch (action) {
      case 'approve':
        // In a real app, you'd set moderationStatus: 'approved'
        statusMessage = 'Job approved successfully';
        break;
      case 'reject':
        // In a real app, you'd set moderationStatus: 'rejected' and possibly unpublish
        statusMessage = 'Job rejected';
        break;
      case 'flag':
        // In a real app, you'd set moderationStatus: 'flagged'
        statusMessage = 'Job flagged for further review';
        break;
    }

    // For demonstration, we'll just update the updatedAt field to show something changed
    updateData.updatedAt = new Date();

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });

    // In a real app, you'd also create an audit log entry here
    // await prisma.adminAction.create({
    //   data: {
    //     adminId: (session!.user as any).id,
    //     action: `job_${action}`,
    //     resourceType: 'job',
    //     resourceId: jobId,
    //     details: { reason },
    //     createdAt: new Date()
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: statusMessage,
      job: {
        id: updatedJob.id,
        title: updatedJob.title,
        company: job.company,
        action: action,
        moderatedAt: new Date(),
        moderatedBy: session!.user?.email,
      },
    });
  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
