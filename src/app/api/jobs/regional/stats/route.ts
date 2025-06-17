import { NextRequest, NextResponse } from 'next/server';
import { RegionalJobService } from '@/lib/services/regional-job-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');

    if (region) {
      // Get stats for specific region
      const stats = await RegionalJobService.getRegionalStats(region);

      return NextResponse.json({
        success: true,
        data: stats,
      });
    } else {
      // Get summary for all regions
      const summary = await RegionalJobService.getRegionSummary();

      return NextResponse.json({
        success: true,
        data: summary,
      });
    }
  } catch (error) {
    console.error('Regional stats API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch regional statistics',
      },
      { status: 500 }
    );
  }
}
