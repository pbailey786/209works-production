import { NextRequest, NextResponse } from '@/components/ui/card';
import { requireRole } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication using modern session validator
    const { user } = await requireRole(['employer', 'admin']);

    const userId = user.id;

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
