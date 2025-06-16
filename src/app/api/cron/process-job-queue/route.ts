import { NextRequest, NextResponse } from 'next/server';
import { JobQueueService } from '@/lib/services/job-queue';
import { createSuccessResponse, createErrorResponse } from '@/lib/errors/api-errors';

// GET /api/cron/process-job-queue - Process pending jobs from the queue
export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return createErrorResponse('Unauthorized', 401);
  }

  try {
    console.log('🔄 Starting job queue processing...');

    // Process up to 10 jobs per cron run to avoid timeouts
    const result = await JobQueueService.processAllPendingJobs(10);

    // Get current queue stats
    const queueStats = await JobQueueService.getQueueStats();

    console.log('✅ Job queue processing completed');

    return createSuccessResponse({
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      queueStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Job queue processing failed:', error);
    
    return createErrorResponse(
      'Job queue processing failed',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// POST /api/cron/process-job-queue - Manual trigger for processing jobs
export async function POST(request: NextRequest) {
  // This endpoint can be called manually by admins or for testing
  try {
    const body = await request.json().catch(() => ({}));
    const { maxJobs = 5 } = body;

    console.log(`🔄 Manual job queue processing (max: ${maxJobs})...`);

    const result = await JobQueueService.processAllPendingJobs(maxJobs);
    const queueStats = await JobQueueService.getQueueStats();

    return createSuccessResponse({
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      queueStats,
      trigger: 'manual',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Manual job queue processing failed:', error);
    
    return createErrorResponse(
      'Manual job queue processing failed',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}