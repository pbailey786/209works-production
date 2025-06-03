import { NextRequest, NextResponse } from 'next/server';
import { AdRotationService } from '@/lib/services/adRotationService';
import { z } from 'zod';

const clickSchema = z.object({
  adId: z.string().min(1, 'Ad ID is required'),
  userId: z.string().optional(),
  sessionId: z.string().min(1, 'Session ID is required'),
  targetUrl: z.string().url('Valid target URL is required'),
  userAgent: z.string().min(1, 'User agent is required'),
  referrer: z.string().optional().default(''),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = clickSchema.parse(body);

    // Record the click
    const result = await AdRotationService.recordClick(validatedData.adId, {
      userId: validatedData.userId,
      sessionId: validatedData.sessionId,
      targetUrl: validatedData.targetUrl,
      userAgent: validatedData.userAgent,
      referrer: validatedData.referrer,
    });

    return NextResponse.json({
      success: true,
      message: 'Click recorded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error recording click:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record click',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
