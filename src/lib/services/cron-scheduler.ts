import * as cron from 'node-cron';
import { prisma } from '@/lib/database/prisma';
import { EnhancedJobMatchingService } from '@/lib/search/job-matching';
import { emailQueue } from '@/lib/services/email-queue';

export class CronSchedulerService {
  private static instance: CronSchedulerService;
  private isRunning = false;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  private constructor() {}

  public static getInstance(): CronSchedulerService {
    if (!CronSchedulerService.instance) {
      CronSchedulerService.instance = new CronSchedulerService();
    }
    return CronSchedulerService.instance;
  }

  /**
   * Initialize all cron jobs
   */
  public initialize(): void {
    if (this.isRunning) {
      console.log('[CRON] Scheduler already running');
      return;
    }

    console.log('[CRON] Initializing cron scheduler...');

    // Schedule immediate job alerts (every 5 minutes)
    this.scheduleTask('immediate-alerts', '*/5 * * * *', () => {
      this.processEmailAlerts('immediate');
    });

    // Schedule daily job alerts (every day at 9:00 AM)
    this.scheduleTask('daily-alerts', '0 9 * * *', () => {
      this.processEmailAlerts('daily');
    });

    // Schedule weekly digest emails (every Monday at 9:00 AM)
    this.scheduleTask('weekly-digests', '0 9 * * 1', () => {
      this.processWeeklyDigests();
    });

    // Schedule token cleanup (every day at 2:00 AM)
    this.scheduleTask('token-cleanup', '0 2 * * *', () => {
      this.cleanupExpiredTokens();
    });

    // Schedule job rankings update (every 6 hours)
    this.scheduleTask('job-rankings', '0 */6 * * *', () => {
      this.updateJobRankings();
    });

    // Schedule database maintenance (every day at 3:00 AM)
    this.scheduleTask('db-maintenance', '0 3 * * *', () => {
      this.performDatabaseMaintenance();
    });

    this.isRunning = true;
    console.log('[CRON] All cron jobs scheduled successfully');
  }

  /**
   * Stop all cron jobs
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('[CRON] Stopping all cron jobs...');

    for (const [name, task] of this.scheduledTasks) {
      task.stop();
      console.log(`[CRON] Stopped task: ${name}`);
    }

    this.scheduledTasks.clear();
    this.isRunning = false;
    console.log('[CRON] All cron jobs stopped');
  }

  /**
   * Get status of all scheduled tasks
   */
  public getStatus(): { name: string; running: boolean }[] {
    return Array.from(this.scheduledTasks.entries()).map(([name, task]) => ({
      name,
      running: task.getStatus() === 'scheduled',
    }));
  }

  /**
   * Schedule a new cron task
   */
  private scheduleTask(name: string, schedule: string, task: () => void): void {
    const cronTask = cron.schedule(
      schedule,
      async () => {
        console.log(`[CRON] Starting task: ${name}`);
        const startTime = Date.now();

        try {
          await task();
          const duration = Date.now() - startTime;
          console.log(`[CRON] Completed task: ${name} in ${duration}ms`);
        } catch (error) {
          console.error(`[CRON] Failed task: ${name}`, error);
        }
      },
      {
        timezone: process.env.CRON_TIMEZONE || 'America/Los_Angeles',
      }
    );

    this.scheduledTasks.set(name, cronTask);
    console.log(`[CRON] Scheduled task: ${name} with schedule: ${schedule}`);
  }

