import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const featured = url.searchParams.get('featured');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      employerId: userId,
      deletedAt: null
    };

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (featured === 'true') {
      where.featured = true;
    }

    // Fetch jobs with related data
    const jobs = await prisma.job.findMany({
      where,
      include: {
        _count: {
          select: {
            applications: true
          }
        },
        applications: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Latest 5 applications for preview
        }
      },
      orderBy: {
        postedAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await prisma.job.count({ where });

    // Add mock performance data and views
    const jobsWithMetrics = jobs.map(job => ({
      ...job,
      views: Math.floor(Math.random() * 500) + 50, // Mock view data
      performance: {
        score: job._count.applications > 10 ? 90 :
               job._count.applications > 5 ? 75 :
               job._count.applications > 1 ? 50 : 25,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      }
    }));

    return NextResponse.json({
      jobs: jobsWithMetrics,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
