import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    // Check if user is admin
    if (!session?.user || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, targetType, targetIds, reason } = body;

    if (!action || !targetType || !Array.isArray(targetIds) || targetIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    let results = [];

    switch (action) {
      case 'approve':
        if (targetType === 'users') {
          // Bulk approve users (e.g., employers)
          const approvedUsers = await prisma.user.updateMany({
            where: {
              id: { in: targetIds },
              isEmailVerified: false,
            },
            data: {
              isEmailVerified: true,
              updatedAt: new Date(),
            },
          });
          results.push({ action: 'approve_users', count: approvedUsers.count });
        } else if (targetType === 'jobs') {
          // Bulk approve job postings
          const approvedJobs = await prisma.job.updateMany({
            where: {
              id: { in: targetIds },
              status: 'pending',
            },
            data: {
              status: 'active',
              updatedAt: new Date(),
            },
          });
          results.push({ action: 'approve_jobs', count: approvedJobs.count });
        }
        break;

      case 'ban':
        if (targetType === 'users') {
          // Bulk ban users
          const bannedUsers = await prisma.user.updateMany({
            where: {
              id: { in: targetIds },
              role: { not: 'admin' }, // Prevent banning admins
            },
            data: {
              isEmailVerified: false,
              lastLoginAt: null,
              updatedAt: new Date(),
              // Add a banned flag if you have one in your schema
            },
          });

          // Log the ban actions
          await prisma.auditLog.createMany({
            data: targetIds.map(userId => ({
              action: 'USER_BANNED',
              targetType: 'USER',
              targetId: userId,
              performedBy: user?.id,
              details: JSON.stringify({ reason: reason || 'Bulk ban action' }),
              createdAt: new Date(),
            })),
          });

          results.push({ action: 'ban_users', count: bannedUsers.count });
        }
        break;

      case 'soft_delete':
        if (targetType === 'jobs') {
          // Soft delete jobs (mark as deleted but keep in database)
          const deletedJobs = await prisma.job.updateMany({
            where: {
              id: { in: targetIds },
            },
            data: {
              status: 'deleted',
              deletedAt: new Date(),
              updatedAt: new Date(),
            },
          });

          // Log the deletion actions
          await prisma.auditLog.createMany({
            data: targetIds.map(jobId => ({
              action: 'JOB_SOFT_DELETED',
              targetType: 'JOB',
              targetId: jobId,
              performedBy: user?.id,
              details: JSON.stringify({ reason: reason || 'Bulk soft delete action' }),
              createdAt: new Date(),
            })),
          });

          results.push({ action: 'soft_delete_jobs', count: deletedJobs.count });
        } else if (targetType === 'users') {
          // Soft delete users
          const deletedUsers = await prisma.user.updateMany({
            where: {
              id: { in: targetIds },
              role: { not: 'admin' }, // Prevent deleting admins
            },
            data: {
              deletedAt: new Date(),
              isEmailVerified: false,
              updatedAt: new Date(),
            },
          });

          results.push({ action: 'soft_delete_users', count: deletedUsers.count });
        }
        break;

      case 'restore':
        if (targetType === 'jobs') {
          // Restore soft-deleted jobs
          const restoredJobs = await prisma.job.updateMany({
            where: {
              id: { in: targetIds },
              status: 'deleted',
            },
            data: {
              status: 'active',
              deletedAt: null,
              updatedAt: new Date(),
            },
          });
          results.push({ action: 'restore_jobs', count: restoredJobs.count });
        } else if (targetType === 'users') {
          // Restore soft-deleted users
          const restoredUsers = await prisma.user.updateMany({
            where: {
              id: { in: targetIds },
              deletedAt: { not: null },
            },
            data: {
              deletedAt: null,
              isEmailVerified: true,
              updatedAt: new Date(),
            },
          });
          results.push({ action: 'restore_users', count: restoredUsers.count });
        }
        break;

      case 'change_status':
        if (targetType === 'jobs') {
          const { newStatus } = body;
          if (!newStatus) {
            return NextResponse.json({ error: 'New status required' }, { status: 400 });
          }

          const updatedJobs = await prisma.job.updateMany({
            where: {
              id: { in: targetIds },
            },
            data: {
              status: newStatus,
              updatedAt: new Date(),
            },
          });
          results.push({ action: 'change_job_status', count: updatedJobs.count, newStatus });
        }
        break;

      case 'send_notification':
        if (targetType === 'users') {
          const { message, subject } = body;
          if (!message || !subject) {
            return NextResponse.json({ error: 'Message and subject required' }, { status: 400 });
          }

          // Create email logs for admin messages (using EmailLog as notification system)
          await prisma.emailLog.createMany({
            data: targetIds.map(userId => ({
              userId,
              toEmail: '', // Will be filled by email service
              subject,
              emailType: 'admin_message',
              templateName: 'admin_notification',
              status: 'pending',
              metadata: { message },
              createdAt: new Date(),
            })),
          });

          results.push({ action: 'send_notifications', count: targetIds.length });
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log the bulk action
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        action: `BULK_${action.toUpperCase()}`,
        resource: targetType.toUpperCase(),
        resourceId: targetIds.join(','),
        details: {
          action,
          targetType,
          targetCount: targetIds.length,
          reason: reason || 'No reason provided',
          results,
        },
      },
    });

    return NextResponse.json({
      success: true,
      results,
      message: `Bulk ${action} completed successfully`,
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch items for bulk actions
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!session?.user || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'users' or 'jobs'
    const status = searchParams.get('status'); // filter by status
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const skip = (page - 1) * limit;

    if (type === 'users') {
      const whereClause: any = {};
      if (status === 'pending') whereClause.isEmailVerified = false;
      if (status === 'banned') whereClause.deletedAt = { not: null };
      if (status === 'active') whereClause.isEmailVerified = true;

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isEmailVerified: true,
            createdAt: true,
            lastLoginAt: true,
            deletedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({ where: whereClause }),
      ]);

      return NextResponse.json({
        items: users,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      });
    } else if (type === 'jobs') {
      const whereClause: any = {};
      if (status) whereClause.status = status;

      const [jobs, totalCount] = await Promise.all([
        prisma.job.findMany({
          where: whereClause,
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            employer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.job.count({ where: whereClause }),
      ]);

      return NextResponse.json({
        items: jobs,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching bulk action items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}
