import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import InstagramAnalyticsService from '@/lib/services/instagram-analytics';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

const accountMetricsQuerySchema = z.object({
  accountId: z.string(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const fetchAccountMetricsSchema = z.object({
  accountId: z.string(),
  accessToken: z.string(),
  date: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;
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
      const validatedParams = accountMetricsQuerySchema.parse(queryParams);

      const analyticsService = new InstagramAnalyticsService();

      const startDate = validatedParams.startDate
        ? new Date(validatedParams.startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago

      const endDate = validatedParams.endDate
        ? new Date(validatedParams.endDate)
        : new Date(); // Default to today

      // Get account metrics history
      const metrics = await analyticsService.getAccountMetricsHistory(
        validatedParams.accountId,
        startDate,
        endDate
      );

      return NextResponse.json({
        metrics,
        accountId: validatedParams.accountId,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
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
    console.error('Error fetching Instagram account metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = fetchAccountMetricsSchema.parse(body);

    const analyticsService = new InstagramAnalyticsService();

    const date = validatedData.date ? new Date(validatedData.date) : new Date();

    // Fetch account metrics from Instagram API and store in database
    const metricsData = await analyticsService.fetchAccountMetrics(
      validatedData.accountId,
      validatedData.accessToken,
      date
    );

    return NextResponse.json(
      {
        success: true,
        metrics: metricsData,
        date: date.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error fetching account metrics:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch account metrics' },
      { status: 500 }
    );
  }
}
