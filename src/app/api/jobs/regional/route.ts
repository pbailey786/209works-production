import { NextRequest, NextResponse } from 'next/server';
import { RegionalJobService } from '@/lib/services/regional-job-service';
import { JobType } from '@prisma/client';
import { z } from 'zod';

const regionalJobsSchema = z.object({
  region: z.string().optional(),
  jobType: z.nativeEnum(JobType).optional(),
  location: z.string().optional(),
  keywords: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  postedAfter: z.string().optional(),
  categories: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params = {
      region: searchParams.get('region') || undefined,
      jobType: (searchParams.get('jobType') as JobType) || undefined,
      location: searchParams.get('location') || undefined,
      keywords: searchParams.get('keywords') || undefined,
      salaryMin: searchParams.get('salaryMin')
        ? parseInt(searchParams.get('salaryMin')!)
        : undefined,
      salaryMax: searchParams.get('salaryMax')
        ? parseInt(searchParams.get('salaryMax')!)
        : undefined,
      postedAfter: searchParams.get('postedAfter') || undefined,
      categories: searchParams.get('categories')?.split(',') || undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 20,
      offset: searchParams.get('offset')
        ? parseInt(searchParams.get('offset')!)
        : 0,
    };

    // Validate parameters
    const validatedParams = regionalJobsSchema.parse(params);

    // Convert postedAfter string to Date if provided
    const filters = {
      ...validatedParams,
      postedAfter: validatedParams.postedAfter
        ? new Date(validatedParams.postedAfter)
        : undefined,
    };

    // Get regional jobs
    const result = await RegionalJobService.getRegionalJobs(filters);

    return NextResponse.json({
      success: true,
      data: result,
      filters: filters,
    });
  } catch (error) {
    console.error('Regional jobs API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch regional jobs',
      },
      { status: 500 }
    );
  }
}
