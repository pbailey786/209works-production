import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database to check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // Check if user is admin
    if (
      !user ||
      (user.role !== 'admin' && user.email !== 'admin@209jobs.com')
    ) {
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

    // Fetch all analytics data for export
    const analytics = await prisma.chatAnalytics.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
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
    });

    // Convert to CSV format
    const csvHeaders = [
      'Timestamp',
      'User Email',
      'User Name',
      'Session ID',
      'Question',
      'Response',
      'Jobs Found',
      'Response Time (seconds)',
      'Metadata',
    ];

    const csvRows = analytics.map(item => [
      item.createdAt.toISOString(),
      item.user?.email || 'Unknown',
      item.user?.name || 'Unknown',
      item.sessionId,
      `"${item.question.replace(/"/g, '""')}"`, // Escape quotes in CSV
      `"${item.response.replace(/"/g, '""')}"`, // Escape quotes in CSV
      item.jobsFound || 0,
      item.responseTime || 0,
      `"${JSON.stringify(item.metadata || {}).replace(/"/g, '""')}"`, // Escape quotes in JSON
    ]);

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(',')),
    ].join('\n');

    // Create response with CSV content
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="jobsgpt-analytics-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error exporting JobsGPT analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}
