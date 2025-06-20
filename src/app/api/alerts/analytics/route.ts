import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';

const prisma = new PrismaClient();

const analyticsQuerySchema = z.object({
  days: z.string().optional().default('30'),
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
    const { days } = analyticsQuerySchema.parse({
      days: searchParams.get('days'),
    });

    const daysNumber = parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNumber);

    // Get user's alerts
    const userAlerts = await prisma.alert.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    // Calculate email metrics
    const totalAlerts = userAlerts.length;
    const activeAlerts = userAlerts.filter(alert => alert.isActive).length;

    // Mock email metrics (in a real app, this would come from your email service)
    const emailMetrics = {
      totalSent: userAlerts.reduce(
        (sum, alert) => sum + alert.totalJobsSent,
        0
      ),
      delivered: Math.floor(
        userAlerts.reduce((sum, alert) => sum + alert.totalJobsSent, 0) * 0.96
      ),
      opened: Math.floor(
        userAlerts.reduce((sum, alert) => sum + alert.totalJobsSent, 0) * 0.58
      ),
      clicked: Math.floor(
        userAlerts.reduce((sum, alert) => sum + alert.totalJobsSent, 0) * 0.22
      ),
      bounced: Math.floor(
        userAlerts.reduce((sum, alert) => sum + alert.totalJobsSent, 0) * 0.04
      ),
      complaints: Math.floor(
        userAlerts.reduce((sum, alert) => sum + alert.totalJobsSent, 0) * 0.001
      ),
      unsubscribed: Math.floor(
        userAlerts.reduce((sum, alert) => sum + alert.totalJobsSent, 0) * 0.002
      ),
      deliveryRate: 96.0,
      openRate: 58.0,
      clickRate: 22.0,
      bounceRate: 4.0,
    };

    // Calculate alert performance
    const alertPerformance = userAlerts.map(alert => ({
      alertId: alert.id,
      alertName: alert.jobTitle || `${alert.type} Alert`,
      totalSent: alert.totalJobsSent,
      averageMatches: Math.floor(Math.random() * 20) + 5, // Mock data
      userEngagement: Math.floor(Math.random() * 30) + 70, // Mock engagement score
      successfulPlacements: Math.floor(alert.totalJobsSent * 0.05), // Mock placements
      isActive: alert.isActive,
      lastTriggered:
        alert.lastTriggered?.toISOString() || alert.createdAt.toISOString(),
    }));

    // Generate time series data for the past period
    const timeSeriesData = Array.from({ length: daysNumber }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (daysNumber - 1 - i));

      const baseSent = Math.floor(Math.random() * 100) + 50;
      return {
        date: date.toISOString().split('T')[0],
        sent: baseSent,
        delivered: Math.floor(baseSent * 0.96),
        opened: Math.floor(baseSent * 0.58),
        clicked: Math.floor(baseSent * 0.22),
      };
    });

    // Mock user engagement data
    const userEngagement = [
      {
        userId: user.id,
        email: user?.email,
        alertsCount: totalAlerts,
        emailsReceived: emailMetrics.totalSent,
        engagementScore: Math.floor(Math.random() * 30) + 70,
        lastActive: new Date().toISOString(),
        status: 'active' as const,
      },
    ];

    // Top performing alerts
    const topAlerts = alertPerformance
      .sort((a, b) => b.userEngagement - a.userEngagement)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      emailMetrics,
      alertPerformance,
      timeSeriesData,
      userEngagement,
      topAlerts,
      summary: {
        totalAlerts,
        activeAlerts,
        dateRange: `${daysNumber} days`,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
