import { prisma } from '../app/api/auth/prisma';
import { getEmbedding } from '../lib/openai';

// Configuration with environment variable support
interface BackfillConfig {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  apiTimeout: number;
  maxConcurrency: number;
  resumeFromJobId?: string;
  dryRun: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const config: BackfillConfig = {
  batchSize: parseInt(process.env.BACKFILL_BATCH_SIZE || '50'),
  maxRetries: parseInt(process.env.BACKFILL_MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.BACKFILL_RETRY_DELAY || '2000'),
  apiTimeout: parseInt(process.env.BACKFILL_API_TIMEOUT || '30000'),
  maxConcurrency: parseInt(process.env.BACKFILL_MAX_CONCURRENCY || '5'),
  resumeFromJobId: process.env.BACKFILL_RESUME_FROM_JOB_ID,
  dryRun: process.env.BACKFILL_DRY_RUN === 'true',
  logLevel: (process.env.BACKFILL_LOG_LEVEL as any) || 'info',
};

// Comprehensive input validation utilities
class BackfillValidator {
  static isValidJobData(job: any): job is {
    id: string;
    title: string;
    company: string;
    description: string;
  } {
    return (
      job &&
      typeof job === 'object' &&
      typeof job.id === 'string' &&
      typeof job.title === 'string' &&
      typeof job.company === 'string' &&
      typeof job.description === 'string' &&
      job.id.length > 0 &&
      job.title.length > 0 &&
      job.company.length > 0 &&
      job.description.length > 0 &&
      job.id.length <= 100 &&
      job.title.length <= 500 &&
      job.company.length <= 200 &&
      job.description.length <= 50000
    );
  }

  static sanitizeJobData(job: any): {
    id: string;
    title: string;
    company: string;
    description: string;
  } | null {
    if (!this.isValidJobData(job)) {
      return null;
    }

    // Sanitize and validate content
    const sanitized = {
      id: job.id.trim(),
      title: this.sanitizeText(job.title, 500),
      company: this.sanitizeText(job.company, 200),
      description: this.sanitizeText(job.description, 8000), // OpenAI token limit consideration
    };

    // Additional validation after sanitization
    if (
      sanitized.title.length < 3 ||
      sanitized.company.length < 2 ||
      sanitized.description.length < 10
    ) {
      return null;
    }

    return sanitized;
  }

  static sanitizeText(text: string, maxLength: number): string {
    if (!text || typeof text !== 'string') return '';

    // Remove potentially dangerous characters and normalize
    return text
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, maxLength);
  }

  static isValidEmbedding(embedding: any): embedding is number[] {
    return (
      Array.isArray(embedding) &&
      embedding.length > 0 &&
      embedding.length <= 3072 && // OpenAI embedding dimension limit
      embedding.every(
        val => typeof val === 'number' && isFinite(val) && !isNaN(val)
      )
    );
  }

  static validateConfig(config: BackfillConfig): void {
    const errors: string[] = [];

    if (config.batchSize < 1 || config.batchSize > 1000) {
      errors.push('Batch size must be between 1 and 1000');
    }
    if (config.maxRetries < 0 || config.maxRetries > 10) {
      errors.push('Max retries must be between 0 and 10');
    }
    if (config.retryDelay < 100 || config.retryDelay > 60000) {
      errors.push('Retry delay must be between 100ms and 60s');
    }
    if (config.apiTimeout < 5000 || config.apiTimeout > 300000) {
      errors.push('API timeout must be between 5s and 5m');
    }
    if (config.maxConcurrency < 1 || config.maxConcurrency > 20) {
      errors.push('Max concurrency must be between 1 and 20');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
  }
}

// Enhanced logging system
class Logger {
  private logLevel: string;
  private logFile: string;

  constructor(level: string = 'info') {
    this.logLevel = level;
    this.logFile = `backfill-${new Date().toISOString().split('T')[0]}.log`;
  }

  private shouldLog(level: string): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return (
      levels[level as keyof typeof levels] >=
      levels[this.logLevel as keyof typeof levels]
    );
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }
}

// Rate limiting for API calls
class RateLimiter {
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private windowStart: number = Date.now();
  private readonly requestsPerMinute: number;
  private readonly minInterval: number;

