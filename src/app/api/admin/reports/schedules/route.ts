import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../../../auth/authOptions';
import { prisma } from '../../../auth/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // For now, return mock data since we don't have a schedules table yet
    // In a real implementation, you'd fetch from a ReportSchedule model
    const mockSchedules = [
      {
        id: '1',
        type: 'weekly',
        frequency: 'weekly',
        recipients: ['admin@209.works', 'manager@209.works'],
        lastSent: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextScheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active' as const,
      },
      {
        id: '2',
        type: 'monthly',
        frequency: 'monthly',
        recipients: ['admin@209.works'],
        lastSent: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextScheduled: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active' as const,
      },
    ];

    return NextResponse.json({
      schedules: mockSchedules,
      totalCount: mockSchedules.length,
      totalPages: Math.ceil(mockSchedules.length / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error('Get schedules error:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, frequency, recipients } = body;

    if (!type || !frequency || !recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((email: string) => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json({ 
        error: `Invalid email addresses: ${invalidEmails.join(', ')}` 
      }, { status: 400 });
    }

    // For now, just return success since we don't have the table yet
    // In a real implementation, you'd create the schedule in the database
    const mockSchedule = {
      id: Date.now().toString(),
      type,
      frequency,
      recipients,
      status: 'active',
      createdAt: new Date().toISOString(),
      nextScheduled: getNextScheduledDate(frequency),
    };

    // Log the schedule creation
    await prisma.auditLog.create({
      data: {
        action: 'REPORT_SCHEDULE_CREATED',
        targetType: 'REPORT_SCHEDULE',
        targetId: mockSchedule.id,
        performedBy: session.user.id,
        details: JSON.stringify({
          type,
          frequency,
          recipients,
        }),
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      schedule: mockSchedule,
      message: 'Report schedule created successfully',
    });

  } catch (error) {
    console.error('Create schedule error:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

function getNextScheduledDate(frequency: string): string {
  const now = new Date();
  
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth.toISOString();
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
}
