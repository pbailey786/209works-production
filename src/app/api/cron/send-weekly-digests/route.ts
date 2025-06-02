import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../auth/prisma';
import { emailQueue } from '@/lib/services/email-queue';
import { z } from 'zod';

// Validation for cron job requests
const cronRequestSchema = z.object({
  authorization: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0=Sunday, 1=Monday, etc.
  limit: z.number().min(1).max(500).default(100),
  dryRun: z.boolean().default(false),
});

// Verify the request is coming from Vercel Cron or is properly authorized
function verifyCronRequest(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // In production, verify the cron secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return false;
  }
  
  // Alternatively, check for Vercel's cron headers
  const vercelCronHeader = req.headers.get('x-vercel-cron');
  if (vercelCronHeader === '1') {
    return true;
  }
  
  // For development, allow requests with proper auth header
  return authHeader?.startsWith('Bearer ') || false;
}

export async function POST(req: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    if (!verifyCronRequest(req)) {
      return NextResponse.json(
        { error: 'Unauthorized cron request' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { dayOfWeek, limit, dryRun } = cronRequestSchema.parse({
      ...body,
      authorization: req.headers.get('authorization'),
    });

    console.log(`[CRON] Starting weekly digest processing`);
    
    const startTime = Date.now();
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Get weekly digests that need to be sent
    const weeklyDigests = await getWeeklyDigestsToProcess(limit, dayOfWeek);
    console.log(`[CRON] Found ${weeklyDigests.length} weekly digests to process`);

    for (const digest of weeklyDigests) {
      try {
        results.processed++;
        
        // Skip if user has unsubscribed
        const isUnsubscribed = await checkIfUserUnsubscribed(digest.user.email, 'weekly_digest');
        if (isUnsubscribed) {
          results.skipped++;
          console.log(`[CRON] Skipping digest ${digest.id} - user unsubscribed`);
          continue;
        }

        // Get jobs for the digest
        const jobs = await getJobsForDigest(digest);
        
        // Add email to queue if not in dry run mode
        if (!dryRun) {
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
        }

        results.sent++;
        console.log(`[CRON] Successfully processed digest ${digest.id} with ${jobs.length} jobs`);

      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to process digest ${digest.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(`[CRON] ${errorMsg}`);
      }
    }

    const processingTime = Date.now() - startTime;
    
    console.log(`[CRON] Weekly digest processing completed in ${processingTime}ms`, results);

    return NextResponse.json({
      success: true,
      message: `Weekly digest processing completed`,
      data: {
        processingTime,
        dryRun,
        dayOfWeek,
        ...results,
      },
    });

  } catch (error) {
    console.error('[CRON] Weekly digest processing failed:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check and manual triggering
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.
  
  try {
    const digestCount = await prisma.weeklyDigest.count({
      where: {
        isActive: true,
        dayOfWeek: currentDayOfWeek,
      },
    });

    return NextResponse.json({
      message: 'Weekly digest cron job is operational',
      data: {
        digestsToProcess: digestCount,
        currentDayOfWeek,
        currentTime: today.toISOString(),
        lastRun: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    );
  }
}

// Helper function to get weekly digests that need processing
async function getWeeklyDigestsToProcess(limit: number, targetDayOfWeek?: number) {
  const now = new Date();
  const currentDayOfWeek = targetDayOfWeek ?? now.getDay(); // 0=Sunday, 1=Monday, etc.
  
  // For weekly digests, check if last sent was more than 6 days ago
  const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  
  return await prisma.weeklyDigest.findMany({
    where: {
      isActive: true,
      dayOfWeek: currentDayOfWeek,
      OR: [
        { lastSentAt: null },
        { lastSentAt: { lt: sixDaysAgo } },
      ],
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
      lastSentAt: 'asc', // Process oldest first
    },
    take: limit,
  });
}

// Helper function to check if user has unsubscribed
async function checkIfUserUnsubscribed(email: string, emailType: string): Promise<boolean> {
  const unsubscribe = await prisma.emailUnsubscribe.findUnique({
    where: { email },
  });

  if (!unsubscribe) return false;
  
  return unsubscribe.unsubscribeAll || unsubscribe.unsubscribeFrom.includes(emailType);
}

// Helper function to get jobs for weekly digest
async function getJobsForDigest(digest: any) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Build search criteria from digest preferences
  const searchCriteria = {
    location: digest.location,
    categories: digest.categories || [],
    jobTypes: digest.jobTypes || [],
  };

  // Get recent jobs from the last week
  let whereCondition: any = {
    createdAt: { gte: oneWeekAgo },
    status: 'active',
  };

  // Add location filter if specified
  if (digest.location) {
    whereCondition.OR = [
      { location: { contains: digest.location, mode: 'insensitive' } },
      { isRemote: true },
    ];
  }

  // Add category filter if specified
  if (digest.categories && digest.categories.length > 0) {
    whereCondition.categories = {
      hasSome: digest.categories,
    };
  }

  // Add job type filter if specified
  if (digest.jobTypes && digest.jobTypes.length > 0) {
    whereCondition.jobType = {
      in: digest.jobTypes,
    };
  }

  const recentJobs = await prisma.job.findMany({
    where: whereCondition,
    orderBy: [
      { createdAt: 'desc' },
    ],
    take: 15, // Limit to top 15 recent jobs
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      salaryMin: true,
      salaryMax: true,
      jobType: true,
      createdAt: true,
    },
  });

  // Format jobs for email template
  return recentJobs.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salaryMin && job.salaryMax 
      ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
      : undefined,
    jobType: job.jobType || 'Full-time',
    postedDate: formatRelativeDate(job.createdAt),
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${job.id}`,
  }));
}

// Helper function to format relative date
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return '1 day ago';
  }
  
  return `${diffInDays} days ago`;
}

// Note: Email sending is now handled by the email queue system
// The emailQueue.addWeeklyDigestEmail() method handles email creation, sending, and logging 