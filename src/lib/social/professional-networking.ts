/**
 * Professional Networking System
 * LinkedIn-style networking features for job seekers and employers
 */

import { prisma } from '@/lib/database/prisma';
import { processWithAI } from '@/lib/ai';
import { EnhancedCacheManager, CACHE_DURATIONS, CACHE_TAGS } from '@/lib/performance/enhanced-cache-manager';

export interface NetworkConnection {
  id: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  requester: {
    id: string;
    name: string;
    profilePictureUrl?: string;
    currentJobTitle?: string;
    company?: string;
    location?: string;
  };
  recipient: {
    id: string;
    name: string;
    profilePictureUrl?: string;
    currentJobTitle?: string;
    company?: string;
    location?: string;
  };
}

export interface NetworkSuggestion {
  user: {
    id: string;
    name: string;
    profilePictureUrl?: string;
    currentJobTitle?: string;
    company?: string;
    location?: string;
    mutualConnections: number;
  };
  reason: string;
  score: number; // 0-1
  commonInterests: string[];
  mutualConnectionNames: string[];
}

export interface NetworkAnalytics {
  totalConnections: number;
  connectionGrowth: number; // percentage change from last month
  networkReach: number; // 2nd degree connections
  industryBreakdown: { industry: string; count: number; percentage: number }[];
  locationBreakdown: { location: string; count: number; percentage: number }[];
  topConnectors: { userId: string; name: string; connectionCount: number }[];
  networkStrength: number; // 0-100
  recommendations: string[];
}

export interface ProfessionalPost {
  id: string;
  authorId: string;
  content: string;
  type: 'text' | 'job_share' | 'achievement' | 'article' | 'poll';
  attachments?: {
    type: 'image' | 'document' | 'link';
    url: string;
    title?: string;
    description?: string;
  }[];
  visibility: 'public' | 'connections' | 'private';
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ProfessionalNetworkingService {
  private static cache = new EnhancedCacheManager();

  /**
   * Send connection request
   */
  static async sendConnectionRequest(
    requesterId: string,
    recipientId: string,
    message?: string
  ): Promise<NetworkConnection> {
    // Validate users exist and are not the same
    if (requesterId === recipientId) {
      throw new Error('Cannot connect to yourself');
    }

    // Check if connection already exists
    const existingConnection = await prisma.networkConnection.findFirst({
      where: {
        OR: [
          { requesterId, recipientId },
          { requesterId: recipientId, recipientId: requesterId },
        ],
      },
    });

    if (existingConnection) {
      throw new Error('Connection already exists or is pending');
    }

    // Check daily connection request limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRequests = await prisma.networkConnection.count({
      where: {
        requesterId,
        createdAt: { gte: today },
      },
    });

    if (todayRequests >= 50) { // LinkedIn-style limit
      throw new Error('Daily connection request limit reached');
    }

