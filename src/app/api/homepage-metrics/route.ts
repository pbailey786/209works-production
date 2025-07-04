/**
 * Homepage Metrics API
 * 
 * Public endpoint to get real-time social proof metrics
 * Read-only, no authentication required
 */

import { NextResponse } from 'next/server';
import { getCachedHomepageMetrics } from '@/lib/homepage-metrics';

export async function GET() {
  try {
    const metrics = await getCachedHomepageMetrics();
    
    return NextResponse.json({
      success: true,
      data: metrics
    });
    
  } catch (error) {
    console.error('Homepage metrics API error:', error);
    
    // Return fallback data on error
    return NextResponse.json({
      success: false,
      data: {
        activeJobs: 2847,
        recentHires: 143,
        localCompanyPercentage: 95,
        lastUpdated: new Date()
      }
    });
  }
}

// Cache this endpoint for 15 minutes
export const revalidate = 900;