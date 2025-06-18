import { NextRequest, NextResponse } from 'next/server';
import { PaymentRetryService } from '@/lib/services/payment-retry';

// This endpoint should be called by a cron service (like Vercel Cron or external cron)
// POST /api/cron/payment-retry - Process failed payment retries
export async function POST(request: NextRequest) {
  try {
    // Verify cron authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting payment retry process...');
    const startTime = Date.now();

    // Process payment retries
    const results = await PaymentRetryService.processRetries();

    const processingTime = Date.now() - startTime;
    
    console.log(`[Cron] Payment retry process completed in ${processingTime}ms`, results);

    return NextResponse.json({
      success: true,
      results,
      processingTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Cron] Payment retry process failed:', error);
    
    return NextResponse.json(
      {
        error: 'Payment retry process failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET /api/cron/payment-retry - Get retry statistics (for monitoring)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication (optional for monitoring endpoints)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await PaymentRetryService.getRetryStatistics();

    return NextResponse.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Cron] Failed to get retry statistics:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}