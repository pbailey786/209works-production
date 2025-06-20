import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ChatbotService } from '@/lib/conversation/chatbot-service';
import { ConversationManager } from '@/lib/conversation/manager';
import { prisma } from '@/lib/database/prisma';


// POST /api/jobs/chatbot - Main chatbot endpoint
export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, userId } = await req.json();

    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: 'Message is required and cannot be empty',
        },
        { status: 400 }
      );
    }

    // Get user session if authenticated - NextAuth v5 requires request object
    const session = await auth() ;
    let authenticatedUserId = userId;

    if (user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: user?.email },
      });
      authenticatedUserId = user?.id || userId;
    }

    // Process the message through ChatbotService
    const response = await ChatbotService.processMessage(
      sessionId || 'new',
      message.trim(),
      authenticatedUserId
    );

    return NextResponse.json({
      success: true,
      ...response,
      sessionId:
        sessionId || ConversationManager.getSessionStats().activeSessions,
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      {
        error:
          'I encountered an error processing your request. Please try again.',
        success: false,
      },
      { status: 500 }
    );
  }
}

// GET /api/jobs/chatbot - Get session info or create new session
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    // Get user session if authenticated with Clerk
    const { userId: clerkUserId } = await auth();
    let userId;

    if (clerkUserId) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });
      userId = user?.id;
    }

    if (sessionId) {
      // Get existing session
      const conversationSession = ConversationManager.getSession(sessionId);

      if (conversationSession) {
        return NextResponse.json({
          success: true,
          sessionId: conversationSession.sessionId,
          isActive: conversationSession.isActive,
          messageCount: conversationSession.context.metadata.messageCount,
          intent: conversationSession.context.intent,
          startedAt: conversationSession.context.metadata.startedAt,
          lastActivity: conversationSession.context.metadata.lastActivity,
        });
      } else {
        return NextResponse.json(
          {
            error: 'Session not found or expired',
          },
          { status: 404 }
        );
      }
    } else {
      // Create new session
      const newSession = ConversationManager.createSession(userId);

      return NextResponse.json({
        success: true,
        sessionId: newSession.sessionId,
        isActive: newSession.isActive,
        messageCount: 0,
        intent: 'general_chat',
        welcomeMessage:
          "Hey. I'm Rust - I know the job scene around here. Lived in Tracy, worked everywhere from Stockton warehouses to Modesto ag companies. What kind of work you looking for?",
        suggestions: [
          "Show me warehouse jobs around here",
          "What's hiring in Tracy?",
          'Find me something in logistics',
        ],
      });
    }
  } catch (error) {
    console.error('Chatbot session error:', error);
    return NextResponse.json(
      { error: 'Unable to manage session' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/chatbot - End conversation session
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        {
          error: 'Session ID is required',
        },
        { status: 400 }
      );
    }

    // Delete the session
    ConversationManager.deleteSession(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Conversation session ended successfully',
    });
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Unable to end session' },
      { status: 500 }
    );
  }
}
