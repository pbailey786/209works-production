import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/errors/api-errors';
import { JobMatchingService } from '@/lib/services/job-matching';

// GET /api/email/track - Track email interactions (opens, clicks)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('job_id');
  const userId = searchParams.get('user_id');
  const action = searchParams.get('action'); // 'open' or 'click'

  if (!jobId || !userId || !action) {
    return createErrorResponse('Missing required parameters', 400);
  }

  if (!['open', 'click'].includes(action)) {
    return createErrorResponse('Invalid action. Must be "open" or "click"', 400);
  }

  try {
    // Track the interaction
    await JobMatchingService.trackEmailInteraction(
      jobId, 
      userId, 
      action as 'opened' | 'clicked'
    );

    // For email opens, return a 1x1 transparent pixel
    if (action === 'open') {
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      
      return new Response(pixel, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // For clicks, redirect to the job page
    if (action === 'click') {
      const jobUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${jobId}?utm_source=ai_match_email&utm_medium=email&user_id=${userId}`;
      
      return NextResponse.redirect(jobUrl, 302);
    }

    return createSuccessResponse({ tracked: true });

  } catch (error) {
    console.error('Failed to track email interaction:', error);
    
    // For opens, still return the pixel even if tracking fails
    if (action === 'open') {
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      
      return new Response(pixel, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    return createErrorResponse('Failed to track interaction', 500);
  }
}