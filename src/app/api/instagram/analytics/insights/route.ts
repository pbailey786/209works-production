import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import InstagramAnalyticsService from '@/lib/services/instagram-analytics';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import type { Session } from 'next-auth';

const insightsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  postType: z.string().optional(),
  jobId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session!.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session!.user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    try {
      const validatedParams = insightsQuerySchema.parse(queryParams);

      const analyticsService = new InstagramAnalyticsService();

      const filters = {
        startDate: validatedParams.startDate
          ? new Date(validatedParams.startDate)
          : undefined,
        endDate: validatedParams.endDate
          ? new Date(validatedParams.endDate)
          : undefined,
        postType: validatedParams.postType,
        jobId: validatedParams.jobId,
      };

      // Get performance insights
      const insights = await analyticsService.getPerformanceInsights(filters);

      return NextResponse.json({ insights });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: validationError.errors,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Error fetching Instagram insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
