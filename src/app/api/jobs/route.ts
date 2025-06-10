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
    console.log('🔍 DEBUG: Job POST route called');
    console.log('🔍 DEBUG: Context user:', context.user);
    console.log('🔍 DEBUG: Request body:', context.body);

    const { user, body, performance } = context;
    const employerId = user!.id;

    performance.trackDatabaseQuery();

    // Check if this is a free basic job post (no credits required)
    // vs premium features that require credits
    const isFreeBasicPost = body?.source === 'free_basic_post';

    // For free basic posts, check if user already has an active free post
    if (isFreeBasicPost) {
      const existingFreePost = await prisma.job.findFirst({
        where: {
          employerId,
          source: 'free_basic_post',
          status: 'active',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      if (existingFreePost) {
        return NextResponse.json(
          {
            error: 'You can only have 1 free job post active at a time. Please wait for your current post to expire or upgrade to post multiple jobs.',
            code: 'FREE_POST_LIMIT',
            redirectUrl: '/employers/dashboard',
            existingJobId: existingFreePost.id,
            existingJobTitle: existingFreePost.title
          },
          { status: 409 } // Conflict
        );
      }
    }

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

    // Set expiration date based on post type
    const expirationDate = new Date();
    if (isFreeBasicPost) {
      // Free posts expire in 7 days
      expirationDate.setDate(expirationDate.getDate() + 7);
    } else {
      // Premium posts expire in 30 days
      expirationDate.setDate(expirationDate.getDate() + 30);
    }

    // Create job with employer relationship
    const job = await prisma.job.create({
      data: {
        ...jobData,
        jobType: type, // Map type to jobType for Prisma
        employerId, // Link to the authenticated user
        postedAt: body!.postedAt ? new Date(body!.postedAt) : new Date(),
        expiresAt: expirationDate, // Set expiration based on post type
        source: jobData.source || 'manual', // Ensure source is always provided
        url: jobData.url || '', // Provide empty string for required field
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

    // Update posting patterns for duplicate detection (async, don't wait)
    try {
      const { DuplicateDetectionService } = await import('@/lib/services/duplicate-detection');
      DuplicateDetectionService.updatePostingPattern(job).catch(console.error);
    } catch (error) {
      console.warn('Failed to update posting pattern:', error);
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
