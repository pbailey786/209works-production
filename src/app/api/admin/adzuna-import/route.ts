import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../auth/authOptions';
import { AdzunaImportService } from '@/lib/services/adzuna-import';

// 209 Area Code Cities - Hyper-local focus for 209.works
const AREA_209_CITIES = [
  // Major 209 Cities
  'Stockton, CA',
  'Modesto, CA',
  'Tracy, CA',
  'Manteca, CA',
  'Lodi, CA',
  'Turlock, CA',
  'Merced, CA',

  // Smaller 209 Communities
  'Ceres, CA',
  'Patterson, CA',
  'Ripon, CA',
  'Escalon, CA',
  'Oakdale, CA',
  'Riverbank, CA',
  'Hughson, CA',
  'Newman, CA',
  'Gustine, CA',
  'Los Banos, CA',
  'Atwater, CA',
  'Livingston, CA',
  'Winton, CA',
  'Hilmar, CA',
  'Stevinson, CA',
  'Crows Landing, CA',
  'Vernalis, CA',
];

// POST /api/admin/adzuna-import - Start job import
export async function POST(req: NextRequest) {
  try {
    // Check authentication and admin access
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here
    // For now, allow any authenticated user for testing

    const body = await req.json();
    const {
      cities = AREA_209_CITIES,
      resultsPerCity = 25,
      maxJobs = 500,
      filterQuality = true,
      cleanupOld = false,
      removeDuplicates = true,
    } = body;

    console.log('🚀 Starting Adzuna import with options:', {
      cities: cities.length,
      resultsPerCity,
      maxJobs,
      filterQuality,
      cleanupOld,
    });

    // Clean up old jobs if requested
    if (cleanupOld) {
      const cleanupResult = await AdzunaImportService.cleanupOldJobs();
      console.log('🧹 Cleanup result:', cleanupResult);
    }

    // Start the import
    const importResult = await AdzunaImportService.importJobs({
      cities,
      resultsPerCity,
      maxJobs,
      filterQuality,
      removeDuplicates,
    });

    console.log('📊 Import result:', {
      success: importResult.success,
      imported: importResult.imported,
      skipped: importResult.skipped,
      errors: importResult.errors,
    });

    return NextResponse.json({
      success: importResult.success,
      message: importResult.success
        ? 'Import completed successfully'
        : 'Import failed',
      stats: {
        imported: importResult.imported,
        skipped: importResult.skipped,
        duplicates: importResult.duplicates,
        errors: importResult.errors,
      },
      details: importResult.details,
    });
  } catch (error) {
    console.error('Adzuna import API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/adzuna-import - Get import statistics
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get import statistics
    const stats = await AdzunaImportService.getImportStats();

    // Check if Adzuna credentials are configured
    const hasCredentials = !!(
      process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY
    );

    return NextResponse.json({
      success: true,
      hasCredentials,
      stats,
      availableCities: AREA_209_CITIES,
      recommendations: {
        suggestedImportSize: stats.totalAdzunaJobs < 100 ? 500 : 250,
        needsCleanup: stats.totalAdzunaJobs > 1000,
        lastImportAge: stats.newestJob
          ? Math.floor(
              (Date.now() - stats.newestJob.getTime()) / (1000 * 60 * 60 * 24)
            )
          : null,
      },
    });
  } catch (error) {
    console.error('Adzuna stats API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/adzuna-import - Clean up old jobs
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clean up old jobs
    const cleanupResult = await AdzunaImportService.cleanupOldJobs();

    return NextResponse.json({
      success: cleanupResult.success,
      message: cleanupResult.message,
      deleted: cleanupResult.deleted,
    });
  } catch (error) {
    console.error('Adzuna cleanup API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
