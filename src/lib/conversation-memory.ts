import { prisma } from '@/lib/database/prisma';

export interface UserPreferences {
  preferredLocation?: string;
  preferredJobTypes?: string[];
  preferredIndustries?: string[];
  salaryRange?: {
    min?: number;
    max?: number;
  };
  experienceLevel?: string;
  skills?: string[];
  remotePreference?: 'remote' | 'onsite' | 'hybrid' | 'any';
  searchHistory?: string[];
  commonQuestions?: string[];
}

export interface ConversationContext {
  userId?: string;
  sessionId: string;
  preferences: UserPreferences;
  recentSearches: string[];
  jobInteractions: {
    viewed: string[];
    applied: string[];
    saved: string[];
    rejected: string[];
  };
  conversationSummary?: string;
  lastActive: Date;
}

export class ConversationMemory {
  private static instance: ConversationMemory;
  private memoryCache = new Map<string, ConversationContext>();

  static getInstance(): ConversationMemory {
    if (!ConversationMemory.instance) {
      ConversationMemory.instance = new ConversationMemory();
    }
    return ConversationMemory.instance;
  }

  // Load conversation context from database and cache
  async loadContext(sessionId: string, userId?: string): Promise<ConversationContext> {
    // Check cache first
    const cached = this.memoryCache.get(sessionId);
    if (cached && cached.lastActive > new Date(Date.now() - 30 * 60 * 1000)) { // 30 min cache
      return cached;
    }

    try {
      // Load from database
      const conversation = await prisma.conversation.findUnique({
        where: { sessionId },
        include: {
          user: {
            select: {
              id: true,
              preferences: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      let context: ConversationContext;

      if (conversation) {
        // Parse existing conversation
        const preferences = conversation.user?.preferences as UserPreferences || {};
        const metadata = conversation.metadata as any || {};

        context = {
          userId: conversation.userId || undefined,
          sessionId,
          preferences,
          recentSearches: metadata.recentSearches || [],
          jobInteractions: metadata.jobInteractions || {
            viewed: [],
            applied: [],
            saved: [],
            rejected: [],
          },
          conversationSummary: metadata.summary,
          lastActive: new Date(),
        };
      } else {
        // Create new context
        context = {
          userId,
          sessionId,
          preferences: {},
          recentSearches: [],
          jobInteractions: {
            viewed: [],
            applied: [],
            saved: [],
            rejected: [],
          },
          lastActive: new Date(),
        };
      }

      // Cache the context
      this.memoryCache.set(sessionId, context);
      return context;
    } catch (error) {
      console.error('Error loading conversation context:', error);
      
      // Return default context on error
      return {
        userId,
        sessionId,
        preferences: {},
        recentSearches: [],
        jobInteractions: {
          viewed: [],
          applied: [],
          saved: [],
          rejected: [],
        },
        lastActive: new Date(),
      };
    }
  }

  // Update conversation context
  async updateContext(sessionId: string, updates: Partial<ConversationContext>): Promise<void> {
    try {
      const current = this.memoryCache.get(sessionId);
      if (!current) {
        console.warn('Attempting to update non-existent context:', sessionId);
        return;
      }

      // Merge updates
      const updated = {
        ...current,
        ...updates,
        preferences: {
          ...current.preferences,
          ...updates.preferences,
        },
        jobInteractions: {
          ...current.jobInteractions,
          ...updates.jobInteractions,
        },
        lastActive: new Date(),
      };

      // Update cache
      this.memoryCache.set(sessionId, updated);

      // Persist to database (async, don't wait)
      this.persistContext(updated).catch(error => {
        console.error('Error persisting context:', error);
      });
    } catch (error) {
      console.error('Error updating conversation context:', error);
    }
  }

  // Extract preferences from user message
  extractPreferencesFromMessage(message: string, currentPreferences: UserPreferences): Partial<UserPreferences> {
    const updates: Partial<UserPreferences> = {};
    const lowerMessage = message.toLowerCase();

    // Location preferences
    const locations = ['stockton', 'modesto', 'tracy', 'manteca', 'lodi', 'turlock', 'merced'];
    for (const location of locations) {
      if (lowerMessage.includes(location)) {
        updates.preferredLocation = location.charAt(0).toUpperCase() + location.slice(1);
        break;
      }
    }

    // Job type preferences
    if (lowerMessage.includes('remote')) {
      updates.remotePreference = 'remote';
    } else if (lowerMessage.includes('onsite') || lowerMessage.includes('in-person')) {
      updates.remotePreference = 'onsite';
    } else if (lowerMessage.includes('hybrid')) {
      updates.remotePreference = 'hybrid';
    }

    // Job types
    const jobTypes = ['full-time', 'part-time', 'contract', 'internship', 'temporary'];
    for (const type of jobTypes) {
      if (lowerMessage.includes(type.replace('-', ' ')) || lowerMessage.includes(type)) {
        updates.preferredJobTypes = [...(currentPreferences.preferredJobTypes || []), type];
        break;
      }
    }

    // Industries
    const industries = ['healthcare', 'technology', 'warehouse', 'retail', 'manufacturing', 'education', 'finance'];
    for (const industry of industries) {
      if (lowerMessage.includes(industry)) {
        updates.preferredIndustries = [...(currentPreferences.preferredIndustries || []), industry];
        break;
      }
    }

    // Salary mentions
    const salaryMatch = lowerMessage.match(/\$?(\d+(?:,\d{3})*(?:k|000)?)/g);
    if (salaryMatch) {
      const amounts = salaryMatch.map(s => {
        const num = parseInt(s.replace(/[$,k]/g, ''));
        return s.includes('k') ? num * 1000 : num;
      });
      
      if (amounts.length === 1) {
        updates.salaryRange = { min: amounts[0] };
      } else if (amounts.length >= 2) {
        updates.salaryRange = { min: Math.min(...amounts), max: Math.max(...amounts) };
      }
    }

    return updates;
  }

  // Add search to history
  async addSearchToHistory(sessionId: string, searchQuery: string): Promise<void> {
    try {
      const context = this.memoryCache.get(sessionId);
      if (!context) return;

      const recentSearches = [
        searchQuery,
        ...context.recentSearches.filter(s => s !== searchQuery)
      ].slice(0, 10); // Keep last 10 searches

      await this.updateContext(sessionId, { recentSearches });
    } catch (error) {
      console.error('Error adding search to history:', error);
    }
  }

  // Track job interaction
  async trackJobInteraction(
    sessionId: string, 
    jobId: string, 
    action: 'viewed' | 'applied' | 'saved' | 'rejected'
  ): Promise<void> {
    try {
      const context = this.memoryCache.get(sessionId);
      if (!context) return;

      const interactions = { ...context.jobInteractions };
      
      // Remove from other arrays if exists
      Object.keys(interactions).forEach(key => {
        interactions[key as keyof typeof interactions] = 
          interactions[key as keyof typeof interactions].filter(id => id !== jobId);
      });

      // Add to appropriate array
      interactions[action] = [...interactions[action], jobId].slice(-50); // Keep last 50

      await this.updateContext(sessionId, { jobInteractions: interactions });
    } catch (error) {
      console.error('Error tracking job interaction:', error);
    }
  }

  // Get conversation summary for AI context
  getContextSummary(context: ConversationContext): string {
    const { preferences, recentSearches, jobInteractions } = context;
    
    let summary = "User context:\n";
    
    if (preferences.preferredLocation) {
      summary += `- Prefers jobs in ${preferences.preferredLocation}\n`;
    }
    
    if (preferences.preferredJobTypes?.length) {
      summary += `- Interested in: ${preferences.preferredJobTypes.join(', ')}\n`;
    }
    
    if (preferences.preferredIndustries?.length) {
      summary += `- Industries: ${preferences.preferredIndustries.join(', ')}\n`;
    }
    
    if (preferences.salaryRange) {
      const { min, max } = preferences.salaryRange;
      if (min && max) {
        summary += `- Salary range: $${min.toLocaleString()} - $${max.toLocaleString()}\n`;
      } else if (min) {
        summary += `- Minimum salary: $${min.toLocaleString()}\n`;
      }
    }
    
    if (preferences.remotePreference && preferences.remotePreference !== 'any') {
      summary += `- Work preference: ${preferences.remotePreference}\n`;
    }
    
    if (recentSearches.length) {
      summary += `- Recent searches: ${recentSearches.slice(0, 3).join(', ')}\n`;
    }
    
    if (jobInteractions.applied.length) {
      summary += `- Applied to ${jobInteractions.applied.length} jobs\n`;
    }
    
    if (jobInteractions.saved.length) {
      summary += `- Saved ${jobInteractions.saved.length} jobs\n`;
    }

    return summary;
  }

  // Persist context to database
  private async persistContext(context: ConversationContext): Promise<void> {
    try {
      const metadata = {
        recentSearches: context.recentSearches,
        jobInteractions: context.jobInteractions,
        summary: context.conversationSummary,
      };

      await prisma.conversation.upsert({
        where: { sessionId: context.sessionId },
        update: {
          metadata,
          updatedAt: new Date(),
        },
        create: {
          sessionId: context.sessionId,
          userId: context.userId,
          metadata,
        },
      });

      // Update user preferences if user is logged in
      if (context.userId && Object.keys(context.preferences).length > 0) {
        await prisma.user.update({
          where: { id: context.userId },
          data: {
            preferences: context.preferences,
          },
        });
      }
    } catch (error) {
      console.error('Error persisting conversation context:', error);
    }
  }

  // Clean up old cache entries
  cleanupCache(): void {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
    for (const [sessionId, context] of this.memoryCache.entries()) {
      if (context.lastActive < cutoff) {
        this.memoryCache.delete(sessionId);
      }
    }
  }
}

// Export singleton instance
export const conversationMemory = ConversationMemory.getInstance();

// Cleanup cache every 30 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    conversationMemory.cleanupCache();
  }, 30 * 60 * 1000);
}
