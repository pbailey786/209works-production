import { NextRequest, NextResponse } from 'next/server';
import {
  withAPIMiddleware,
  apiConfigs,
  mergeAPIConfig,
} from '@/lib/middleware/api';
import { paginatedQuerySchema } from '@/lib/cache/pagination';
import { JobCacheService } from '@/lib/cache/services';
import { createJobSchema } from '@/lib/validations/api';
import { createSuccessResponse } from '@/lib/errors/api-errors';
import { prisma } from '../auth/prisma';

// GET /api/jobs - List jobs with caching and pagination
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { query, performance } = context;

    // Extract query parameters with defaults
    const {
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ...paginationParams
    } = query!;

    // Get paginated jobs with caching
    const results = await JobCacheService.getPaginatedJobs(
      {
        ...paginationParams,
        sortBy,
        sortOrder,
      },
      performance
    );

    return createSuccessResponse(results);
  },
  mergeAPIConfig(apiConfigs.public, {
    querySchema: paginatedQuerySchema,
    logging: {
      enabled: true,
      includeQuery: true,
    },
  })
);

// POST /api/jobs - Create a new job (admin or employer only)
export const POST = withAPIMiddleware(
  async (req, context) => {
    const { user, body, performance } = context;
    const employerId = user!.id;

    performance.trackDatabaseQuery();

    // Check if this is a free basic job post (no credits required)
    // vs premium features that require credits
    const isFreeBasicPost = body?.source === 'free_basic_post';

    // For premium features, check if user has job posting credits
    if (!isFreeBasicPost) {
      const { JobPostingCreditsService } = await import('@/lib/services/job-posting-credits');

      const canPost = await JobPostingCreditsService.canPostJob(employerId);
      if (!canPost) {
        return NextResponse.json(
          {
            error: 'Job posting credits required. Please purchase a job posting package.',
            code: 'CREDITS_REQUIRED',
            redirectUrl: '/employers/dashboard'
          },
          { status: 402 } // Payment Required
        );
      }
    }

    // Extract and transform the data from the form
    const { type, contactEmail, salaryMin, salaryMax, isRemote, ...jobData } =
      body!;

    // Handle salary conversion from strings to numbers
    const processedSalaryMin =
      typeof salaryMin === 'string' && salaryMin
        ? parseInt(salaryMin, 10)
        : typeof salaryMin === 'number'
          ? salaryMin
          : null;
    const processedSalaryMax =
      typeof salaryMax === 'string' && salaryMax
        ? parseInt(salaryMax, 10)
        : typeof salaryMax === 'number'
          ? salaryMax
          : null;

    // Create job with employer relationship
    const job = await prisma.job.create({
      data: {
        ...jobData,
        jobType: type, // Map type to jobType for Prisma
        employerId, // Link to the authenticated user
        postedAt: body!.postedAt ? new Date(body!.postedAt) : new Date(),
        source: jobData.source || 'manual', // Ensure source is always provided
        url: jobData.url || '', // Ensure url is always provided
        salaryMin: processedSalaryMin,
        salaryMax: processedSalaryMax,
        isRemote: isRemote || false, // Handle isRemote field
        // Note: contactEmail is from the form but not in the Job model
        // This could be stored in a separate table or handled differently in the future
      },
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            companyWebsite: true,
          },
        },
      },
    });

    // Use job posting credit if this is not a free basic post
    if (!isFreeBasicPost) {
      const { JobPostingCreditsService } = await import('@/lib/services/job-posting-credits');
      const creditResult = await JobPostingCreditsService.useJobPostCredit(employerId, job.id);

      if (!creditResult.success) {
        // If credit usage fails, we should delete the job and return error
        await prisma.job.delete({ where: { id: job.id } });
        return NextResponse.json(
          { error: creditResult.error || 'Failed to use job posting credit' },
          { status: 402 }
        );
      }
    }

    // Invalidate job caches since we added a new job
    await JobCacheService.invalidateJobCaches(undefined, employerId);

    return createSuccessResponse({ job }, 'Job created successfully', 201);
  },
  {
    requiredRoles: ['admin', 'employer'],
    bodySchema: createJobSchema,
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true, includeBody: true },
    cors: { enabled: true },
  }
);
