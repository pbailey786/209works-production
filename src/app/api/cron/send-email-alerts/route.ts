import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../auth/prisma';
import { EnhancedJobMatchingService } from '@/lib/search/job-matching';
import { emailQueue } from '@/lib/services/email-queue';
import { z } from 'zod';

// Validation for cron job requests
const cronRequestSchema = z.object({
  authorization: z.string().optional(),
  frequency: z.enum(['immediate', 'daily']).optional(),
  limit: z.number().min(1).max(1000).default(100),
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
    const { frequency = 'immediate', limit, dryRun } = cronRequestSchema.parse({
      ...body,
      authorization: req.headers.get('authorization'),
    });

    console.log(`[CRON] Starting email alert processing for frequency: ${frequency}`);
    
    const startTime = Date.now();
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Get alerts that need to be processed
    const alerts = await getAlertsToProcess(frequency, limit);
    console.log(`[CRON] Found ${alerts.length} alerts to process`);

    for (const alert of alerts) {
      try {
        results.processed++;
        
        // Skip if user has unsubscribed
        const isUnsubscribed = await checkIfUserUnsubscribed(alert.user.email, 'job_alert');
        if (isUnsubscribed) {
          results.skipped++;
          console.log(`[CRON] Skipping alert ${alert.id} - user unsubscribed`);
          continue;
        }

        // Find matching jobs using the enhanced algorithm
        const matchingJobs = await findMatchingJobs(alert);
        
        if (matchingJobs.length === 0) {
          results.skipped++;
          console.log(`[CRON] No matching jobs found for alert ${alert.id}`);
          continue;
        }

        // Add email to queue if not in dry run mode
        if (!dryRun) {
          await emailQueue.addJobAlertEmail(
            alert.user.email,
            alert.user.name || 'Job Seeker',
            matchingJobs,
            alert.id,
            alert.user.id,
            'normal' // Priority can be adjusted based on alert settings
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
        }

        results.sent++;
        console.log(`[CRON] Successfully processed alert ${alert.id} with ${matchingJobs.length} jobs`);

      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to process alert ${alert.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(`[CRON] ${errorMsg}`);
      }
    }

    const processingTime = Date.now() - startTime;
    
    console.log(`[CRON] Email alert processing completed in ${processingTime}ms`, results);

    return NextResponse.json({
      success: true,
      message: `Email alert processing completed`,
      data: {
        frequency,
        processingTime,
        dryRun,
        ...results,
      },
    });

  } catch (error) {
    console.error('[CRON] Email alert processing failed:', error);
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
  const frequency = searchParams.get('frequency') as 'immediate' | 'daily' || 'immediate';
  
  try {
    const alertCount = await prisma.alert.count({
      where: {
        isActive: true,
        frequency: frequency,
        emailEnabled: true,
      },
    });

    return NextResponse.json({
      message: 'Email alert cron job is operational',
      data: {
        alertsToProcess: alertCount,
        frequency,
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

// Helper function to get alerts that need processing
async function getAlertsToProcess(frequency: 'immediate' | 'daily', limit: number) {
  const now = new Date();
  let timeCondition = {};

  if (frequency === 'daily') {
    // For daily alerts, check if last triggered was more than 24 hours ago
    const yesterdayTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    timeCondition = {
      OR: [
        { lastTriggered: null },
        { lastTriggered: { lt: yesterdayTime } },
      ],
    };
  } else {
    // For immediate alerts, check if last triggered was more than 5 minutes ago
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
      lastTriggered: 'asc', // Process oldest first
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

// Helper function to find matching jobs using enhanced algorithm
async function findMatchingJobs(alert: any) {
  // Convert alert criteria to search criteria
  const searchCriteria = {
    keywords: alert.keywords || [],
    jobTitle: alert.jobTitle,
    location: alert.location,
    salaryMin: alert.salaryMin,
    salaryMax: alert.salaryMax,
    jobTypes: alert.jobTypes || [],
    categories: alert.categories || [],
    companies: alert.companies || [],
  };

  // Use enhanced matching algorithm
  const results = await EnhancedJobMatchingService.findMatchingJobs(searchCriteria, 10);

  return results.filter((job: any) => job.relevanceScore > 0.4);
}

// Note: Email sending is now handled by the email queue system
// The emailQueue.addJobAlertEmail() method handles email creation, sending, and logging 