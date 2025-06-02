import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { sendEmail, validateEmailAddress, EMAIL_SECURITY_CONFIG } from '@/lib/email';
import { emailSecurityValidator } from '@/lib/email/security';
import { SecurityLogger } from '@/lib/security/security-monitor';
import { prisma } from '../../app/api/auth/prisma';
import JobAlertEmail from '@/components/emails/job-alert-email';
import WeeklyDigestEmail from '@/components/emails/weekly-digest-email';

// Email job types
export interface EmailJobData {
  id: string;
  type: 'job_alert' | 'weekly_digest' | 'password_reset' | 'verification' | 'generic';
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  userId?: string;
  alertId?: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  delay?: number; // Delay in milliseconds
  retryLimit?: number;
}

// Email queue configuration
const QUEUE_CONFIG = {
  name: 'email-queue',
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3, // Max retry attempts
    backoff: {
      type: 'exponential' as const,
      delay: 2000, // Start with 2 seconds
    },
    delay: 0, // No delay by default
  },
  limiter: {
    max: 10, // Max 10 emails per minute
    duration: 60 * 1000, // 1 minute
  },
};

// Worker configuration
const WORKER_CONFIG = {
  concurrency: 5, // Process 5 emails concurrently
  limiter: {
    max: 10, // Max 10 emails per minute
    duration: 60 * 1000, // 1 minute
  },
};

// Add missing type definitions
interface JobAlertEmailProps {
  userName: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salary: string;
  jobType: string;
  description: string;
  jobUrl: string;
  unsubscribeUrl: string;
  additionalJobsCount: number;
  totalMatchingJobs: number;
}

interface WeeklyDigestEmailProps {
  userName: string;
  jobs: any[];
  location: string;
  unsubscribeUrl: string;
  manageAlertsUrl: string;
}

export class EmailQueueService {
  private static instance: EmailQueueService;
  private redis: IORedis;
  private queue: Queue;
  private worker?: Worker;
  private queueEvents?: QueueEvents;
  private isInitialized = false;

