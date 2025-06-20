import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@clerk/nextjs/server';
import InstagramAnalyticsService from '@/lib/services/instagram-analytics';
import { prisma } from '@/components/ui/card';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  postType: z.string().optional(),
  jobId: z.string().optional(),
  limit: z.string().transform(Number).optional(),
});

const fetchAnalyticsSchema = z.object({
  postId: z.string(),
  mediaId: z.string(),
  accessToken: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    try {
      const validatedParams = analyticsQuerySchema.parse(queryParams);

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

      // Get analytics data
      const analytics = await analyticsService.getPostsAnalytics(filters);

      // Limit results if specified
      const limitedAnalytics = validatedParams.limit
        ? analytics.slice(0, validatedParams.limit)
        : analytics;

      return NextResponse.json({
        analytics: limitedAnalytics,
        total: analytics.length,
      });
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
    console.error('Error fetching Instagram analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRecord = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const userRecord = await prisma.user.findUnique({
      where: { email: user?.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = fetchAnalyticsSchema.parse(body);

    const analyticsService = new InstagramAnalyticsService();

    // Fetch analytics from Instagram API and store in database
    const analyticsData = await analyticsService.fetchPostAnalytics(
      validatedData.postId,
      validatedData.mediaId,
      validatedData.accessToken
    );

    // Check for engagement alerts
    await analyticsService.checkEngagementAlerts(validatedData.postId);

    return NextResponse.json(
      {
        success: true,
        analytics: analyticsData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error fetching post analytics:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch post analytics' },
      { status: 500 }
    );
  }
}
