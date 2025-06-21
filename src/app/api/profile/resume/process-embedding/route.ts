import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/components/ui/card';
import { createSuccessResponse, createErrorResponse, ApiError, ErrorCode } from '@/components/ui/card';
import { JobQueueService } from '@/components/ui/card';
import { ResumeEmbeddingService } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

const processResumeSchema = z.object({
  resumeText: z.string().min(100, 'Resume text must be at least 100 characters'),
  immediate: z.boolean().optional().default(false) // Process immediately vs queue for later
});

// POST /api/profile/resume/process-embedding - Process resume embedding
export const POST = withAPIMiddleware(
  async (req, context) => {
    const { body, user } = context;
    const userId = user!.id;

    try {
      const { resumeText, immediate } = body!;

      // Check if user is a job seeker
      if (user!.role !== 'jobseeker') {
        return createErrorResponse(new ApiError('Only job seekers can process resume embeddings', 403, ErrorCode.AUTHORIZATION_ERROR));
      }

      // Check if user has opted in for job alerts
      const jobSeekerProfile = await prisma.jobSeekerProfile.findUnique({
        where: { userId },
        select: { optInEmailAlerts: true }
      });

      if (!jobSeekerProfile?.optInEmailAlerts) {
        return createErrorResponse(new ApiError('You must opt in to job alerts to use AI matching features', 400, ErrorCode.BAD_REQUEST));
      }

      if (immediate) {
        // Process immediately (for testing or premium users)
        console.log(`🔄 Processing resume embedding immediately for user: ${userId}`);
        
        await ResumeEmbeddingService.processResumeEmbedding(userId, resumeText);
        
        // Get the processed embedding details
        const embedding = await ResumeEmbeddingService.getResumeEmbedding(userId);
        
        return createSuccessResponse({
          message: 'Resume embedding processed successfully',
          processed: true,
          immediate: true,
          embedding: embedding ? {
            skills: embedding.skills,
            jobTitles: embedding.jobTitles,
            industries: embedding.industries,
            lastProcessed: embedding.lastJobProcessed
          } : null
        });
      } else {
        // Queue for background processing (default)
        console.log(`📋 Queueing resume embedding for user: ${userId}`);
        
        const jobId = await JobQueueService.queueResumeEmbedding(userId, resumeText);
        
        return createSuccessResponse({
          message: 'Resume embedding queued for processing',
          processed: false,
          queued: true,
          queueJobId: jobId
        });
      }

    } catch (error) {
      console.error(`Failed to process resume embedding for user ${userId}:`, error);
      return createErrorResponse(
        error instanceof Error ? error : new Error('Failed to process resume embedding')
      );
    }
  },
  {
    requiredRoles: ['jobseeker'],
    bodySchema: processResumeSchema,
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true },
  }
);

// GET /api/profile/resume/process-embedding - Get resume embedding status
export const GET = withAPIMiddleware(
  async (req, context) => {
    const { user } = context;
    const userId = user!.id;

    try {
      // Get current embedding status
      const embedding = await ResumeEmbeddingService.getResumeEmbedding(userId);
      
      // Check if processing is needed
      const needsProcessing = await ResumeEmbeddingService.needsReprocessing(userId);
      
      // Check for pending queue jobs
      const pendingJobs = await prisma.jobProcessingQueue.findMany({
        where: {
          userId,
          jobType: 'resume_embedding',
          status: {
            in: ['pending', 'processing']
          }
        },
        select: {
          id: true,
          status: true,
          scheduledFor: true,
          retryCount: true,
          error: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      });

      return createSuccessResponse({
        hasEmbedding: !!embedding,
        needsProcessing,
        embedding: embedding ? {
          skills: embedding.skills.slice(0, 10), // Limit for display
          jobTitles: embedding.jobTitles.slice(0, 5),
          industries: embedding.industries.slice(0, 5),
          lastProcessed: embedding.lastJobProcessed,
          embeddingModel: embedding.embeddingModel
        } : null,
        pendingProcessing: pendingJobs.length > 0 ? {
          status: pendingJobs[0].status,
          scheduledFor: pendingJobs[0].scheduledFor,
          retryCount: pendingJobs[0].retryCount,
          error: pendingJobs[0].error
        } : null
      });

    } catch (error) {
      console.error(`Failed to get resume embedding status for user ${userId}:`, error);
      return createErrorResponse(error instanceof Error ? error : new Error('Failed to get resume embedding status'));
    }
  },
  {
    requiredRoles: ['jobseeker'],
    rateLimit: { enabled: true, type: 'authenticated' },
    logging: { enabled: true },
  }
);