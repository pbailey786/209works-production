import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

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

    console.log('[CRON] Starting expired token cleanup...');

    const startTime = Date.now();
    const now = new Date();

    const results = {
      magicLinksExpired: 0,
      passwordResetTokensExpired: 0,
      totalCleaned: 0,
    };

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

    results.magicLinksExpired = magicLinkResult.count;
    console.log(
      `[CRON] Cleaned ${magicLinkResult.count} expired magic link tokens`
    );

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

    results.passwordResetTokensExpired = passwordResetResult.count;
    console.log(
      `[CRON] Cleaned ${passwordResetResult.count} expired password reset tokens`
    );

    // Clean up old email logs (older than 90 days)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const emailLogResult = await prisma.emailLog.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
        status: { in: ['sent', 'delivered', 'failed', 'bounced'] },
      },
    });

    console.log(
      `[CRON] Cleaned ${emailLogResult.count} old email logs (90+ days)`
    );

    // Clean up old search analytics (older than 180 days)
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const searchAnalyticsResult = await prisma.searchAnalytics.deleteMany({
      where: {
        createdAt: { lt: sixMonthsAgo },
      },
    });

    console.log(
      `[CRON] Cleaned ${searchAnalyticsResult.count} old search analytics (180+ days)`
    );

    results.totalCleaned =
      results.magicLinksExpired +
      results.passwordResetTokensExpired +
      emailLogResult.count +
      searchAnalyticsResult.count;

    const processingTime = Date.now() - startTime;

    console.log(
      `[CRON] Token cleanup completed in ${processingTime}ms`,
      results
    );

    return NextResponse.json({
      success: true,
      message: 'Token cleanup completed successfully',
      data: {
        processingTime,
        ...results,
        additionalCleaned: {
          emailLogs: emailLogResult.count,
          searchAnalytics: searchAnalyticsResult.count,
        },
      },
    });
  } catch (error) {
    console.error('[CRON] Token cleanup failed:', error);
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
    const now = new Date();

    // Count tokens that will be cleaned up
    const expiredMagicLinks = await prisma.user.count({
      where: {
        AND: [
          { magicLinkToken: { not: null } },
          { magicLinkExpires: { lt: now } },
        ],
      },
    });

    const expiredPasswordResets = await prisma.user.count({
      where: {
        AND: [
          { passwordResetToken: { not: null } },
          { passwordResetExpires: { lt: now } },
        ],
      },
    });

    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oldEmailLogs = await prisma.emailLog.count({
      where: {
        createdAt: { lt: ninetyDaysAgo },
        status: { in: ['sent', 'delivered', 'failed', 'bounced'] },
      },
    });

    return NextResponse.json({
      message: 'Token cleanup cron job is operational',
      data: {
        expiredTokensToClean: {
          magicLinks: expiredMagicLinks,
          passwordResets: expiredPasswordResets,
          oldEmailLogs,
        },
        lastCheck: now.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    );
  }
}
