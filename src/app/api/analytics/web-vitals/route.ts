import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMetrics } from '@/lib/validations/api';
import { prisma } from '@/lib/database/prisma';

// In-memory storage for demo (replace with database in production)
const metricsStore: PerformanceMetrics[] = [];

export async function POST(request: NextRequest) {
  try {
    const metric: PerformanceMetrics = await request.json();

    // Validate the metric data
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Add timestamp and user agent
    const enhancedMetric = {
      ...metric,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      url: request.headers.get('referer') || 'unknown',
    };

    // Store the metric (replace with database storage)
    metricsStore.push(enhancedMetric);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', enhancedMetric);
    }

    // TODO: In production, store in database
    // await prisma.webVitalsMetric.create({
    //   data: enhancedMetric
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing web vitals metric:', error);
    return NextResponse.json(
      { error: 'Failed to store metric' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const metricName = url.searchParams.get('metric');

    let filteredMetrics = metricsStore;

    if (metricName) {
      filteredMetrics = metricsStore.filter(m => m.name === metricName);
    }

    const recentMetrics = filteredMetrics
      .slice(-limit)
      .sort(
        (a, b) =>
          new Date((a as any).timestamp || 0).getTime() -
          new Date((b as any).timestamp || 0).getTime()
      );

    return NextResponse.json({
      metrics: recentMetrics,
      total: filteredMetrics.length,
    });
  } catch (error) {
    console.error('Error retrieving web vitals metrics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    );
  }
}
