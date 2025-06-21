import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { withValidation } from '@/lib/middleware/validation';
import { createJobApplicationSchema } from '@/lib/validations/api';
import { routeParamsSchemas } from '@/lib/errors/api-errors';

// POST /api/jobs/:id/apply - Apply for a job (jobseeker only)
export const POST = withValidation(
  async (req, { params, body }) => {
    // Check authorization
    const session = await requireRole(req, ['admin', 'employer', 'jobseeker']);
    if (session instanceof NextResponse) return session;

    const user = (session as any).user;
    // User, params, and body already available from above
    const userId = user.id;
    const jobId = params.id;

    // Track database queries for performance monitoring
    // Check if job exists
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job' }, { status: 404 });
    }

    // Check if user already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      }
    });

    if (existingApplication) {
      throw new ConflictError('You have already applied for this job');
    }

    // Create job application
    const application = await prisma.jobApplication.create({
      data: {
        userId,
        jobId,
        coverLetter: body?.coverLetter || null,
        resumeUrl: body?.resumeUrl || null,
        appliedAt: new Date(),
        status: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      data: { application },
      message: 'Application submitted successfully'
    }, { status: 201 });
  },
  {}
);

// GET /api/jobs/:id/apply - Check application status (jobseeker only)
export const GET = withValidation(
  async (req, { params, query }) => {
    // Check authorization
    const session = await requireRole(req, ['admin', 'employer', 'jobseeker']);
    if (session instanceof NextResponse) return session;

    const user = (session as any).user;
    // Params already available from above
    const userId = user.id;
    const jobId = params.id;

    const application = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      }
    });

    return NextResponse.json({ success: true, data: {
      hasApplied: !!application,
      application: application || null
    } });
  },
  {}
);
