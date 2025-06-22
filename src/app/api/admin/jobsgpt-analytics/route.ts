import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../auth/authOptions';
import { prisma } from '../../auth/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

    // Check if user is admin
    if (
      !session?.user ||
      (session.user.role !== 'admin' &&
        session.user?.email !== 'admin@209jobs.com')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const dateFilter = searchParams.get('dateFilter') || '7d';
    const search = searchParams.get('search') || '';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (dateFilter) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: startDate,
      },
    };

    if (search) {
      whereClause.question = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.chatAnalytics.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Fetch analytics data
    const analytics = await prisma.chatAnalytics.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Format the response
    const formattedAnalytics = analytics.map(item => ({
      id: item.id,
      userId: item.userId,
      userEmail: item.user?.email || 'Unknown',
      question: item.question,
      response: item.response,
      timestamp: item.createdAt.toISOString(),
      sessionId: item.sessionId,
      jobsFound: item.jobsFound || 0,
      responseTime: item.responseTime || 0,
    }));

    return NextResponse.json({
      analytics: formattedAnalytics,
      totalPages,
      currentPage: page,
      totalCount,
    });
  } catch (error) {
    console.error('Error fetching JobsGPT analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
