import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../auth/prisma';
import { getEmbedding } from '@/lib/openai';
import { withAPIMiddleware } from '@/lib/middleware/api';
import { createJobSchema } from '@/lib/validations/api';
import { sanitizeFormData } from '@/lib/utils/sanitization';
import { z } from 'zod';

export const POST = withAPIMiddleware(
  async (req: NextRequest, context) => {
    try {
      // Sanitize input data first
      const sanitizedData = sanitizeFormData(context.body || {});

      // Validate request body using Zod schema
      const validatedData = createJobSchema.parse(sanitizedData);

      // Ensure user is authenticated and is an employer
      if (!context.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (context.user.role !== 'employer') {
        return NextResponse.json(
          { error: 'Only employers can post jobs' },
          { status: 403 }
        );
      }

      // BILLING REFACTOR: Check if user has active subscription before allowing job posts
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: context.user.id,
          status: 'active',
        },
      });

      if (!subscription) {
        return NextResponse.json(
          {
            error: 'Active subscription required to post jobs',
            code: 'SUBSCRIPTION_REQUIRED',
            redirectUrl: '/employers/upgrade'
          },
          { status: 402 } // Payment Required
        );
      }

      // Track database query for performance monitoring
      context.performance.trackDatabaseQuery();

      // Check for duplicate job postings (same title, company, and location within 24 hours)
      const existingJob = await prisma.job.findFirst({
        where: {
          title: validatedData.title,
          company: validatedData.company,
          location: validatedData.location,
          postedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
          },
        },
      });

      if (existingJob) {
        return NextResponse.json(
          {
            error:
              'A similar job posting already exists. Please wait 24 hours before posting the same job again.',
          },
          { status: 409 }
        );
      }

      // Generate embedding for job content
      const embeddingVector = await getEmbedding(
        `${validatedData.title} ${validatedData.description}`
      );
      const embedding = JSON.stringify(embeddingVector); // Convert to string for storage

      // Create job in database
      const job = await prisma.job.create({
        data: {
          title: validatedData.title,
          company: validatedData.company,
          location: validatedData.location,
          jobType: validatedData.type,
          categories: validatedData.categories || [],
          description: validatedData.description,
          salaryMin: validatedData.salaryMin || null,
          salaryMax: validatedData.salaryMax || null,
          url: validatedData.url || '',
          source: validatedData.source || 'manual',
          postedAt: validatedData.postedAt
            ? new Date(validatedData.postedAt)
            : new Date(),
          embedding,
          // Associate job with the authenticated user if they have a company
          companyId: context.user.companyId || null,
        },
      });

      return NextResponse.json({
        success: true,
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          jobType: job.jobType,
          postedAt: job.postedAt,
        },
      });
    } catch (error) {
      console.error('Job post error:', error);

      // Handle validation errors
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        );
      }

      // Handle other errors
      return NextResponse.json(
        { error: 'Failed to create job posting' },
        { status: 500 }
      );
    }
  },
  {
    // Require authentication
    requireAuthentication: true,
    requiredRoles: ['employer'],

    // Validate request body
    bodySchema: createJobSchema,

    // Enable rate limiting
    rateLimit: {
      enabled: true,
      type: 'premium',
    },

    // Enable CORS for cross-origin requests
    cors: {
      enabled: true,
      config: {
        methods: ['POST'],
      },
    },

    // Enable logging and monitoring
    logging: {
      enabled: true,
      includeBody: false, // Don't log sensitive job data
      includeQuery: false,
    },

    monitoring: {
      enabled: true,
      slowRequestThreshold: 5000, // 5 seconds
    },
  }
);
