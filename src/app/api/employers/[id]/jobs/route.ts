import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/database/prisma';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Try to fetch real jobs from database for this employer
    let jobs: any[] = [];

    try {
      // First, try to find the employer by company ID
      let employer = await prisma.company.findUnique({
        where: { id },
        include: {
          jobs: {
            where: {
              status: 'active',
              deletedAt: null,
            },
            orderBy: {
              postedAt: 'desc',
            },
            take: 20,
          },
        },
      });

      // If not found by company ID, try to find by user ID
      if (!employer) {
        const user = await prisma.user.findUnique({
          where: { id },
          include: {
            company: {
              include: {
                jobs: {
                  where: {
                    status: 'active',
                    deletedAt: null,
                  },
                  orderBy: {
                    postedAt: 'desc',
                  },
                  take: 20,
                },
              },
            },
            employerJobs: {
              where: {
                status: 'active',
                deletedAt: null,
              },
              orderBy: {
                postedAt: 'desc',
              },
              take: 20,
            },
          },
        });

        if (user) {
          jobs = user.company?.jobs || user.employerJobs || [];
        }
      } else {
        jobs = employer.jobs || [];
      }

      // Transform jobs to match our interface
      const transformedJobs = jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.jobType || job.type,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        description: job.description,
        postedAt: job.postedAt?.toISOString() || job.createdAt?.toISOString(),
        saved: false, // This would be determined by user session in production
      }));

      return NextResponse.json({
        jobs: transformedJobs,
        count: transformedJobs.length,
        source: 'database',
      });
    } catch (dbError) {
      console.error('Database error:', dbError);

      // Fallback to mock data for known employer IDs
      const mockJobs = getMockJobsForEmployer(id);

      return NextResponse.json({
        jobs: mockJobs,
        count: mockJobs.length,
        source: 'mock',
      });
    }
  } catch (error) {
    console.error('Error fetching employer jobs:', error);

    return NextResponse.json(
      {
        jobs: [],
        error: 'Failed to fetch jobs',
      },
      { status: 500 }
    );
  }
}

// Mock jobs for demonstration
function getMockJobsForEmployer(employerId: string) {
  const mockJobsMap: { [key: string]: any[] } = {
    'central-valley-health': [
      {
        id: 'cvh-nurse-1',
        title: 'Registered Nurse - ICU',
        company: 'Central Valley Health',
        location: 'Stockton, CA',
        type: 'full_time',
        salaryMin: 75000,
        salaryMax: 95000,
        description:
          'Join our ICU team providing critical care to patients. Requires RN license and ICU experience.',
        postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cvh-admin-1',
        title: 'Medical Administrative Assistant',
        company: 'Central Valley Health',
        location: 'Stockton, CA',
        type: 'full_time',
        salaryMin: 35000,
        salaryMax: 45000,
        description:
          'Support our medical team with administrative tasks, scheduling, and patient communication.',
        postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    'manteca-unified': [
      {
        id: 'mu-teacher-1',
        title: 'Elementary School Teacher',
        company: 'Manteca Unified School District',
        location: 'Manteca, CA',
        type: 'full_time',
        salaryMin: 50000,
        salaryMax: 70000,
        description:
          'Teach elementary students in a supportive environment. Teaching credential required.',
        postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    'tracy-logistics': [
      {
        id: 'tl-driver-1',
        title: 'Delivery Driver',
        company: 'Tracy Logistics Solutions',
        location: 'Tracy, CA',
        type: 'full_time',
        salaryMin: 45000,
        salaryMax: 60000,
        description:
          'Local delivery driver position with competitive pay and benefits. CDL preferred.',
        postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'tl-warehouse-1',
        title: 'Warehouse Associate',
        company: 'Tracy Logistics Solutions',
        location: 'Tracy, CA',
        type: 'full_time',
        salaryMin: 35000,
        salaryMax: 45000,
        description:
          'Join our warehouse team handling inventory and shipping operations.',
        postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };

  return mockJobsMap[employerId] || [];
}
