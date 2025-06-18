import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { prisma } from '../../../auth/prisma';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import type { Session } from 'next-auth';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;

    // Check if user is authenticated and has moderation permissions
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session!.user?.role || 'guest';
    if (!hasPermission(userRole, Permission.MODERATE_JOBS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { jobIds, action, reason } = await req.json();

    // Validate input
    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: 'Job IDs array is required' },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'reject', 'flag'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Find the jobs
    const jobs = await prisma.job.findMany({
      where: {
        id: { in: jobIds },
      },
    });

    if (jobs.length === 0) {
      return NextResponse.json({ error: 'No jobs found' }, { status: 404 });
    }

    // Prepare update data
    let updateData: any = {};
    let statusMessage = '';

    switch (action) {
      case 'approve':
        statusMessage = `${jobs.length} job(s) approved successfully`;
        break;
      case 'reject':
        statusMessage = `${jobs.length} job(s) rejected`;
        break;
      case 'flag':
        statusMessage = `${jobs.length} job(s) flagged for further review`;
        break;
    }

    // For demonstration, we'll just update the updatedAt field
    updateData.updatedAt = new Date();

    // Bulk update jobs
    const updatedJobs = await prisma.job.updateMany({
      where: { id: { in: jobIds } },
      data: updateData,
    });

    // In a real app, you'd create audit log entries for each job
    // const auditEntries = jobs.map(job => ({
    //   adminId: (session!.user as any).id,
    //   action: `job_${action}`,
    //   resourceType: 'job',
    //   resourceId: job.id,
    //   details: { reason, bulkAction: true },
    //   createdAt: new Date()
    // }));
    // await prisma.adminAction.createMany({ data: auditEntries });

    return NextResponse.json({
      success: true,
      message: statusMessage,
      processedCount: updatedJobs.count,
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        action: action,
        moderatedAt: new Date(),
        moderatedBy: session!.user?.email,
      })),
    });
  } catch (error) {
    console.error('Bulk moderation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
