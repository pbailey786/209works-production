import { NextRequest, NextResponse } from 'next/server';
import { AdzunaImportService } from '@/lib/services/adzuna-import';

// Priority 209 area code cities for automated imports
const PRIORITY_209_CITIES = [
  // Major 209 employment centers
  'Stockton, CA',
  'Modesto, CA',
  'Tracy, CA',
  'Manteca, CA',
  'Lodi, CA',
  'Turlock, CA',
  'Merced, CA',

  // Secondary 209 cities
  'Ceres, CA',
  'Patterson, CA',
  'Ripon, CA',
];

// POST /api/cron/adzuna-daily-import - Automated daily job import
export async function POST(req: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Starting automated Adzuna daily import...');

    // Check if we have Adzuna credentials
    if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
      console.log('⚠️ Adzuna credentials not configured, skipping import');
      return NextResponse.json({
        success: false,
        message: 'Adzuna credentials not configured',
        skipped: true,
      });
    }

    // Get current stats to determine import strategy
    const currentStats = await AdzunaImportService.getImportStats();

    // Determine import parameters based on current job count
    let importParams = {
      cities: PRIORITY_209_CITIES,
      resultsPerCity: 20,
      maxJobs: 200,
      filterQuality: true,
    };

    // If we have very few jobs, do a larger import
    if (currentStats.totalAdzunaJobs < 100) {
      importParams = {
        cities: PRIORITY_209_CITIES,
        resultsPerCity: 30,
        maxJobs: 400,
        filterQuality: true,
      };
      console.log('📈 Low job count detected, increasing import size');
    }

    // Clean up old jobs if we have too many
    if (currentStats.totalAdzunaJobs > 1000) {
      console.log('🧹 High job count detected, cleaning up old jobs first');
      const cleanupResult = await AdzunaImportService.cleanupOldJobs();
      console.log(
        `🗑️ Cleanup completed: ${cleanupResult.deleted} jobs removed`
      );
    }

    // Start the import
    const importResult = await AdzunaImportService.importJobs(importParams);

    // Log results
    console.log('📊 Daily import completed:', {
      success: importResult.success,
      imported: importResult.imported,
      skipped: importResult.skipped,
      errors: importResult.errors,
    });

    // Prepare response
    const response = {
      success: importResult.success,
      message: importResult.success
        ? 'Daily import completed successfully'
        : 'Daily import failed',
      timestamp: new Date().toISOString(),
      stats: {
        imported: importResult.imported,
        skipped: importResult.skipped,
        errors: importResult.errors,
        totalJobsBefore: currentStats.totalAdzunaJobs,
        totalJobsAfter: currentStats.totalAdzunaJobs + importResult.imported,
      },
      importParams,
      details: importResult.details.slice(-10), // Last 10 details only
    };

    // Return success/failure based on import result
    return NextResponse.json(response, {
      status: importResult.success ? 200 : 500,
    });
  } catch (error) {
    console.error('❌ Daily import cron job failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Daily import failed due to system error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        stats: {
          imported: 0,
          skipped: 0,
          errors: 1,
        },
      },
      { status: 500 }
    );
  }
}

// GET /api/cron/adzuna-daily-import - Check cron job status
export async function GET(req: NextRequest) {
  try {
    // Get current import statistics
    const stats = await AdzunaImportService.getImportStats();

    // Calculate time since last import
    const lastImportAge = stats.newestJob
      ? Math.floor(
          (Date.now() - stats.newestJob.getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

    // Determine if import is needed
    const needsImport =
      !stats.newestJob || (lastImportAge !== null && lastImportAge > 1);

    // Check configuration
    const hasCredentials = !!(
      process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY
    );
    const hasCronSecret = !!process.env.CRON_SECRET;

    return NextResponse.json({
      success: true,
      status: {
        hasCredentials,
        hasCronSecret,
        needsImport,
        lastImportAge,
        totalJobs: stats.totalAdzunaJobs,
        recentJobs: stats.recentJobs,
      },
      recommendations: {
        action: needsImport ? 'import_needed' : 'up_to_date',
        message: needsImport
          ? `Last import was ${lastImportAge} days ago, new import recommended`
          : 'Job data is up to date',
        suggestedParams: {
          cities: PRIORITY_209_CITIES.length,
          resultsPerCity: stats.totalAdzunaJobs < 100 ? 30 : 20,
          maxJobs: stats.totalAdzunaJobs < 100 ? 400 : 200,
        },
      },
    });
  } catch (error) {
    console.error('Failed to get cron job status:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
