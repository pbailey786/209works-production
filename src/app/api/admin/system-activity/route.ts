import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (implement your own admin check logic)
    
    // Get recent system activities
    const activities = [];

    // Get recent user signups
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        email: true,
        createdAt: true,
      }
    });

    recentUsers.forEach(user => {
      activities.push({
        id: `user_${user.id}`,
        type: 'user_signup',
        description: `New user registered: ${user.email}`,
        timestamp: user.createdAt.toISOString(),
        severity: 'success'
      });
    });

    // Get recent job postings
    const recentJobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        employer: true,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        employer: {
          select: {
            companyName: true,
          }
        }
      }
    });

    recentJobs.forEach(job => {
      activities.push({
        id: `job_${job.id}`,
        type: 'job_posted',
        description: `New job posted: ${job.title} at ${job.employer?.companyName || 'Unknown Company'}`,
        timestamp: job.createdAt.toISOString(),
        severity: 'info'
      });
    });

    // Add some mock system events
    const now = new Date();
    const mockActivities = [
      {
        id: 'system_1',
        type: 'system',
        description: 'Database backup completed successfully',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        severity: 'success'
      },
      {
        id: 'payment_1',
        type: 'payment',
        description: 'Credit purchase: $99 package by employer',
        timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        severity: 'success'
      },
      {
        id: 'report_1',
        type: 'report',
        description: 'Job reported for inappropriate content',
        timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        severity: 'warning'
      }
    ];

    activities.push(...mockActivities);

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      activities: activities.slice(0, 10) // Return top 10 activities
    });

  } catch (error) {
    console.error('Error fetching admin system activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