  constructor(requestsPerMinute: number = 60) {
    this.requestsPerMinute = requestsPerMinute;
    this.minInterval = 60000 / requestsPerMinute; // Minimum time between requests
  }

  async waitForRateLimit(): Promise<void> {
    const now = Date.now();

    // Reset window if needed
    if (now - this.windowStart >= 60000) {
      this.windowStart = now;
      this.requestCount = 0;
    }

    // Check if we've exceeded rate limit
    if (this.requestCount >= this.requestsPerMinute) {
      const waitTime = 60000 - (now - this.windowStart);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.windowStart = Date.now();
        this.requestCount = 0;
      }
    }

    // Ensure minimum interval between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }
}

// Progress tracking and state management
class ProgressTracker {
  private startTime: number = Date.now();
  private processed: number = 0;
  private successful: number = 0;
  private failed: number = 0;
  private skipped: number = 0;
  private total: number = 0;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  setTotal(total: number): void {
    this.total = total;
    this.logger.info(`Starting backfill process for ${total} jobs`);
  }

  incrementProcessed(): void {
    this.processed++;
  }

  incrementSuccessful(): void {
    this.successful++;
  }

  incrementFailed(): void {
    this.failed++;
  }

  incrementSkipped(): void {
    this.skipped++;
  }

  reportProgress(): void {
    const elapsed = Date.now() - this.startTime;
    const rate = this.processed / (elapsed / 1000);
    const eta = this.total > 0 ? (this.total - this.processed) / rate : 0;

    this.logger.info(
      `Progress: ${this.processed}/${this.total} (${((this.processed / this.total) * 100).toFixed(1)}%)`,
      {
        successful: this.successful,
        failed: this.failed,
        skipped: this.skipped,
        rate: `${rate.toFixed(2)} jobs/sec`,
        eta: `${Math.round(eta)}s`,
      }
    );
  }

  getFinalReport(): any {
    const elapsed = Date.now() - this.startTime;
    return {
      total: this.total,
      processed: this.processed,
      successful: this.successful,
      failed: this.failed,
      skipped: this.skipped,
      elapsedTime: `${(elapsed / 1000).toFixed(2)}s`,
      averageRate: `${(this.processed / (elapsed / 1000)).toFixed(2)} jobs/sec`,
    };
  }
}

// Transaction manager for atomic operations
class TransactionManager {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async executeInTransaction<T>(operation: () => Promise<T>): Promise<T> {
    return await prisma.$transaction(
      async tx => {
        try {
          return await operation();
        } catch (error) {
          this.logger.error('Transaction failed, rolling back', {
            error: error instanceof Error ? error.message : error,
          });
          throw error;
        }
      },
      {
        maxWait: 10000, // 10 seconds
        timeout: 60000, // 1 minute
      }
    );
  }
}

// Safe job embedding generation with comprehensive error handling
async function getJobEmbedding(
  job: { title: string; company: string; description: string },
  rateLimiter: RateLimiter,
  logger: Logger
): Promise<number[]> {
  // Validate input
  const sanitizedJob = BackfillValidator.sanitizeJobData(job);
  if (!sanitizedJob) {
    throw new Error('Invalid job data provided');
  }

  // Check description length for meaningful embedding
  if (sanitizedJob.description.length < 10) {
    throw new Error('Job description too short for meaningful embedding');
  }

  // Apply rate limiting
  await rateLimiter.waitForRateLimit();

  let retries = 0;
  const maxRetries = config.maxRetries;

  while (retries <= maxRetries) {
    try {
      // Create safe input string with length validation
      const input = `${sanitizedJob.title} at ${sanitizedJob.company}: ${sanitizedJob.description}`;

      // Validate input length for OpenAI API
      if (input.length > 8000) {
        throw new Error('Input text too long for OpenAI API');
      }

      logger.debug(`Generating embedding for job`, {
        jobId: sanitizedJob.id,
        inputLength: input.length,
      });

      // Use the secure OpenAI wrapper with timeout
      const embedding = await Promise.race([
        getEmbedding(input),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('API timeout')), config.apiTimeout)
        ),
      ]);

      // Validate embedding
      if (!BackfillValidator.isValidEmbedding(embedding)) {
        throw new Error('Invalid embedding received from OpenAI');
      }

      logger.debug(`Successfully generated embedding`, {
        jobId: sanitizedJob.id,
        embeddingLength: embedding.length,
      });
      return embedding;
    } catch (error) {
      retries++;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (retries <= maxRetries) {
        logger.warn(
          `Attempt ${retries} failed for job ${sanitizedJob.id}, retrying in ${config.retryDelay}ms`,
          { error: errorMessage }
        );
        await new Promise(resolve =>
          setTimeout(resolve, config.retryDelay * retries)
        ); // Exponential backoff
      } else {
        logger.error(
          `Failed to generate embedding for job ${sanitizedJob.id} after ${maxRetries} retries`,
          { error: errorMessage }
        );
        throw error;
      }
    }
  }

  throw new Error('Max retries exceeded');
}

