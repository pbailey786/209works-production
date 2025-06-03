import { NextRequest, NextResponse } from 'next/server';
import { fetchAdzunaJobs } from '@/app/services/adzunaService';
import { AdzunaImportService } from '@/lib/services/adzuna-import';

export async function GET(req: NextRequest) {
  try {
    // Check if credentials are configured
    const hasCredentials = !!(
      process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY
    );

    if (!hasCredentials) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Adzuna API credentials not configured',
          hasCredentials: false,
        },
        { status: 400 }
      );
    }

    console.log('🧪 Testing Adzuna API connection...');

    // Test with a small sample
    const testCities = ['Stockton, CA'];
    const jobs = await fetchAdzunaJobs(testCities, 5);

    // Get current import stats
    const stats = await AdzunaImportService.getImportStats();

    return NextResponse.json({
      status: 'success',
      message: 'Adzuna API connection successful',
      hasCredentials: true,
      testResults: {
        jobsFetched: jobs.length,
        sampleJob: jobs[0] || null,
        testCity: testCities[0],
      },
      currentStats: stats,
    });
  } catch (error: any) {
    console.error('Adzuna API test failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Unknown error',
        hasCredentials: !!(
          process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY
        ),
        errorDetails: {
          name: error.name,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        },
      },
      { status: 500 }
    );
  }
}
