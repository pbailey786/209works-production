import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

const MAX_CONVERSATIONS_PER_USER = 10; // Limit to 10 conversations per user

// GET /api/chat-history - Get user's chat history
export async function GET(request: NextRequest) {
  try {
    const session = await auth() as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's chat history, ordered by last activity
    let chatHistory: any[] = [];
    try {
      chatHistory = await prisma.chatHistory.findMany({
        where: { userId: user.id },
        orderBy: { lastActivity: 'desc' },
        take: MAX_CONVERSATIONS_PER_USER,
      });
    } catch (error) {
      // If ChatHistory table doesn't exist yet, return empty array
      console.log('ChatHistory table not available yet:', error);
      chatHistory = [];
    }

    return NextResponse.json({
      conversations: chatHistory,
      total: chatHistory.length,
      maxAllowed: MAX_CONVERSATIONS_PER_USER,
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}

// POST /api/chat-history - Save a new conversation or update existing
export async function POST(request: NextRequest) {
  try {
    const session = await auth() as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { sessionId, messages, title } = body;

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'sessionId and messages array are required' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    let existingConversation = null;
    try {
      existingConversation = await prisma.chatHistory.findFirst({
        where: {
          userId: user.id,
          sessionId: sessionId,
        },
      });
    } catch (error) {
      // If ChatHistory table doesn't exist yet, treat as no existing conversation
      console.log('ChatHistory table not available yet for POST:', error);
      existingConversation = null;
    }

    if (existingConversation) {
      // Update existing conversation
      const updatedConversation = await prisma.chatHistory.update({
        where: { id: existingConversation.id },
        data: {
          messages: messages,
          title: title || existingConversation.title,
          lastActivity: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        conversation: updatedConversation,
      });
    } else {
      // Check if user has reached the limit
      const userConversationCount = await prisma.chatHistory.count({
        where: { userId: user.id },
      });

      if (userConversationCount >= MAX_CONVERSATIONS_PER_USER) {
        // Remove the oldest conversation
        const oldestConversation = await prisma.chatHistory.findFirst({
          where: { userId: user.id },
          orderBy: { lastActivity: 'asc' },
        });

        if (oldestConversation) {
          await prisma.chatHistory.delete({
            where: { id: oldestConversation.id },
          });
        }
      }

      // Create new conversation
      const newConversation = await prisma.chatHistory.create({
        data: {
          userId: user.id,
          sessionId: sessionId,
          messages: messages,
          title: title || generateConversationTitle(messages),
          lastActivity: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        conversation: newConversation,
      });
    }
  } catch (error) {
    console.error('Error saving chat history:', error);
    return NextResponse.json(
      { error: 'Failed to save chat history' },
      { status: 500 }
    );
  }
}

// DELETE /api/chat-history - Delete a conversation
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth() as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Verify the conversation belongs to the user
    const conversation = await prisma.chatHistory.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Delete the conversation
    await prisma.chatHistory.delete({
      where: { id: conversationId },
    });

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}

// Helper function to generate a conversation title from messages
function generateConversationTitle(messages: any[]): string {
  if (!messages || messages.length === 0) {
    return 'New Conversation';
  }

  // Find the first user message
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  
  if (firstUserMessage && firstUserMessage.content) {
    // Take first 50 characters and add ellipsis if longer
    const title = firstUserMessage.content.trim();
    return title.length > 50 ? title.substring(0, 50) + '...' : title;
  }

  return 'New Conversation';
}
