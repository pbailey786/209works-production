

  ConversationContext,
  ConversationSession,
  Message,
  ConversationIntent,
  UserProfile,
} from './types';

// In-memory storage for conversation sessions (in production, use Redis or database)
const conversationSessions = new Map<string, ConversationSession>();

export class ConversationManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  /**
   * Create a new conversation session
   */
  static createSession(userId?: string): ConversationSession {
    const sessionId = this.generateSessionId();
    const now = new Date();

    const context: ConversationContext = {
      sessionId,
      userId,
      messages: [],
      intent: 'general_chat',
      context: {},
      metadata: {
        startedAt: now,
        lastActivity: now,
        messageCount: 0,
      },
    };

    const session: ConversationSession = {
      sessionId,
      userId,
      context,
      isActive: true,
      expiresAt: new Date(now.getTime() + this.SESSION_TIMEOUT),
    };

    conversationSessions.set(sessionId, session);
    return session;
  }

  /**
   * Get an existing conversation session
   */
  static getSession(sessionId: string): ConversationSession | null {
    const session = conversationSessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update conversation session with new message
   */
  static addMessage(
    sessionId: string,
    message: Omit<Message, 'id' | 'timestamp'>
  ): ConversationSession | null {
    const session = this.getSession(sessionId);

    if (!session) {
      return null;
    }

    const newMessage: Message = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date(),
    };

    // Add message to context
    session.context.messages.push(newMessage);
    session.context.metadata.lastActivity = new Date();
    session.context.metadata.messageCount++;

    // Extend session expiry
    session.expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT);

    // Limit message history to last 20 messages for performance
    if (session.context.messages.length > 20) {
      session.context.messages = session.context.messages.slice(-20);
    }

    conversationSessions.set(sessionId, session);
    return session;
  }

  /**
   * Update conversation intent based on user message
   */
  static updateIntent(sessionId: string, intent: ConversationIntent): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.context.intent = intent;
      conversationSessions.set(sessionId, session);
    }
  }

  /**
   * Update user profile in conversation context
   */
  static updateUserProfile(sessionId: string, profile: UserProfile): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.context.context.userProfile = {
        ...session.context.context.userProfile,
        ...profile,
      };
      conversationSessions.set(sessionId, session);
    }
  }

  /**
   * Add job context to conversation
   */
  static addJobContext(sessionId: string, jobContext: any): void {
    const session = this.getSession(sessionId);
    if (session) {
      const currentJobs = session.context.context.currentJobs || [];
      currentJobs.push(jobContext);
      session.context.context.currentJobs = currentJobs.slice(-5); // Keep last 5 jobs
      conversationSessions.set(sessionId, session);
    }
  }

  /**
   * Update last job search context
   */
  static updateSearchContext(
    sessionId: string,
    query: string,
    filters: Record<string, any>,
    resultCount: number
  ): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.context.context.lastJobSearch = {
        query,
        filters,
        results: resultCount,
        timestamp: new Date(),
      };
      session.context.context.searchQuery = query;
      conversationSessions.set(sessionId, session);
    }
  }

  /**
   * Delete conversation session
   */
  static deleteSession(sessionId: string): void {
    conversationSessions.delete(sessionId);
  }

  /**
   * Get conversation history for context
   */
  static getConversationHistory(sessionId: string): Message[] {
    const session = this.getSession(sessionId);
    return session?.context.messages || [];
  }

  /**
   * Clean up expired sessions
   * OPTIMIZATION: Made async for better performance and error handling
   */
  static async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];

    // Collect expired session IDs first - using Array.from for better TypeScript compatibility
    const sessionEntries = Array.from(conversationSessions.entries());
    for (const [sessionId, session] of sessionEntries) {
      if (now > session.expiresAt) {
        expiredSessions.push(sessionId);
      }
    }

    // Delete expired sessions
    for (const sessionId of expiredSessions) {
      conversationSessions.delete(sessionId);
    }

    // Log cleanup stats if any sessions were cleaned up
    if (expiredSessions.length > 0) {
      console.log(
        `Cleaned up ${expiredSessions.length} expired conversation sessions`
      );
    }
  }

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private static generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session statistics
   */
  static getSessionStats() {
    return {
      activeSessions: conversationSessions.size,
      totalSessions: conversationSessions.size,
    };
  }
}

// OPTIMIZATION: Improved async interval pattern to prevent overlapping cleanup operations
let cleanupInProgress = false;
let cleanupIntervalId: NodeJS.Timeout | null = null;

const asyncCleanupInterval = async () => {
  if (cleanupInProgress) {
    console.log('Cleanup already in progress, skipping this interval');
    return;
  }

  cleanupInProgress = true;
  try {
    await ConversationManager.cleanupExpiredSessions();
  } catch (error) {
    console.error('Error during conversation session cleanup:', error);
  } finally {
    cleanupInProgress = false;
  }
};

// Clean up expired sessions every 5 minutes with improved async handling
cleanupIntervalId = setInterval(asyncCleanupInterval, 5 * 60 * 1000);

// Cleanup function for graceful shutdown
export function stopConversationCleanup(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    console.log('Conversation cleanup interval stopped');
  }
}

// Process signal handlers for cleanup
if (typeof process !== 'undefined') {
  const gracefulShutdown = () => {
    console.log('Shutting down conversation manager...');
    stopConversationCleanup();
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  process.on('beforeExit', stopConversationCleanup);
}