  /**
   * Process email alerts for immediate or daily frequency
   */
  private async processEmailAlerts(
    frequency: 'immediate' | 'daily'
  ): Promise<void> {
    const alerts = await this.getAlertsToProcess(frequency);
    console.log(`[CRON] Processing ${alerts.length} ${frequency} alerts`);

    for (const alert of alerts) {
      try {
        // Skip if user has unsubscribed
        const isUnsubscribed = await this.checkIfUserUnsubscribed(
          alert.user.email,
          'job_alert'
        );
        if (isUnsubscribed) {
          continue;
        }

        // Find matching jobs
        const matchingJobs = await this.findMatchingJobs(alert);

        if (matchingJobs.length === 0) {
          continue;
        }

        // Add email to queue
        await emailQueue.addJobAlertEmail(
          alert.user.email,
          alert.user.name || 'Job Seeker',
          matchingJobs,
          alert.id,
          alert.user.id,
          'normal'
        );

        // Update alert statistics
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            lastTriggered: new Date(),
            totalJobsSent: {
              increment: matchingJobs.length,
            },
          },
        });
      } catch (error) {
        console.error(`[CRON] Failed to process alert ${alert.id}:`, error);
      }
    }
  }

  /**
   * Process weekly digest emails
   */
  private async processWeeklyDigests(): Promise<void> {
    const digests = await this.getWeeklyDigestsToProcess();
    console.log(`[CRON] Processing ${digests.length} weekly digests`);

    for (const digest of digests) {
      try {
        // Skip if user has unsubscribed
        const isUnsubscribed = await this.checkIfUserUnsubscribed(
          digest.user.email,
          'weekly_digest'
        );
        if (isUnsubscribed) {
          continue;
        }

        // Get jobs for digest
        const jobs = await this.getJobsForDigest(digest);

        // Add email to queue
        await emailQueue.addWeeklyDigestEmail(
          digest.user.email,
          digest.user.name || 'Job Seeker',
          jobs,
          digest.location || '209 Area',
          digest.user.id,
          'normal'
        );

        // Update digest statistics
        await prisma.weeklyDigest.update({
          where: { id: digest.id },
          data: {
            lastSentAt: new Date(),
            totalDigestsSent: {
              increment: 1,
            },
          },
        });
      } catch (error) {
        console.error(`[CRON] Failed to process digest ${digest.id}:`, error);
      }
    }
  }

  /**
   * Clean up expired tokens and old data
   */
  private async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();

    // Clean up expired magic link tokens
    const magicLinkResult = await prisma.user.updateMany({
      where: {
        AND: [
          { magicLinkToken: { not: null } },
          { magicLinkExpires: { lt: now } },
        ],
      },
      data: {
        magicLinkToken: null,
        magicLinkExpires: null,
      },
    });

    // Clean up expired password reset tokens
    const passwordResetResult = await prisma.user.updateMany({
      where: {
        AND: [
          { passwordResetToken: { not: null } },
          { passwordResetExpires: { lt: now } },
        ],
      },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Clean up old email logs (older than 90 days)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const emailLogResult = await prisma.emailLog.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
        status: { in: ['sent', 'delivered', 'failed', 'bounced'] },
      },
    });

    console.log(
      `[CRON] Cleanup completed: ${magicLinkResult.count} magic links, ${passwordResetResult.count} password resets, ${emailLogResult.count} email logs`
    );
  }

  /**
   * Update job rankings and popularity scores
   */
  private async updateJobRankings(): Promise<void> {
    // Mark expired jobs
    const expiredJobsResult = await prisma.job.updateMany({
      where: {
        OR: [
          {
            AND: [
              { expiresAt: { not: null } },
              { expiresAt: { lt: new Date() } },
            ],
          },
          {
            AND: [
              { expiresAt: null },
              {
                createdAt: {
                  lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                },
              },
            ],
          },
        ],
        status: { not: 'expired' },
      },
      data: {
        status: 'expired',
        updatedAt: new Date(),
      },
    });

    console.log(
      `[CRON] Updated job rankings and marked ${expiredJobsResult.count} jobs as expired`
    );
  }

  /**
   * Perform database maintenance tasks
   */
  private async performDatabaseMaintenance(): Promise<void> {
    try {
      // Clean up old search analytics (older than 180 days)
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      const analyticsResult = await prisma.searchAnalytics.deleteMany({
        where: {
          createdAt: { lt: sixMonthsAgo },
        },
      });

      console.log(
        `[CRON] Database maintenance: cleaned ${analyticsResult.count} old search analytics`
      );
    } catch (error) {
      console.error('[CRON] Database maintenance failed:', error);
    }
  }

  // Helper methods (similar to the ones in cron endpoints)
  private async getAlertsToProcess(frequency: 'immediate' | 'daily') {
    const now = new Date();
    let timeCondition = {};

    if (frequency === 'daily') {
      const yesterdayTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      timeCondition = {
        OR: [{ lastTriggered: null }, { lastTriggered: { lt: yesterdayTime } }],
      };
    } else {
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      timeCondition = {
        OR: [
          { lastTriggered: null },
          { lastTriggered: { lt: fiveMinutesAgo } },
        ],
      };
    }

    return await prisma.alert.findMany({
      where: {
        isActive: true,
        frequency: frequency,
        emailEnabled: true,
        ...timeCondition,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        lastTriggered: 'asc',
      },
      take: 100,
    });
  }

  private async getWeeklyDigestsToProcess() {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

    return await prisma.weeklyDigest.findMany({
      where: {
        isActive: true,
        dayOfWeek: currentDayOfWeek,
        OR: [{ lastSentAt: null }, { lastSentAt: { lt: sixDaysAgo } }],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        lastSentAt: 'asc',
      },
      take: 100,
    });
  }

  private async checkIfUserUnsubscribed(
    email: string,
    emailType: string
  ): Promise<boolean> {
    const unsubscribe = await prisma.emailUnsubscribe.findUnique({
      where: { email },
    });

    if (!unsubscribe) return false;
    return (
      unsubscribe.unsubscribeAll ||
      unsubscribe.unsubscribeFrom.includes(emailType)
    );
  }

  private async findMatchingJobs(alert: any) {
    // Simple job matching without the complex service for now
    const searchCriteria: any = {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    };

    if (alert.jobTitle) {
      searchCriteria.title = { contains: alert.jobTitle, mode: 'insensitive' };
    }

    if (alert.location) {
      searchCriteria.location = {
        contains: alert.location,
        mode: 'insensitive',
      };
    }

    if (alert.jobTypes && alert.jobTypes.length > 0) {
      searchCriteria.type = { in: alert.jobTypes };
    }

    if (alert.categories && alert.categories.length > 0) {
      searchCriteria.categories = { hasSome: alert.categories };
    }

    if (alert.companies && alert.companies.length > 0) {
      searchCriteria.company = { in: alert.companies };
    }

    if (alert.salaryMin) {
      searchCriteria.salaryMin = { gte: alert.salaryMin };
    }

    if (alert.salaryMax) {
      searchCriteria.salaryMax = { lte: alert.salaryMax };
    }

    const jobs = await prisma.job.findMany({
      where: searchCriteria,
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        jobType: true,
        salaryMin: true,
        salaryMax: true,
        description: true,
        createdAt: true,
      },
    });

    return jobs.map(job => ({
      ...job,
      relevanceScore: 0.8, // Default relevance score
    }));
  }

  private async getJobsForDigest(digest: any) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let whereCondition: any = {
      createdAt: { gte: oneWeekAgo },
      status: 'active',
    };

    if (digest.location) {
      whereCondition.OR = [
        { location: { contains: digest.location, mode: 'insensitive' } },
        { isRemote: true },
      ];
    }

    if (digest.categories && digest.categories.length > 0) {
      whereCondition.categories = {
        hasSome: digest.categories,
      };
    }

    if (digest.jobTypes && digest.jobTypes.length > 0) {
      whereCondition.type = {
        in: digest.jobTypes,
      };
    }

    const recentJobs = await prisma.job.findMany({
      where: whereCondition,
      orderBy: [{ createdAt: 'desc' }],
      take: 15,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        jobType: true,
        salaryMin: true,
        salaryMax: true,
        description: true,
        createdAt: true,
      },
    });

    return recentJobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary:
        job.salaryMin && job.salaryMax
          ? (() => {
              try {
                const minSalary =
                  typeof job.salaryMin === 'number' && isFinite(job.salaryMin)
                    ? job.salaryMin.toLocaleString()
                    : '0';
                const maxSalary =
                  typeof job.salaryMax === 'number' && isFinite(job.salaryMax)
                    ? job.salaryMax.toLocaleString()
                    : '0';
                return `$${minSalary} - $${maxSalary}`;
              } catch (error) {
                console.error('Error formatting job salary range:', error);
                return 'Salary not specified';
              }
            })()
          : undefined,
      jobType: job.jobType || 'Full-time',
      postedDate: this.formatRelativeDate(job.createdAt),
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${job.id}`,
    }));
  }

  private formatRelativeDate(date: Date): string {
    // Input validation
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('formatRelativeDate received invalid date:', date);
      return 'Invalid Date';
    }

    try {
      const now = new Date();

      // Validate current date
      if (isNaN(now.getTime())) {
        console.error('Current date is invalid in formatRelativeDate');
        return 'Invalid Date';
      }

      // Calculate time difference safely
      const timeDiff = now.getTime() - date.getTime();

      // Validate time difference
      if (!isFinite(timeDiff) || isNaN(timeDiff)) {
        console.warn('Invalid time difference calculated');
        return 'Invalid Date';
      }

      // Handle future dates
      if (timeDiff < 0) {
        return 'In the future';
      }

      // Prevent division by zero and ensure valid calculations
      const millisecondsPerHour = 1000 * 60 * 60;
      const millisecondsPerDay = millisecondsPerHour * 24;

      if (millisecondsPerHour <= 0 || millisecondsPerDay <= 0) {
        console.error('Invalid time constants in formatRelativeDate');
        return 'Invalid Date';
      }

      const diffInHours = Math.floor(timeDiff / millisecondsPerHour);

      // Validate hours calculation
      if (!isFinite(diffInHours) || isNaN(diffInHours) || diffInHours < 0) {
        console.warn('Invalid hours difference calculated:', diffInHours);
        return 'Invalid Date';
      }

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(timeDiff / (1000 * 60));
        return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
      }

      if (diffInHours < 24) {
        return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
      }

      const diffInDays = Math.floor(diffInHours / 24);

      // Validate days calculation
      if (!isFinite(diffInDays) || isNaN(diffInDays) || diffInDays < 0) {
        console.warn('Invalid days difference calculated:', diffInDays);
        return 'Invalid Date';
      }

      if (diffInDays === 1) {
        return '1 day ago';
      }

      if (diffInDays < 30) {
        return `${diffInDays} days ago`;
      }

      const diffInMonths = Math.floor(diffInDays / 30);
      if (diffInMonths === 1) {
        return '1 month ago';
      }

      if (diffInMonths < 12) {
        return `${diffInMonths} months ago`;
      }

      const diffInYears = Math.floor(diffInMonths / 12);
      return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
    } catch (error) {
      console.error('Error in formatRelativeDate:', error);
      return 'Invalid Date';
    }
  }

  // Note: Email sending is now handled by the email queue system
  // The emailQueue helper methods handle email creation, sending, and logging
}

// Export singleton instance
export const cronScheduler = CronSchedulerService.getInstance();
