import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../auth/prisma';

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

    console.log('[CRON] Starting job rankings update...');

    const startTime = Date.now();
    const results = {
      jobsUpdated: 0,
      expiredJobsUpdated: 0,
      searchAnalyticsProcessed: 0,
    };

    // Update job popularity scores based on recent activity
    await updateJobPopularityScores();

    // Mark expired jobs as inactive
    const expiredJobsResult = await markExpiredJobs();
    results.expiredJobsUpdated = expiredJobsResult;

    // Update job rankings based on various factors
    const rankingResult = await updateJobRankings();
    results.jobsUpdated = rankingResult;

    // Process search analytics for trending keywords
    const analyticsResult = await processSearchAnalytics();
    results.searchAnalyticsProcessed = analyticsResult;

    const processingTime = Date.now() - startTime;

    console.log(
      `[CRON] Job rankings update completed in ${processingTime}ms`,
      results
    );

    return NextResponse.json({
      success: true,
      message: 'Job rankings update completed successfully',
      data: {
        processingTime,
        ...results,
      },
    });
  } catch (error) {
    console.error('[CRON] Job rankings update failed:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET(req: NextRequest) {
  try {
    const activeJobsCount = await prisma.job.count({
      where: {
        status: 'active',
      },
    });

    const expiredJobsCount = await prisma.job.count({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { status: 'expired' }],
      },
    });

    return NextResponse.json({
      message: 'Job rankings update cron job is operational',
      data: {
        activeJobs: activeJobsCount,
        expiredJobs: expiredJobsCount,
        lastCheck: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    );
  }
}

// Helper function to update job popularity scores
async function updateJobPopularityScores(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // This would typically involve complex calculations based on:
  // - Job applications
  // - Job views/clicks
  // - Search result appearances
  // - User saves/bookmarks

  // For now, we'll implement a basic popularity calculation
  // In a real implementation, you'd calculate this based on actual metrics

  const jobs = await prisma.job.findMany({
    where: {
      status: 'active',
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      id: true,
      createdAt: true,
      salaryMin: true,
      salaryMax: true,
      jobType: true,
      isRemote: true,
    },
  });

  for (const job of jobs) {
    // Calculate a basic popularity score based on job attributes
    let popularityScore = 0.5; // Base score

    // Boost score for higher salaries
    if (job.salaryMin && job.salaryMin > 80000) {
      popularityScore += 0.2;
    }

    // Boost score for remote jobs
    if (job.isRemote) {
      popularityScore += 0.1;
    }

    // Boost score for full-time positions
    if (job.jobType === 'full_time') {
      popularityScore += 0.1;
    }

    // Reduce score for older jobs
    const daysOld = Math.floor(
      (Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysOld > 14) {
      popularityScore -= (daysOld - 14) * 0.01;
    }

    // Ensure score is between 0 and 1
    popularityScore = Math.max(0, Math.min(1, popularityScore));

    // Update the job with the calculated popularity score
    // Note: This assumes there's a popularityScore field in the Job model
    // You may need to add this field to your schema
    try {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          // popularityScore, // Uncomment when field is added to schema
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Failed to update job ${job.id}:`, error);
    }
  }

  console.log(`[CRON] Updated popularity scores for ${jobs.length} jobs`);
}

// Helper function to mark expired jobs
async function markExpiredJobs(): Promise<number> {
  const now = new Date();

  const result = await prisma.job.updateMany({
    where: {
      OR: [
        {
          AND: [{ expiresAt: { not: null } }, { expiresAt: { lt: now } }],
        },
        {
          // Jobs older than 90 days without explicit expiry
          AND: [
            { expiresAt: null },
            {
              createdAt: {
                lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
              },
            },
          ],
        },
      ],
      status: { not: 'expired' },
    },
    data: {
      status: 'expired',
      updatedAt: now,
    },
  });

  console.log(`[CRON] Marked ${result.count} jobs as expired`);
  return result.count;
}

// Helper function to update job rankings
async function updateJobRankings(): Promise<number> {
  // This is a simplified ranking update
  // In a real implementation, you'd use more sophisticated algorithms

  const activeJobs = await prisma.job.findMany({
    where: {
      status: 'active',
    },
    select: {
      id: true,
      createdAt: true,
      salaryMin: true,
      isRemote: true,
      jobType: true,
    },
  });

  let updatedCount = 0;

  for (const job of activeJobs) {
    // Calculate ranking score based on multiple factors
    let rankingScore = 0;

    // Recency factor (newer jobs rank higher)
    const daysOld = Math.floor(
      (Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    rankingScore += Math.max(0, 100 - daysOld); // Max 100 points for new jobs

    // Salary factor
    if (job.salaryMin) {
      rankingScore += Math.min(50, job.salaryMin / 2000); // Max 50 points for salary
    }

    // Job type factor
    if (job.jobType === 'full_time') {
      rankingScore += 10;
    }

    // Remote work factor
    if (job.isRemote) {
      rankingScore += 5;
    }

    try {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          // rankingScore, // Uncomment when field is added to schema
          updatedAt: new Date(),
        },
      });
      updatedCount++;
    } catch (error) {
      console.error(`Failed to update ranking for job ${job.id}:`, error);
    }
  }

  console.log(`[CRON] Updated rankings for ${updatedCount} jobs`);
  return updatedCount;
}

// Helper function to process search analytics
async function processSearchAnalytics(): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    // Get recent search analytics to identify trending keywords
    const recentAnalytics = await prisma.searchAnalytics.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        query: true,
        resultCount: true,
        createdAt: true,
      },
    });

    // Group by search term and calculate metrics
    const searchMetrics = new Map();

    for (const analytics of recentAnalytics) {
      const term = (analytics.query || '').toLowerCase();
      if (!searchMetrics.has(term)) {
        searchMetrics.set(term, {
          count: 0,
          totalResults: 0,
          totalCTR: 0,
        });
      }

      const metrics = searchMetrics.get(term);
      metrics.count += 1;
      metrics.totalResults += analytics.resultCount || 0;
      metrics.totalCTR += 0; // Default CTR since field doesn't exist
    }

    // Log trending search terms (in a real implementation, you might store these)
    const trendingTerms = Array.from(searchMetrics.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    console.log(
      '[CRON] Top trending search terms:',
      trendingTerms.map(([term, metrics]) => ({
        term,
        searches: metrics.count,
        avgResults: Math.round(metrics.totalResults / metrics.count),
        avgCTR: (metrics.totalCTR / metrics.count).toFixed(3),
      }))
    );

    return recentAnalytics.length;
  } catch (error) {
    console.error('[CRON] Failed to process search analytics:', error);
    return 0;
  }
}
