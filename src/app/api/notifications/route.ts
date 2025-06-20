import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

// Validation schemas
const getNotificationsSchema = z.object({
  limit: z.string().transform(val => parseInt(val) || 20),
  offset: z.string().transform(val => parseInt(val) || 0),
  unreadOnly: z.string().transform(val => val === 'true').optional(),
  type: z.enum(['job_match', 'application_update', 'message_received', 'system_announcement', 'credit_alert', 'payment_reminder', 'security_alert', 'feature_update', 'marketing']).optional(),
});

const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['job_match', 'application_update', 'message_received', 'system_announcement', 'credit_alert', 'payment_reminder', 'security_alert', 'feature_update', 'marketing']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  category: z.string().optional(),
  actionUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
});

// GET /api/notifications - Get user's notifications
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const { limit, offset, unreadOnly, type } = getNotificationsSchema.parse({
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      unreadOnly: url.searchParams.get('unreadOnly'),
      type: url.searchParams.get('type'),
    });

    // Build where condition
    const whereCondition: any = { 
      userId,
      expiresAt: {
        OR: [
          { gt: new Date() },
          { equals: null }
        ]
      }
    };
    
    if (unreadOnly) {
      whereCondition.isRead = false;
    }
    
    if (type) {
      whereCondition.type = type;
    }

    // Get notifications
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereCondition,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          data: true,
          isRead: true,
          priority: true,
          category: true,
          actionUrl: true,
          createdAt: true,
          readAt: true,
        },
      }),
      prisma.notification.count({
        where: whereCondition,
      }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
          expiresAt: {
            OR: [
              { gt: new Date() },
              { equals: null }
            ]
          }
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification (admin only)
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const notificationData = createNotificationSchema.parse(body);

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        ...notificationData,
        expiresAt: notificationData.expiresAt ? new Date(notificationData.expiresAt) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark all notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'mark_all_read') {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
