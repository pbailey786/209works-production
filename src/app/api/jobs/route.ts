import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Use global prisma instance to avoid connection issues
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Validation schema for job creation
const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(100),
  company: z.string().min(1, 'Company name is required').max(100),
  description: z.string().min(1, 'Job description is required'),
  location: z.string().min(1, 'Location is required'),
  jobType: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship', 'volunteer', 'other']),
  requirements: z.string().min(1, 'Requirements are required'),
  benefits: z.string().optional(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  areaCodes: z.array(z.string()).default(['209'])
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const location = searchParams.get('location');
    const jobType = searchParams.get('type');
    const q = searchParams.get('q');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: 'active',
      deletedAt: null
    };

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    if (jobType) {
      where.jobType = jobType;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { postedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          jobType: true,
          salaryMin: true,
          salaryMax: true,
          postedAt: true,
          description: true,
          requirements: true,
          benefits: true
        }
      }),
      prisma.job.count({ where })
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createJobSchema.parse(body);

    // Create job in database
    const job = await prisma.job.create({
      data: {
        title: validatedData.title,
        company: validatedData.company,
        description: validatedData.description,
        location: validatedData.location,
        jobType: validatedData.jobType,
        requirements: validatedData.requirements || '',
        benefits: validatedData.benefits || '',
        salaryMin: validatedData.salaryMin,
        salaryMax: validatedData.salaryMax,
        areaCodes: validatedData.areaCodes,
        source: 'employer_portal',
        url: '', // Will be set after job is created
        postedAt: new Date(),
        status: 'active',
        region: 'Central Valley', // Default region
        employerId: null // TODO: Set when authentication is implemented
      }
    });

    // Update URL with job ID
    await prisma.job.update({
      where: { id: job.id },
      data: { url: `/jobs/${job.id}` }
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job posting' },
      { status: 500 }
    );
  }
}
