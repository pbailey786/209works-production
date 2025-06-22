import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../auth/authOptions';
import { prisma } from '@/lib/database/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'employer' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    // Fetch jobs with their applications using Prisma
    const jobs = await prisma.job.findMany({
      where: {
        employerId: userId,
        status: 'active',
      },
      include: {
        jobApplications: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                skills: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match our interface
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      applications: job.jobApplications.map(app => ({
        id: app.id,
        status: app.status || 'applied',
        appliedAt: app.appliedAt,
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
        },
        user: {
          id: app.user.id,
          name: app.user.name,
          email: app.user.email,
          skills: app.user.skills || [],
        },
      })),
    }));

    return NextResponse.json({ jobs: transformedJobs });
  } catch (error) {
    console.error('Error in jobs-with-applications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
