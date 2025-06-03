import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || session.user.role !== 'employer') {
      return NextResponse.json(
        {
          error: 'Authentication required. Only employers can view their jobs.',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const employerId = searchParams.get('employerId') || session.user.id;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');

    // Ensure the employer can only see their own jobs
    if (employerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only view your own jobs.' },
        { status: 403 }
      );
    }

    const where: any = {
      employerId: employerId,
      deletedAt: null,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    // Fetch jobs for the employer
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          jobType: true,
          status: true,
          salaryMin: true,
          salaryMax: true,
          description: true,
          postedAt: true,
          createdAt: true,
          updatedAt: true,
          expiresAt: true,
          viewCount: true,
          source: true,
          // Add application count if we have a jobApplications relation
          _count: {
            select: {
              jobApplications: true,
            },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    // Transform jobs to match the expected format
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.jobType,
      jobType: job.jobType,
      salary:
        job.salaryMin && job.salaryMax
          ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
          : undefined,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      description: job.description,
      posted: job.postedAt?.toISOString() || job.createdAt.toISOString(),
      postedAt: job.postedAt?.toISOString() || job.createdAt.toISOString(),
      createdAt: job.createdAt.toISOString(),
      expires: job.expiresAt?.toISOString(),
      status: job.status,
      applications: job._count.jobApplications || 0,
      views: job.viewCount || 0,
      shortlisted: 0, // TODO: Add shortlisted count when we have that feature
      interviewed: 0, // TODO: Add interviewed count when we have that feature
      hired: 0, // TODO: Add hired count when we have that feature
      performance: 'good', // TODO: Calculate performance based on metrics
      source: job.source,
    }));

    return NextResponse.json({
      success: true,
      jobs: transformedJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get employer jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
