import { NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { withAPIMiddleware, apiConfigs } from '@/lib/middleware/api-middleware';
import { createJobApplicationSchema } from '@/lib/validations/api';
import { routeParamsSchemas } from '@/lib/middleware/validation';
import {
  createSuccessResponse,
  NotFoundError,
  ConflictError,
} from '@/lib/errors/api-errors';

// POST /api/jobs/:id/apply - Apply for a job (jobseeker only)
export const POST = withAPIMiddleware(
  async (req, context) => {
    const { user, params, body, performance } = context;
    const userId = user!.id;
    const jobId = params.id;

    // Track database queries for performance monitoring
    performance.trackDatabaseQuery();

    // Check if job exists
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundError('Job');
    }

    performance.trackDatabaseQuery();

    // Check if user already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });

    if (existingApplication) {
      throw new ConflictError('You have already applied for this job');
    }

    performance.trackDatabaseQuery();

    // Create job application
    const application = await prisma.jobApplication.create({
      data: {
        userId,
        jobId,
        coverLetter: body?.coverLetter || null,
        resumeUrl: body?.resumeUrl || null,
        appliedAt: new Date(),
        status: 'pending',
      },
    });

    return createSuccessResponse(
      { application },
      'Application submitted successfully',
      201
    );
  },
  {
    requiredRoles: ['jobseeker'],
    bodySchema: createJobApplicationSchema,
    paramsSchema: routeParamsSchemas.jobId,
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true, includeBody: false }, // Don't log cover letters
    cors: { enabled: true },
  }
);

// GET /api/jobs/:id/apply - Check application status (jobseeker only)
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { user, params, performance } = context;
    const userId = user!.id;
    const jobId = params.id;

    performance.trackDatabaseQuery();

    const application = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });

    return createSuccessResponse({
      hasApplied: !!application,
      application: application || null
    });
  },
  {
    requiredRoles: ['jobseeker'],
    paramsSchema: routeParamsSchemas.jobId,
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true },
    cors: { enabled: true },
  }
);
