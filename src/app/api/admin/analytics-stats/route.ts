import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('dateFilter') || '7d';

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

    // Fetch comprehensive analytics stats
    const [
      totalChatSessions,
      totalQuestions,
      avgResponseTime,
      totalJobsFound,
      uniqueUsers,
      topQuestions,
      dailyStats,
      userEngagement,
    ] = await Promise.all([
      // Total chat sessions (using ChatAnalytics as proxy)
      prisma.chatAnalytics.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Total questions asked
      prisma.chatAnalytics.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Average response time
      prisma.chatAnalytics.aggregate({
        where: {
          createdAt: { gte: startDate },
          responseTime: { gt: 0 },
        },
        _avg: { responseTime: true },
      }),

      // Total jobs found through chat
      prisma.chatAnalytics.aggregate({
        where: {
          createdAt: { gte: startDate },
          jobsFound: { gt: 0 },
        },
        _sum: { jobsFound: true },
      }),

      // Unique users who used chat
      prisma.chatAnalytics.findMany({
        where: { createdAt: { gte: startDate } },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Top questions/search terms
      prisma.chatAnalytics.groupBy({
        by: ['question'],
        where: {
          createdAt: { gte: startDate },
          question: { not: '' },
        },
        _count: { question: true },
        orderBy: { _count: { question: 'desc' } },
        take: 10,
      }),

      // Daily stats for the period
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as questions,
          COUNT(DISTINCT userId) as unique_users,
          AVG(responseTime) as avg_response_time,
          SUM(jobsFound) as jobs_found
        FROM ChatAnalytics 
        WHERE createdAt >= ${startDate}
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
        LIMIT 30
      `,

      // User engagement metrics
      prisma.chatAnalytics.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startDate } },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    // Calculate additional metrics
    const avgQuestionsPerUser = uniqueUsers.length > 0 
      ? totalQuestions / uniqueUsers.length 
      : 0;

    const avgJobsPerQuestion = totalQuestions > 0 
      ? (totalJobsFound._sum?.jobsFound || 0) / totalQuestions 
      : 0;

    // Format response
    const stats = {
      overview: {
        totalChatSessions,
        totalQuestions,
        avgResponseTime: avgResponseTime._avg?.responseTime || 0,
        totalJobsFound: totalJobsFound._sum?.jobsFound || 0,
        uniqueUsers: uniqueUsers.length,
        avgQuestionsPerUser: Math.round(avgQuestionsPerUser * 100) / 100,
        avgJobsPerQuestion: Math.round(avgJobsPerQuestion * 100) / 100,
      },
      topQuestions: topQuestions.map(q => ({
        question: q.question,
        count: q._count.question,
      })),
      dailyStats,
      userEngagement: userEngagement.map(u => ({
        userId: u.userId,
        questionCount: u._count.userId,
      })),
      period: {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        filter: dateFilter,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics stats' },
      { status: 500 }
    );
  }
}
