import { NextRequest, NextResponse } from 'next/server';
import { AdRotationService } from '@/lib/services/adRotationService';
import { z } from 'zod';

const impressionSchema = z.object({
  adId: z.string().min(1, 'Ad ID is required'),
  userId: z.string().optional(),
  sessionId: z.string().min(1, 'Session ID is required'),
  page: z.string().min(1, 'Page is required'),
  position: z.string().min(1, 'Position is required'),
  userAgent: z.string().min(1, 'User agent is required'),
  referrer: z.string().optional().default(''),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = impressionSchema.parse(body);

    // Record the impression
    const result = await AdRotationService.recordImpression(
      validatedData.adId,
      {
        userId: validatedData.userId,
        sessionId: validatedData.sessionId,
        page: validatedData.page,
        position: validatedData.position,
        userAgent: validatedData.userAgent,
        referrer: validatedData.referrer,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Impression recorded successfully',
      data: result,
    });

  } catch (error) {
    console.error('Error recording impression:', error);
    
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
        error: 'Failed to record impression',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 