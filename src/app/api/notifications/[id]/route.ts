import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

// GET /api/notifications/[id] - Get a specific notification
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/[id] - Mark notification as read/unread
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { isRead } = body;

    // Check if the notification exists and belongs to the user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update the notification
    const updatedNotification = await prisma.notification.update({
      where: { id: params.id },
      data: {
        isRead: isRead ?? true,
        readAt: isRead !== false ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully',
      notification: updatedNotification,
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the notification exists and belongs to the user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Delete the notification
    await prisma.notification.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
