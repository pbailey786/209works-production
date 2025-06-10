import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    // Check if user is admin
    if (
      !session?.user ||
      (session.user.role !== 'admin' &&
        session.user?.email !== 'admin@209jobs.com')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('dateFilter') || '7d';

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    let todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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

    // Get basic stats
    const [
      totalQuestions,
      uniqueUsers,
      questionsToday,
      questionsThisWeek,
      avgResponseTimeResult,
      topQuestionsResult,
    ] = await Promise.all([
      // Total questions in date range
      prisma.chatAnalytics.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),

      // Unique users in date range
      prisma.chatAnalytics
        .findMany({
          where: {
            createdAt: { gte: startDate },
          },
          select: {
            userId: true,
          },
          distinct: ['userId'],
        })
        .then(users => users.length),

      // Questions today
      prisma.chatAnalytics.count({
        where: {
          createdAt: { gte: todayStart },
        },
      }),

      // Questions this week
      prisma.chatAnalytics.count({
        where: {
          createdAt: { gte: weekStart },
        },
      }),

      // Average response time
      prisma.chatAnalytics.aggregate({
        where: {
          createdAt: { gte: startDate },
          responseTime: { not: null },
        },
        _avg: {
          responseTime: true,
        },
      }),

      // Top questions (group by similar questions)
      prisma.chatAnalytics.groupBy({
        by: ['question'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: {
          question: true,
        },
        orderBy: {
          _count: {
            question: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    const avgResponseTime = avgResponseTimeResult._avg.responseTime || 0;

    const topQuestions = topQuestionsResult.map(item => ({
      question: item.question,
      count: item._count.question,
    }));

    return NextResponse.json({
      totalQuestions,
      uniqueUsers,
      avgResponseTime,
      topQuestions,
      questionsToday,
      questionsThisWeek,
    });
  } catch (error) {
    console.error('Error fetching JobsGPT stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