    // Create connection request
    const connection = await prisma.networkConnection.create({
      data: {
        requesterId,
        recipientId,
        message,
        status: 'pending',
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
            currentJobTitle: true,
            company: true,
            location: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
            currentJobTitle: true,
            company: true,
            location: true,
          },
        },
      },
    });

    // Send notification to recipient
    await this.sendConnectionNotification(connection);

    // Clear cache
    await this.cache.invalidateByTags([
      `network:${requesterId}`,
      `network:${recipientId}`,
    ]);

    return connection as NetworkConnection;
  }

  /**
   * Respond to connection request
   */
  static async respondToConnectionRequest(
    connectionId: string,
    userId: string,
    response: 'accept' | 'decline'
  ): Promise<NetworkConnection> {
    const connection = await prisma.networkConnection.findUnique({
      where: { id: connectionId },
      include: {
        requester: true,
        recipient: true,
      },
    });

    if (!connection) {
      throw new Error('Connection request not found');
    }

    if (connection.recipientId !== userId) {
      throw new Error('Not authorized to respond to this request');
    }

    if (connection.status !== 'pending') {
      throw new Error('Connection request already processed');
    }

    // Update connection status
    const updatedConnection = await prisma.networkConnection.update({
      where: { id: connectionId },
      data: {
        status: response === 'accept' ? 'accepted' : 'declined',
        updatedAt: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
            currentJobTitle: true,
            company: true,
            location: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
            currentJobTitle: true,
            company: true,
            location: true,
          },
        },
      },
    });

    // Send notification to requester
    await this.sendConnectionResponseNotification(updatedConnection, response);

    // Clear cache
    await this.cache.invalidateByTags([
      `network:${connection.requesterId}`,
      `network:${connection.recipientId}`,
    ]);

    return updatedConnection as NetworkConnection;
  }

  /**
   * Get user's network connections
   */
  static async getUserConnections(
    userId: string,
    options: {
      status?: 'pending' | 'accepted';
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { status = 'accepted', search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { requesterId: userId, status },
        { recipientId: userId, status },
      ],
    };

    // Add search filter
    if (search) {
      where.OR = where.OR.map((condition: any) => ({
        ...condition,
        OR: [
          {
            requester: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
          {
            recipient: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        ],
      }));
    }

    const [connections, totalCount] = await Promise.all([
      prisma.networkConnection.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true,
              currentJobTitle: true,
              company: true,
              location: true,
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true,
              currentJobTitle: true,
              company: true,
              location: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.networkConnection.count({ where }),
    ]);

    return {
      connections: connections.map(conn => ({
        ...conn,
        // Return the other user's info
        otherUser: conn.requesterId === userId ? conn.recipient : conn.requester,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get network suggestions for a user
   */
  static async getNetworkSuggestions(
    userId: string,
    limit: number = 10
  ): Promise<NetworkSuggestion[]> {
    return this.cache.getOrSet(
      `network-suggestions:${userId}`,
      async () => {
        // Get user's current connections
        const userConnections = await this.getUserConnectionIds(userId);
        
        // Get user profile for matching
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            jobSeekerProfile: true,
          },
        });

        if (!user) return [];

        // Find potential connections based on various factors
        const suggestions = await this.findPotentialConnections(user, userConnections, limit * 3);
        
        // Score and rank suggestions
        const scoredSuggestions = await Promise.all(
          suggestions.map(async (suggestion) => {
            const score = await this.calculateConnectionScore(user, suggestion);
            const mutualConnections = await this.getMutualConnectionCount(userId, suggestion.id);
            const mutualConnectionNames = await this.getMutualConnectionNames(userId, suggestion.id, 3);
            const commonInterests = await this.getCommonInterests(user, suggestion);
            
            return {
              user: {
                ...suggestion,
                mutualConnections,
              },
              reason: this.generateConnectionReason(score, mutualConnections, commonInterests),
              score: score.total,
              commonInterests,
              mutualConnectionNames,
            };
          })
        );

        return scoredSuggestions
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      },
      {
        ttl: CACHE_DURATIONS.MEDIUM,
        tags: [`network-suggestions:${userId}`, CACHE_TAGS.RECOMMENDATIONS],
      }
    );
  }

  /**
   * Get network analytics for a user
   */
  static async getNetworkAnalytics(userId: string): Promise<NetworkAnalytics> {
    return this.cache.getOrSet(
      `network-analytics:${userId}`,
      async () => {
        const connections = await this.getUserConnectionIds(userId);
        const totalConnections = connections.length;

        // Calculate growth (simplified - would need historical data)
        const connectionGrowth = 0; // Placeholder

        // Calculate network reach (2nd degree connections)
        const networkReach = await this.calculateNetworkReach(userId, connections);

        // Get connection details for analysis
        const connectionDetails = await prisma.user.findMany({
          where: { id: { in: connections } },
          select: {
            id: true,
            name: true,
            industry: true,
            location: true,
            _count: {
              select: {
                sentConnections: {
                  where: { status: 'accepted' },
                },
                receivedConnections: {
                  where: { status: 'accepted' },
                },
              },
            },
          },
        });

        // Analyze industry breakdown
        const industryBreakdown = this.analyzeIndustryBreakdown(connectionDetails);
        
        // Analyze location breakdown
        const locationBreakdown = this.analyzeLocationBreakdown(connectionDetails);
        
        // Find top connectors
        const topConnectors = this.findTopConnectors(connectionDetails);
        
        // Calculate network strength
        const networkStrength = this.calculateNetworkStrength(totalConnections, networkReach, industryBreakdown);
        
        // Generate recommendations
        const recommendations = this.generateNetworkRecommendations(
          totalConnections,
          networkStrength,
          industryBreakdown
        );

        return {
          totalConnections,
          connectionGrowth,
          networkReach,
          industryBreakdown,
          locationBreakdown,
          topConnectors,
          networkStrength,
          recommendations,
        };
      },
      {
        ttl: CACHE_DURATIONS.LONG,
        tags: [`network-analytics:${userId}`, CACHE_TAGS.ANALYTICS],
      }
    );
  }

  // Private helper methods

  private static async sendConnectionNotification(connection: any): Promise<void> {
    // Implementation for sending connection request notification
    // This would integrate with the notification system
  }

  private static async sendConnectionResponseNotification(
    connection: any,
    response: 'accept' | 'decline'
  ): Promise<void> {
    // Implementation for sending connection response notification
  }

  private static async getUserConnectionIds(userId: string): Promise<string[]> {
    const connections = await prisma.networkConnection.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'accepted' },
          { recipientId: userId, status: 'accepted' },
        ],
      },
      select: {
        requesterId: true,
        recipientId: true,
      },
    });

    return connections.map(conn => 
      conn.requesterId === userId ? conn.recipientId : conn.requesterId
    );
  }

  private static async findPotentialConnections(
    user: any,
    existingConnections: string[],
    limit: number
  ) {
    const excludeIds = [...existingConnections, user.id];

    return await prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
        // Add filters based on user profile
        ...(user.location && {
          location: { contains: user.location, mode: 'insensitive' },
        }),
      },
      select: {
        id: true,
        name: true,
        profilePictureUrl: true,
        currentJobTitle: true,
        company: true,
        location: true,
        industry: true,
        skills: true,
      },
      take: limit,
    });
  }

  private static async calculateConnectionScore(user: any, suggestion: any) {
    let score = 0;
    const factors = {
      location: 0,
      industry: 0,
      skills: 0,
      company: 0,
      mutualConnections: 0,
    };

    // Location match
    if (user.location && suggestion.location) {
      if (user.location.toLowerCase().includes(suggestion.location.toLowerCase()) ||
          suggestion.location.toLowerCase().includes(user.location.toLowerCase())) {
        factors.location = 0.2;
        score += 0.2;
      }
    }

    // Industry match
    if (user.industry && suggestion.industry && user.industry === suggestion.industry) {
      factors.industry = 0.3;
      score += 0.3;
    }

    // Skills overlap
    if (user.skills && suggestion.skills) {
      const commonSkills = user.skills.filter((skill: string) => 
        suggestion.skills.includes(skill)
      );
      if (commonSkills.length > 0) {
        factors.skills = Math.min(0.3, commonSkills.length * 0.1);
        score += factors.skills;
      }
    }

    // Company connection
    if (user.company && suggestion.company && user.company === suggestion.company) {
      factors.company = 0.2;
      score += 0.2;
    }

    return {
      total: Math.min(1, score),
      factors,
    };
  }

  private static async getMutualConnectionCount(userId1: string, userId2: string): Promise<number> {
    const user1Connections = await this.getUserConnectionIds(userId1);
    const user2Connections = await this.getUserConnectionIds(userId2);
    
    return user1Connections.filter(id => user2Connections.includes(id)).length;
  }

  private static async getMutualConnectionNames(
    userId1: string,
    userId2: string,
    limit: number
  ): Promise<string[]> {
    const user1Connections = await this.getUserConnectionIds(userId1);
    const user2Connections = await this.getUserConnectionIds(userId2);
    
    const mutualIds = user1Connections.filter(id => user2Connections.includes(id));
    
    if (mutualIds.length === 0) return [];
    
    const mutualUsers = await prisma.user.findMany({
      where: { id: { in: mutualIds.slice(0, limit) } },
      select: { name: true },
    });
    
    return mutualUsers.map(user => user.name);
  }

  private static async getCommonInterests(user: any, suggestion: any): Promise<string[]> {
    const interests = [];
    
    if (user.industry === suggestion.industry) {
      interests.push(user.industry);
    }
    
    if (user.skills && suggestion.skills) {
      const commonSkills = user.skills.filter((skill: string) => 
        suggestion.skills.includes(skill)
      );
      interests.push(...commonSkills.slice(0, 3));
    }
    
    return interests;
  }

  private static generateConnectionReason(
    score: any,
    mutualConnections: number,
    commonInterests: string[]
  ): string {
    if (mutualConnections > 0) {
      return `${mutualConnections} mutual connection${mutualConnections > 1 ? 's' : ''}`;
    }
    
    if (commonInterests.length > 0) {
      return `Common interests: ${commonInterests.slice(0, 2).join(', ')}`;
    }
    
    if (score.factors.location > 0) {
      return 'Same location';
    }
    
    if (score.factors.industry > 0) {
      return 'Same industry';
    }
    
    return 'Suggested for you';
  }

  private static async calculateNetworkReach(userId: string, connections: string[]): Promise<number> {
    // Calculate 2nd degree connections
    const secondDegreeConnections = new Set<string>();
    
    for (const connectionId of connections) {
      const theirConnections = await this.getUserConnectionIds(connectionId);
      theirConnections.forEach(id => {
        if (id !== userId && !connections.includes(id)) {
          secondDegreeConnections.add(id);
        }
      });
    }
    
    return secondDegreeConnections.size;
  }

  private static analyzeIndustryBreakdown(connections: any[]) {
    const industryCount = connections.reduce((acc, conn) => {
      const industry = conn.industry || 'Other';
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = connections.length;
    return Object.entries(industryCount)
      .map(([industry, count]) => ({
        industry,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private static analyzeLocationBreakdown(connections: any[]) {
    const locationCount = connections.reduce((acc, conn) => {
      const location = conn.location || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = connections.length;
    return Object.entries(locationCount)
      .map(([location, count]) => ({
        location,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private static findTopConnectors(connections: any[]) {
    return connections
      .map(conn => ({
        userId: conn.id,
        name: conn.name,
        connectionCount: conn._count.sentConnections + conn._count.receivedConnections,
      }))
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, 5);
  }

  private static calculateNetworkStrength(
    totalConnections: number,
    networkReach: number,
    industryBreakdown: any[]
  ): number {
    let strength = 0;
    
    // Connection count factor (0-40 points)
    strength += Math.min(40, totalConnections * 2);
    
    // Network reach factor (0-30 points)
    strength += Math.min(30, networkReach / 10);
    
    // Diversity factor (0-30 points)
    const diversityScore = industryBreakdown.length * 5;
    strength += Math.min(30, diversityScore);
    
    return Math.min(100, strength);
  }

  private static generateNetworkRecommendations(
    totalConnections: number,
    networkStrength: number,
    industryBreakdown: any[]
  ): string[] {
    const recommendations = [];
    
    if (totalConnections < 50) {
      recommendations.push('Connect with more professionals to expand your network');
    }
    
    if (industryBreakdown.length < 3) {
      recommendations.push('Diversify your network by connecting with people from different industries');
    }
    
    if (networkStrength < 50) {
      recommendations.push('Engage more with your connections to strengthen your network');
    }
    
    return recommendations;
  }
}
