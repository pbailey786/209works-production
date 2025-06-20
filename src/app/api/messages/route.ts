import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

// Validation schemas
const getMessagesSchema = z.object({
  limit: z.string().transform(val => parseInt(val) || 20),
  offset: z.string().transform(val => parseInt(val) || 0),
  threadId: z.string().optional(),
  unreadOnly: z.string().transform(val => val === 'true').optional(),
  type: z.enum(['direct', 'application_inquiry', 'job_inquiry', 'system_message', 'support_ticket']).optional(),
});

const sendMessageSchema = z.object({
  receiverId: z.string().uuid(),
  subject: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5000),
  messageType: z.enum(['direct', 'application_inquiry', 'job_inquiry', 'system_message', 'support_ticket']).default('direct'),
  threadId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  attachments: z.record(z.any()).optional(),
});

// GET /api/messages - Get user's messages
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const { limit, offset, threadId, unreadOnly, type } = getMessagesSchema.parse({
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
      threadId: url.searchParams.get('threadId'),
      unreadOnly: url.searchParams.get('unreadOnly'),
      type: url.searchParams.get('type'),
    });

    // Build where condition
    const whereCondition: any = {
      OR: [
        { senderId: user.id },
        { receiverId: user.id },
      ],
      deletedAt: null,
    };

    if (threadId) {
      whereCondition.threadId = threadId;
    }

    if (unreadOnly) {
      whereCondition.isRead = false;
      whereCondition.receiverId = user.id; // Only unread messages received by user
    }

    if (type) {
      whereCondition.messageType = type;
    }

    // Get messages
    const [messages, totalCount, unreadCount] = await Promise.all([
      prisma.message.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePictureUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePictureUrl: true,
            },
          },
          parent: {
            select: {
              id: true,
              subject: true,
              content: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.message.count({
        where: whereCondition,
      }),
      prisma.message.count({
        where: {
          receiverId: user.id,
          isRead: false,
          deletedAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      messages,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a new message
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const messageData = sendMessageSchema.parse(body);

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: messageData.receiverId },
      select: { id: true, name: true },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Generate thread ID if not provided and not a reply
    let threadId = messageData.threadId;
    if (!threadId && !messageData.parentId) {
      threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else if (messageData.parentId) {
      // Get thread ID from parent message
      const parentMessage = await prisma.message.findUnique({
        where: { id: messageData.parentId },
        select: { threadId: true },
      });
      threadId = parentMessage?.threadId || threadId;
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: messageData.receiverId,
        subject: messageData.subject,
        content: messageData.content,
        messageType: messageData.messageType,
        threadId,
        parentId: messageData.parentId,
        attachments: messageData.attachments,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: messageData.receiverId,
        type: 'message_received',
        title: 'New Message',
        message: `You have a new message from ${user.name || 'a user'}`,
        data: {
          messageId: message.id,
          senderId: user.id,
          senderName: user.name,
          subject: messageData.subject,
          preview: messageData.content.substring(0, 100),
        },
        actionUrl: `/messages/${message.id}`,
        priority: 'normal',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
