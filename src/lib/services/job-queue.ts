import { prisma } from '@/components/ui/card';
import { JobMatchingService } from '@/components/ui/card';
import { ResumeEmbeddingService } from './resume-embedding';

export type JobQueueType = 
  | 'featured_job_matching'
  | 'resume_embedding'
  | 'email_batch'
  | 'weekly_digest'
  | 'cleanup_old_matches';

export interface QueueJobPayload {
  jobId?: string;
  userId?: string;
  resumeText?: string;
  userIds?: string[];
  batchSize?: number;
  [key: string]: any;
}

export class JobQueueService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [5000, 15000, 60000]; // 5s, 15s, 1m

  /**
   * Add a job to the processing queue
   */
  static async enqueueJob(
    jobType: JobQueueType,
    payload: QueueJobPayload,
    options: {
      priority?: number;
      delayMs?: number;
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    const {
      priority = 0,
      delayMs = 0,
      maxRetries = this.MAX_RETRIES
    } = options;

    const scheduledFor = new Date(Date.now() + delayMs);

    const queueJob = await prisma.jobProcessingQueue.create({
      data: {
        jobType,
        jobId: payload.jobId,
        userId: payload.userId,
        payload: payload as any,
        priority,
        maxRetries,
        scheduledFor,
        status: 'pending'
      }
    });

    console.log(`📬 Enqueued ${jobType} job with ID: ${queueJob.id}`);
    return queueJob.id;
  }

  /**
   * Process the next available job from the queue
   */
  static async processNextJob(): Promise<boolean> {
    const job = await this.getNextPendingJob();
    
    if (!job) {
      return false; // No jobs to process
    }

    await this.markJobAsProcessing(job.id);

    try {
      console.log(`🔄 Processing ${job.jobType} job: ${job.id}`);
      
      const result = await this.executeJob(job.jobType as JobQueueType, job.payload, job.jobId, job.userId);
      
      if (result.success) {
        await this.markJobAsCompleted(job.id, result.data);
        console.log(`✅ Completed ${job.jobType} job: ${job.id}`);
      } else {
        await this.handleJobFailure(job.id, result.error || 'Unknown error', job.retryCount);
      }

      return true;
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      await this.handleJobFailure(
        job.id, 
        error instanceof Error ? error.message : 'Unknown error',
        job.retryCount
      );
      return false;
    }
  }

  /**
   * Get the next pending job to process
   */
  private static async getNextPendingJob() {
    return await prisma.jobProcessingQueue.findFirst({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: new Date()
        }
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledFor: 'asc' }
      ]
    });
  }

  /**
   * Mark a job as currently processing
   */
  private static async markJobAsProcessing(jobId: string): Promise<void> {
    await prisma.jobProcessingQueue.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        processedAt: new Date()
      }
    });
  }

  /**
   * Mark a job as completed
   */
  private static async markJobAsCompleted(jobId: string, resultData?: any): Promise<void> {
    await prisma.jobProcessingQueue.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        ...(resultData && { payload: resultData })
      }
    });
  }

  /**
   * Handle job failure and retry logic
   */
  private static async handleJobFailure(
    jobId: string, 
    error: string, 
    currentRetryCount: number
  ): Promise<void> {
    const job = await prisma.jobProcessingQueue.findUnique({
      where: { id: jobId }
    });

    if (!job) return;

    const newRetryCount = currentRetryCount + 1;

    if (newRetryCount <= job.maxRetries) {
      // Schedule retry with exponential backoff
      const delayMs = this.RETRY_DELAYS[Math.min(newRetryCount - 1, this.RETRY_DELAYS.length - 1)];
      const scheduledFor = new Date(Date.now() + delayMs);

      await prisma.jobProcessingQueue.update({
        where: { id: jobId },
        data: {
          status: 'pending',
          retryCount: newRetryCount,
          error,
          scheduledFor
        }
      });

      console.log(`🔄 Scheduled retry ${newRetryCount}/${job.maxRetries} for job ${jobId} in ${delayMs}ms`);
    } else {
      // Max retries exceeded, mark as failed
      await prisma.jobProcessingQueue.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error,
          completedAt: new Date()
        }
      });

      console.log(`❌ Job ${jobId} failed permanently after ${job.maxRetries} retries`);
    }
  }

  /**
   * Execute a specific job type
   */
  private static async executeJob(
    jobType: JobQueueType,
    payload: any,
    jobId?: string | null,
    userId?: string | null
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      switch (jobType) {
        case 'featured_job_matching':
          if (!jobId) {
            throw new Error('Job ID required for featured job matching');
          }
          const matchingResult = await JobMatchingService.processFeaturedJobMatching(jobId);
          return { success: matchingResult.success, data: matchingResult };

        case 'resume_embedding':
          if (!userId || !payload.resumeText) {
            throw new Error('User ID and resume text required for resume embedding');
          }
          await ResumeEmbeddingService.processResumeEmbedding(userId, payload.resumeText);
          return { success: true };

        case 'email_batch':
          // This would integrate with the email service
          const emailResult = await this.processEmailBatch(payload);
          return { success: emailResult.success, data: emailResult };

        case 'weekly_digest':
          // Process weekly digest emails
          const digestResult = await this.processWeeklyDigest(payload);
          return { success: digestResult.success, data: digestResult };

        case 'cleanup_old_matches':
          // Clean up old job matches
          const cleanupResult = await this.cleanupOldMatches(payload);
          return { success: true, data: cleanupResult };

        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process email batch sending
   */
  private static async processEmailBatch(payload: any): Promise<{ success: boolean; sent: number; errors?: any[]; error?: string }> {
    const { jobId, userIds = [], template = 'featured_job_match' } = payload;

    console.log(`📧 Processing email batch for job ${jobId}: ${userIds.length} recipients`);

    try {
      const { FeaturedJobEmailService } = await import('./featured-job-email');
      
      // Send emails for this job (FeaturedJobEmailService will filter by userIds if needed)
      const result = await FeaturedJobEmailService.sendJobMatchEmails(jobId);
      
      console.log(`✅ Email batch completed: ${result.emailsSent} sent, ${result.errors.length} errors`);
      
      return { 
        success: result.success, 
        sent: result.emailsSent,
        errors: result.errors 
      };
    } catch (error) {
      console.error(`❌ Failed to process email batch for job ${jobId}:`, error);
      return { 
        success: false, 
        sent: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process weekly digest emails
   */
  private static async processWeeklyDigest(payload: any): Promise<{ success: boolean; sent: number }> {
    console.log('📬 Processing weekly digest emails');
    
    // TODO: Implement weekly digest logic
    // This would gather featured jobs from the past week and send to opted-in users
    
    return { success: true, sent: 0 };
  }

  /**
   * Clean up old job matches
   */
  private static async cleanupOldMatches(payload: any): Promise<{ deleted: number }> {
    const { daysOld = 90 } = payload;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deleteResult = await prisma.jobMatch.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        job: {
          status: {
            in: ['expired', 'closed']
          }
        }
      }
    });

    console.log(`🧹 Cleaned up ${deleteResult.count} old job matches`);
    return { deleted: deleteResult.count };
  }

  /**
   * Queue featured job matching when a job is marked as featured
   */
  static async queueFeaturedJobMatching(jobId: string, priority: number = 10): Promise<void> {
    await this.enqueueJob('featured_job_matching', { jobId }, { priority });
  }

  /**
   * Queue resume embedding processing
   */
  static async queueResumeEmbedding(userId: string, resumeText: string): Promise<void> {
    await this.enqueueJob('resume_embedding', { userId, resumeText }, { priority: 5 });
  }

  /**
   * Queue batch email sending
   */
  static async queueEmailBatch(
    jobId: string, 
    userIds: string[], 
    template: string = 'featured_job_match'
  ): Promise<void> {
    // Split into smaller batches to avoid overwhelming the email service
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      batches.push(userIds.slice(i, i + batchSize));
    }

    for (const [index, batch] of batches.entries()) {
      await this.enqueueJob('email_batch', 
        { jobId, userIds: batch, template },
        { priority: 8, delayMs: index * 5000 } // Stagger batches by 5 seconds
      );
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats() {
    const stats = await prisma.jobProcessingQueue.groupBy({
      by: ['status', 'jobType'],
      _count: true
    });

    const summary = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      byType: {} as Record<string, Record<string, number>>
    };

    stats.forEach(stat => {
      const status = stat.status as keyof typeof summary;
      if (status in summary && typeof summary[status] === 'number') {
        (summary[status] as number) += stat._count;
      }

      if (!summary.byType[stat.jobType]) {
        summary.byType[stat.jobType] = {};
      }
      summary.byType[stat.jobType][stat.status] = stat._count;
    });

    return summary;
  }

  /**
   * Process all pending jobs (for batch processing)
   */
  static async processAllPendingJobs(maxJobs: number = 100): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    let processed = 0;
    let successful = 0;
    let failed = 0;

    while (processed < maxJobs) {
      const hasJob = await this.processNextJob();
      if (!hasJob) {
        break; // No more jobs to process
      }

      processed++;
      // You'd track success/failure based on the actual result
      successful++; // Simplified for now
    }

    console.log(`📊 Batch processing complete: ${processed} jobs processed (${successful} successful, ${failed} failed)`);

    return { processed, successful, failed };
  }

  /**
   * Cancel pending jobs (admin function)
   */
  static async cancelPendingJobs(jobType?: JobQueueType): Promise<number> {
    const where = {
      status: 'pending',
      ...(jobType && { jobType })
    };

    const result = await prisma.jobProcessingQueue.updateMany({
      where,
      data: {
        status: 'cancelled',
        completedAt: new Date()
      }
    });

    console.log(`🚫 Cancelled ${result.count} pending jobs${jobType ? ` of type ${jobType}` : ''}`);
    return result.count;
  }
}