// Safe database operations with parameterized queries
async function updateJobEmbedding(
  jobId: string,
  embedding: number[],
  logger: Logger
): Promise<void> {
  // Validate inputs
  if (!jobId || typeof jobId !== 'string' || jobId.trim().length === 0) {
    throw new Error('Invalid job ID provided');
  }

  if (!BackfillValidator.isValidEmbedding(embedding)) {
    throw new Error('Invalid embedding data provided');
  }

  try {
    // Use Prisma's type-safe update to prevent SQL injection
    const result = await prisma.job.update({
      where: { id: jobId.trim() },
      data: {
        embedding: JSON.stringify(embedding), // Convert number array to string for Prisma
      },
    });

    logger.debug(`Successfully updated job embedding`, { jobId: jobId.trim() });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to update job ${jobId} in database`, {
      error: errorMessage,
    });
    throw error;
  }
}

// Get jobs that need embeddings with safe, paginated query
async function getJobsNeedingEmbeddings(
  batchSize: number,
  resumeFromJobId?: string,
  logger?: Logger
): Promise<
  Array<{ id: string; title: string; company: string; description: string }>
> {
  try {
    // Build safe where clause
    const whereClause: any = {
      embedding: null,
      title: { not: null },
      company: { not: null },
      description: { not: null },
    };

    // Add resume condition if specified
    if (resumeFromJobId) {
      whereClause.id = { gt: resumeFromJobId };
      logger?.info(`Resuming from job ID: ${resumeFromJobId}`);
    }

    // Use Prisma's type-safe query with proper pagination
    const jobs = await prisma.job.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
      },
      orderBy: { id: 'asc' }, // Consistent ordering for resumption
      take: batchSize,
    });

    // Validate and sanitize all job data
    const validJobs = jobs
      .map(job => BackfillValidator.sanitizeJobData(job))
      .filter((job): job is NonNullable<typeof job> => job !== null);

    logger?.debug(
      `Fetched ${jobs.length} jobs, ${validJobs.length} valid for processing`
    );
    return validJobs;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger?.error('Failed to fetch jobs from database', {
      error: errorMessage,
    });
    throw error;
  }
}

// Get total count for progress tracking
async function getTotalJobsNeedingEmbeddings(
  resumeFromJobId?: string
): Promise<number> {
  const whereClause: any = {
    embedding: null,
    title: { not: null },
    company: { not: null },
    description: { not: null },
  };

  if (resumeFromJobId) {
    whereClause.id = { gt: resumeFromJobId };
  }

  return await prisma.job.count({ where: whereClause });
}

// Main backfill function with comprehensive error handling and recovery
async function backfillEmbeddings(): Promise<void> {
  // Validate configuration
  BackfillValidator.validateConfig(config);

  const logger = new Logger(config.logLevel);
  const rateLimiter = new RateLimiter(50); // 50 requests per minute for safety
  const progressTracker = new ProgressTracker(logger);
  const transactionManager = new TransactionManager(logger);

  logger.info(
    '🚀 Starting embedding backfill process with configuration',
    config
  );

  if (config.dryRun) {
    logger.info('🧪 DRY RUN MODE - No actual updates will be made');
  }

  try {
    // Get total count for progress tracking
    const totalJobs = await getTotalJobsNeedingEmbeddings(
      config.resumeFromJobId
    );
    progressTracker.setTotal(totalJobs);

    if (totalJobs === 0) {
      logger.info('✅ No jobs need embedding updates');
      return;
    }

    let processedInBatch = 0;
    let currentResumeId = config.resumeFromJobId;

    // Process jobs in batches
    while (processedInBatch < totalJobs) {
      try {
        // Get next batch of jobs
        const jobs = await getJobsNeedingEmbeddings(
          config.batchSize,
          currentResumeId,
          logger
        );

        if (jobs.length === 0) {
          logger.info('No more jobs to process');
          break;
        }

        logger.info(`Processing batch of ${jobs.length} jobs`);

        // Process jobs with controlled concurrency
        const semaphore = new Array(config.maxConcurrency).fill(null);
        let jobIndex = 0;

        await Promise.all(
          semaphore.map(async () => {
            while (jobIndex < jobs.length) {
              const currentIndex = jobIndex++;
              const job = jobs[currentIndex];

              try {
                progressTracker.incrementProcessed();

                logger.debug(
                  `Processing job ${currentIndex + 1}/${jobs.length}: ${job.id}`
                );

                // Validate job data again before processing
                if (!job.description || job.description.trim().length < 10) {
                  logger.warn(`Skipping job ${job.id} - description too short`);
                  progressTracker.incrementSkipped();
                  continue;
                }

                if (config.dryRun) {
                  logger.info(
                    `[DRY RUN] Would process job ${job.id}: "${job.title}" at ${job.company}`
                  );
                  progressTracker.incrementSuccessful();
                  continue;
                }

                // Generate embedding
                const embedding = await getJobEmbedding(
                  job,
                  rateLimiter,
                  logger
                );

                // Update database in transaction
                await transactionManager.executeInTransaction(async () => {
                  await updateJobEmbedding(job.id, embedding, logger);
                });

                progressTracker.incrementSuccessful();
                logger.debug(`Successfully processed job ${job.id}`);
              } catch (error) {
                progressTracker.incrementFailed();
                const errorMessage =
                  error instanceof Error ? error.message : 'Unknown error';
                logger.error(`Failed to process job ${job.id}`, {
                  error: errorMessage,
                });

                // Continue processing other jobs even if one fails
                continue;
              }
            }
          })
        );

        // Update resume point
        if (jobs.length > 0) {
          currentResumeId = jobs[jobs.length - 1].id;
          logger.info(`Batch completed. Resume point: ${currentResumeId}`);
        }

        processedInBatch += jobs.length;

        // Report progress every batch
        progressTracker.reportProgress();

        // Small delay between batches to prevent overwhelming the system
        if (processedInBatch < totalJobs) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error('Batch processing failed', {
          error: errorMessage,
          resumePoint: currentResumeId,
        });

        // Wait before retrying the batch
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Final summary
    const finalReport = progressTracker.getFinalReport();
    logger.info('🎉 Backfill process completed!', finalReport);

    if (finalReport.failed > 0) {
      logger.warn(
        `⚠️ ${finalReport.failed} jobs failed to process. Check logs for details.`
      );
    }

    if (config.dryRun) {
      logger.info('🧪 DRY RUN completed - no actual changes were made');
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error('🔥 Fatal error during backfill process', {
      error: errorMessage,
    });
    throw error;
  }
}

// Script execution with proper cleanup and signal handling
async function main(): Promise<void> {
  let exitCode = 0;

  try {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    await backfillEmbeddings();
  } catch (error) {
    console.error(
      '🔥 Script failed:',
      error instanceof Error ? error.message : error
    );
    exitCode = 1;
  } finally {
    try {
      await prisma.$disconnect();
      console.log('📡 Database connection closed');
    } catch (disconnectError) {
      console.error('Failed to disconnect from database:', disconnectError);
      exitCode = 1;
    }
  }

  process.exit(exitCode);
}

// Handle process signals for graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

  try {
    await prisma.$disconnect();
    console.log('📡 Database connection closed during shutdown');
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
  }

  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Unhandled error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}