  private constructor() {
    // Initialize Redis connection
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    
    if (redisUrl) {
      this.redis = new IORedis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true,
      });
    } else {
      // Fallback to local Redis
      this.redis = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true,
      });
    }

    // Initialize queue
    this.queue = new Queue(QUEUE_CONFIG.name, {
      connection: this.redis,
      defaultJobOptions: QUEUE_CONFIG.defaultJobOptions,
    });
  }

  public static getInstance(): EmailQueueService {
    if (!EmailQueueService.instance) {
      EmailQueueService.instance = new EmailQueueService();
    }
    return EmailQueueService.instance;
  }

  /**
   * Initialize the email queue system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[EMAIL-QUEUE] Already initialized');
      return;
    }

    try {
      // Test Redis connection
      await this.redis.ping();
      console.log('[EMAIL-QUEUE] Redis connection established');

      // Initialize worker
      this.worker = new Worker(
        QUEUE_CONFIG.name,
        this.processEmailJob.bind(this),
        {
          connection: this.redis,
          concurrency: WORKER_CONFIG.concurrency,
          limiter: WORKER_CONFIG.limiter,
        }
      );

      // Initialize queue events
      this.queueEvents = new QueueEvents(QUEUE_CONFIG.name, {
        connection: this.redis,
      });

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('[EMAIL-QUEUE] Email queue system initialized successfully');

    } catch (error) {
      console.error('[EMAIL-QUEUE] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Add an email job to the queue with security validation
   */
  public async addEmailJob(
    jobData: Omit<EmailJobData, 'id'>,
    options?: {
      priority?: number;
      delay?: number;
      attempts?: number;
    }
  ): Promise<Job<EmailJobData>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Security validation before adding to queue
    const emailValidation = validateEmailAddress(jobData.to);
    if (!emailValidation.isValid) {
      const error = new Error(`Invalid email address: ${emailValidation.errors.join(', ')}`);
      SecurityLogger.suspiciousRequest(
        'queue-system',
        'Invalid email in queue job',
        { email: jobData.to, errors: emailValidation.errors },
        jobData.userId
      );
      throw error;
    }

    // Validate subject
    const subjectValidation = emailSecurityValidator.validateSubject(jobData.subject);
    if (!subjectValidation.isValid) {
      const error = new Error(`Invalid email subject: ${subjectValidation.errors.join(', ')}`);
      SecurityLogger.suspiciousRequest(
        'queue-system',
        'Invalid email subject in queue job',
        { subject: jobData.subject, errors: subjectValidation.errors },
        jobData.userId
      );
      throw error;
    }

    // Rate limiting check for queue additions
    const rateLimitKey = jobData.userId || jobData.to;
    const rateLimitCheck = emailSecurityValidator.checkRateLimit(`queue_${rateLimitKey}`);
    if (!rateLimitCheck.allowed) {
      const error = new Error('Rate limit exceeded for email queue additions');
      SecurityLogger.rateLimitExceeded('queue-system', 'email-queue-add', jobData.userId);
      throw error;
    }

    const emailJobData: EmailJobData = {
      ...jobData,
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const jobOptions = {
      priority: this.getPriorityScore(jobData.priority || 'normal'),
      delay: options?.delay || jobData.delay || 0,
      attempts: options?.attempts || jobData.retryLimit || 3,
      removeOnComplete: 100,
      removeOnFail: 50,
    };

    const job = await this.queue.add('send-email', emailJobData, jobOptions);
    
    console.log(`[EMAIL-QUEUE] Added secure email job ${emailJobData.id} for ${emailJobData.to}`);
    SecurityLogger.loginSuccess(jobData.userId || 'system', 'queue-system', `Email job added: ${jobData.subject}`);
    
    return job;
  }

  /**
   * Add multiple email jobs in bulk
   */
  public async addBulkEmailJobs(
    jobs: Array<{
      data: Omit<EmailJobData, 'id'>;
      options?: {
        priority?: number;
        delay?: number;
        attempts?: number;
      };
    }>
  ): Promise<Job<EmailJobData>[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const bulkJobs = jobs.map((job, index) => ({
      name: 'send-email',
      data: {
        ...job.data,
        id: `email_bulk_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      } as EmailJobData,
      opts: {
        priority: this.getPriorityScore(job.data.priority || 'normal'),
        delay: job.options?.delay || job.data.delay || 0,
        attempts: job.options?.attempts || job.data.retryLimit || 3,
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }));

    const addedJobs = await this.queue.addBulk(bulkJobs);
    console.log(`[EMAIL-QUEUE] Added ${addedJobs.length} bulk email jobs`);
    return addedJobs;
  }

  /**
   * Process individual email jobs
   */
  private async processEmailJob(job: Job<EmailJobData>): Promise<void> {
    const { data } = job;
    const startTime = Date.now();

    try {
      console.log(`[EMAIL-QUEUE] Processing email job ${data.id} for ${data.to}`);

      // Check if user has unsubscribed (for marketing emails)
      if (['job_alert', 'weekly_digest'].includes(data.type)) {
        const isUnsubscribed = await this.checkIfUserUnsubscribed(data.to, data.type);
        if (isUnsubscribed) {
          console.log(`[EMAIL-QUEUE] Skipping email ${data.id} - user unsubscribed`);
          return;
        }
      }

      // Generate email content based on template
      const emailContent = await this.generateEmailContent(data);

      // Send email with security features
      const result = await sendEmail({
        to: data.to,
        subject: data.subject,
        react: emailContent,
        userId: data.userId,
        priority: data.priority,
        metadata: {
          jobId: data.id,
          alertId: data.alertId,
          template: data.template,
          source: 'email-queue',
          clientIp: 'queue-system',
          ...data.metadata,
        },
      });

      // Log email
      await this.logEmail(data, result.success ? { data: result.data } : { error: new Error(result.error || 'Unknown error') }, startTime);

      if (!result.success) {
        const errorMessage = result.error || 'Unknown error occurred';
        throw new Error(errorMessage);
      }

      console.log(`[EMAIL-QUEUE] Successfully sent email ${data.id} in ${Date.now() - startTime}ms`);

    } catch (error) {
      console.error(`[EMAIL-QUEUE] Failed to process email job ${data.id}:`, error);
      
      // Log failed email
      await this.logEmail(data, { error: error as Error }, startTime);
      
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  /**
   * Generate email content based on template
   */
  private async generateEmailContent(data: EmailJobData): Promise<React.ReactElement> {
    switch (data.template) {
      case 'job-alert':
        return JobAlertEmail(data.data as JobAlertEmailProps);
      
      case 'weekly-digest':
        return WeeklyDigestEmail(data.data as WeeklyDigestEmailProps);
      
      // Add more templates as needed
      default:
        throw new Error(`Unknown email template: ${data.template}`);
    }
  }

  /**
   * Check if user has unsubscribed
   */
  private async checkIfUserUnsubscribed(email: string, emailType: string): Promise<boolean> {
    try {
      const unsubscribe = await prisma.emailUnsubscribe.findUnique({
        where: { email },
      });

      if (!unsubscribe) return false;
      return unsubscribe.unsubscribeAll || unsubscribe.unsubscribeFrom.includes(emailType);
    } catch (error) {
      console.error('[EMAIL-QUEUE] Error checking unsubscribe status:', error);
      return false; // Default to not unsubscribed if check fails
    }
  }

  /**
   * Log email results
   */
  private async logEmail(
    data: EmailJobData,
    result: { error?: Error; data?: any },
    startTime: number
  ): Promise<void> {
    try {
      await prisma.emailLog.create({
        data: {
          toEmail: data.to,
          userId: data.userId,
          alertId: data.alertId,
          subject: data.subject,
          emailType: data.type,
          status: result.error ? 'failed' : 'sent',
          statusMessage: result.error?.message,
          resendId: result.data?.id,
          sentAt: result.error ? null : (() => {
          try {
            const now = new Date();
            return isNaN(now.getTime()) ? null : now;
          } catch (error) {
            console.error('Error creating sentAt timestamp:', error);
            return null;
          }
        })(),
          // processingTime: Date.now() - startTime, // Field not yet in schema
          metadata: {
            jobId: data.id,
            template: data.template,
            priority: data.priority,
            ...data.metadata,
          },
        },
      });
    } catch (error) {
      console.error('[EMAIL-QUEUE] Failed to log email:', error);
    }
  }

  /**
   * Convert priority string to numeric score for BullMQ
   */
  private getPriorityScore(priority: string): number {
    const priorityMap = {
      critical: 100,
      high: 75,
      normal: 50,
      low: 25,
    };
    return priorityMap[priority as keyof typeof priorityMap] || 50;
  }

  /**
   * Set up event listeners for monitoring
   */
  private setupEventListeners(): void {
    if (!this.worker || !this.queueEvents) return;

    // Worker events
    this.worker.on('completed', (job: Job) => {
      console.log(`[EMAIL-QUEUE] Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`[EMAIL-QUEUE] Job ${job?.id || 'unknown'} failed:`, err.message);
    });

    this.worker.on('stalled', (jobId: string) => {
      console.warn(`[EMAIL-QUEUE] Job ${jobId} stalled`);
    });

    // Queue events
    this.queueEvents.on('waiting', ({ jobId }) => {
      console.log(`[EMAIL-QUEUE] Job ${jobId} is waiting`);
    });

    this.queueEvents.on('active', ({ jobId }) => {
      console.log(`[EMAIL-QUEUE] Job ${jobId} is active`);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`[EMAIL-QUEUE] Job ${jobId} progress: ${data}%`);
    });
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaiting(),
      this.queue.getActive(),
      this.queue.getCompleted(),
      this.queue.getFailed(),
      this.queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused: 0, // Placeholder since getPaused doesn't exist in this version
    };
  }

  /**
   * Pause the queue
   */
  public async pauseQueue(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    await this.queue.pause();
    console.log('[EMAIL-QUEUE] Queue paused');
  }

  /**
   * Resume the queue
   */
  public async resumeQueue(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    await this.queue.resume();
    console.log('[EMAIL-QUEUE] Queue resumed');
  }

  /**
   * Clear all jobs from the queue
   */
  public async clearQueue(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    await this.queue.drain();
    console.log('[EMAIL-QUEUE] Queue cleared');
  }

  /**
   * Gracefully close the queue system
   */
  public async close(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      if (this.worker) {
        await this.worker.close();
      }
      if (this.queueEvents) {
        await this.queueEvents.close();
      }
      await this.queue.close();
      await this.redis.quit();
      
      this.isInitialized = false;
      console.log('[EMAIL-QUEUE] Email queue system closed gracefully');
    } catch (error) {
      console.error('[EMAIL-QUEUE] Error closing queue system:', error);
    }
  }

  /**
   * Helper method to add a job alert email
   */
  public async addJobAlertEmail(
    userEmail: string,
    userName: string,
    jobs: any[],
    alertId: string,
    userId: string,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<Job<EmailJobData>> {
    const topJob = jobs[0];
    
    const emailData = {
      userName,
      jobTitle: topJob.title,
      companyName: topJob.company,
      location: topJob.location,
      salary: topJob.salaryMin && topJob.salaryMax 
        ? (() => {
            try {
              const minSalary = typeof topJob.salaryMin === 'number' && isFinite(topJob.salaryMin) 
                ? topJob.salaryMin.toLocaleString() 
                : '0';
              const maxSalary = typeof topJob.salaryMax === 'number' && isFinite(topJob.salaryMax) 
                ? topJob.salaryMax.toLocaleString() 
                : '0';
              return `$${minSalary} - $${maxSalary}`;
            } catch (error) {
              console.error('Error formatting salary range:', error);
              return 'Salary not specified';
            }
          })()
        : 'Salary not specified',
      jobType: topJob.type || 'Full-time',
      description: topJob.snippet || topJob.description?.substring(0, 200) + '...' || '',
      jobUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${topJob.id}`,
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/email-alerts/unsubscribe?email=${encodeURIComponent(userEmail)}&type=job_alert`,
      additionalJobsCount: jobs.length - 1,
      totalMatchingJobs: jobs.length,
    };

    const subject = jobs.length === 1 
      ? `🎯 New Job Alert: ${topJob.title} at ${topJob.company}`
      : `🎯 ${jobs.length} New Job Matches: ${topJob.title} and more`;

    return this.addEmailJob({
      type: 'job_alert',
      to: userEmail,
      subject,
      template: 'job-alert',
      data: emailData,
      userId,
      alertId,
      priority,
      metadata: {
        jobCount: jobs.length,
      },
    });
  }

  /**
   * Helper method to add a weekly digest email
   */
  public async addWeeklyDigestEmail(
    userEmail: string,
    userName: string,
    jobs: any[],
    location: string,
    userId: string,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<Job<EmailJobData>> {
    const emailData = {
      userName,
      jobs,
      location: location || '209 Area',
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/email-alerts/unsubscribe?email=${encodeURIComponent(userEmail)}&type=weekly_digest`,
      manageAlertsUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/profile/alerts`,
    };

    const subject = jobs.length > 0
      ? `📊 Your Weekly Job Digest: ${jobs.length} New Jobs in ${location || '209 Area'}`
      : `📊 Your Weekly Job Digest: Stay Updated in ${location || '209 Area'}`;

    return this.addEmailJob({
      type: 'weekly_digest',
      to: userEmail,
      subject,
      template: 'weekly-digest',
      data: emailData,
      userId,
      priority,
      metadata: {
        jobCount: jobs.length,
        location,
      },
    });
  }
}

// Export singleton instance
export const emailQueue = EmailQueueService.getInstance(); 