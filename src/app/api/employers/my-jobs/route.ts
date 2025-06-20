import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth() as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch jobs posted by this employer
    const jobs = await prisma.job.findMany({
      where: {
        employerId: user.id
      },
      include: {
        _count: {
          select: {
            jobApplications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform jobs to match the expected format
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      location: job.location || 'Remote',
      type: job.jobType || 'Full-time',
      postedDate: job.createdAt.toISOString().split('T')[0],
      applications: job._count.jobApplications,
      views: job.viewCount || 0,
      status: job.status || 'active',
      featured: false, // TODO: Implement featured jobs
      urgent: false, // TODO: Implement urgent jobs
    }));

    return NextResponse.json({
      jobs: transformedJobs,
      total: jobs.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employer jobs' },
      { status: 500 }
    );
  }
}
