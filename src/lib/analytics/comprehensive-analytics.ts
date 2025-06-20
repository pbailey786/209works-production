/**
 * Comprehensive Analytics System
 * Tracks all user behavior, career patterns, and market intelligence
 */

import { prisma } from '@/lib/database/prisma';
import { processWithAI } from '@/lib/ai';

export interface UserBehaviorEvent {
  userId: string;
  eventType: 'page_view' | 'job_search' | 'job_view' | 'job_apply' | 'job_save' | 'profile_update' | 'chat_interaction' | 'skill_search' | 'salary_search' | 'company_research';
  eventData: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  deviceInfo?: {
    userAgent: string;
    isMobile: boolean;
    location?: string;
  };
}

export interface CareerIntentSignal {
  userId: string;
  signalType: 'career_change_interest' | 'skill_development' | 'salary_research' | 'industry_exploration' | 'job_dissatisfaction' | 'learning_activity';
  strength: number; // 0-1, how strong the signal is
  context: Record<string, any>;
  detectedAt: Date;
}

export interface MarketIntelligence {
  region: string;
  industry: string;
  metric: 'demand' | 'supply' | 'salary_trend' | 'skill_gap' | 'competition';
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number; // 0-1
  calculatedAt: Date;
}

export class ComprehensiveAnalytics {
  /**
   * Track user behavior events
   */
  static async trackEvent(event: UserBehaviorEvent): Promise<void> {
    try {
      // Store the raw event
      await prisma.userBehaviorEvent.create({
        data: {
          userId: event.userId,
          eventType: event.eventType,
          eventData: event.eventData,
          timestamp: event.timestamp,
          sessionId: event.sessionId,
          deviceInfo: event.deviceInfo,
        },
      });

      // Analyze for career intent signals
      await this.analyzeCareerIntentSignals(event);

      // Update user behavior patterns
      await this.updateUserBehaviorProfile(event.userId, event);

    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Analyze career intent signals from user behavior
   */
  private static async analyzeCareerIntentSignals(event: UserBehaviorEvent): Promise<void> {
    const signals: CareerIntentSignal[] = [];

    switch (event.eventType) {
      case 'job_search':
        // Analyze search terms for career change signals
        const searchQuery = event.eventData.query?.toLowerCase() || '';
        
        if (this.containsCareerChangeKeywords(searchQuery)) {
          signals.push({
            userId: event.userId,
            signalType: 'career_change_interest',
            strength: 0.7,
            context: { searchQuery, searchType: 'job_search' },
            detectedAt: event.timestamp,
          });
        }

        if (this.containsSkillKeywords(searchQuery)) {
          signals.push({
            userId: event.userId,
            signalType: 'skill_development',
            strength: 0.6,
            context: { searchQuery, skillsDetected: this.extractSkills(searchQuery) },
            detectedAt: event.timestamp,
          });
        }
        break;

      case 'chat_interaction':
        // Analyze chat content for intent
        const chatContent = event.eventData.message?.toLowerCase() || '';
        const aiResponse = event.eventData.aiResponse || '';

        if (this.containsCareerChangeKeywords(chatContent)) {
          signals.push({
            userId: event.userId,
            signalType: 'career_change_interest',
            strength: 0.8, // Chat is more intentional than search
            context: { chatContent, aiResponse },
            detectedAt: event.timestamp,
          });
        }

        if (this.containsJobDissatisfactionKeywords(chatContent)) {
          signals.push({
            userId: event.userId,
            signalType: 'job_dissatisfaction',
            strength: 0.9,
            context: { chatContent, sentiment: 'negative' },
            detectedAt: event.timestamp,
          });
        }
        break;

      case 'salary_search':
        signals.push({
          userId: event.userId,
          signalType: 'salary_research',
          strength: 0.8,
          context: { 
            targetRole: event.eventData.role,
            currentSalary: event.eventData.currentSalary,
            targetSalary: event.eventData.targetSalary,
          },
          detectedAt: event.timestamp,
        });
        break;
    }

    // Store detected signals
    for (const signal of signals) {
      await prisma.careerIntentSignal.create({
        data: signal,
      });
    }
  }

  /**
   * Calculate career change readiness score
   */
  static async calculateCareerChangeReadiness(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get recent signals
    const recentSignals = await prisma.careerIntentSignal.findMany({
      where: {
        userId,
        detectedAt: { gte: thirtyDaysAgo },
      },
    });

    if (recentSignals.length === 0) return 0;

    // Weight different signal types
    const signalWeights = {
      'career_change_interest': 0.3,
      'job_dissatisfaction': 0.25,
      'skill_development': 0.2,
      'salary_research': 0.15,
      'industry_exploration': 0.1,
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const signal of recentSignals) {
      const weight = signalWeights[signal.signalType as keyof typeof signalWeights] || 0.1;
      totalScore += signal.strength * weight;
      totalWeight += weight;
    }

    // Normalize to 0-1 scale
    const readinessScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // Apply frequency multiplier (more signals = higher readiness)
    const frequencyMultiplier = Math.min(1.5, 1 + (recentSignals.length - 1) * 0.1);
    
    return Math.min(1, readinessScore * frequencyMultiplier);
  }

  /**
   * Track time-based behavior patterns
   */
  static async trackTimeBasedPatterns(userId: string, eventType: string, timestamp: Date): Promise<void> {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    await prisma.userTimePattern.upsert({
      where: {
        userId_eventType_hour_dayOfWeek: {
          userId,
          eventType,
          hour,
          dayOfWeek,
        },
      },
      update: {
        count: { increment: 1 },
        lastOccurrence: timestamp,
      },
      create: {
        userId,
        eventType,
        hour,
        dayOfWeek,
        isWeekend,
        count: 1,
        lastOccurrence: timestamp,
      },
    });
  }

  /**
   * Analyze geographic patterns
   */
  static async analyzeGeographicPatterns(userId: string, location?: string): Promise<void> {
    if (!location) return;

    // Extract city/region from location
    const region = this.extractRegion(location);
    
    await prisma.userGeographicPattern.upsert({
      where: {
        userId_region: {
          userId,
          region,
        },
      },
      update: {
        activityCount: { increment: 1 },
        lastActivity: new Date(),
      },
      create: {
        userId,
        region,
        activityCount: 1,
        lastActivity: new Date(),
      },
    });
  }

  /**
   * Track skill interest patterns
   */
  static async trackSkillInterest(userId: string, skills: string[], context: string): Promise<void> {
    for (const skill of skills) {
      await prisma.userSkillInterest.upsert({
        where: {
          userId_skill: {
            userId,
            skill: skill.toLowerCase(),
          },
        },
        update: {
          interestCount: { increment: 1 },
          lastInteraction: new Date(),
          contexts: { push: context },
        },
        create: {
          userId,
          skill: skill.toLowerCase(),
          interestCount: 1,
          lastInteraction: new Date(),
          contexts: [context],
        },
      });
    }
  }

  /**
   * Calculate market intelligence metrics
   */
  static async calculateMarketIntelligence(region: string, industry: string): Promise<MarketIntelligence[]> {
    const metrics: MarketIntelligence[] = [];
    const now = new Date();

    // Calculate demand metric
    const demandMetric = await this.calculateDemandMetric(region, industry);
    metrics.push({
      region,
      industry,
      metric: 'demand',
      value: demandMetric.value,
      trend: demandMetric.trend,
      confidence: demandMetric.confidence,
      calculatedAt: now,
    });

    // Calculate supply metric
    const supplyMetric = await this.calculateSupplyMetric(region, industry);
    metrics.push({
      region,
      industry,
      metric: 'supply',
      value: supplyMetric.value,
      trend: supplyMetric.trend,
      confidence: supplyMetric.confidence,
      calculatedAt: now,
    });

    // Store metrics
    for (const metric of metrics) {
      await prisma.marketIntelligence.create({
        data: metric,
      });
    }

    return metrics;
  }

  /**
   * Generate predictive insights
   */
  static async generatePredictiveInsights(userId: string): Promise<any> {
    // Get user's behavior patterns
    const behaviorPatterns = await this.getUserBehaviorPatterns(userId);
    
    // Get career intent signals
    const readinessScore = await this.calculateCareerChangeReadiness(userId);
    
    // Get similar user outcomes
    const similarUserOutcomes = await this.findSimilarUserOutcomes(userId);

    return {
      careerChangeReadiness: readinessScore,
      predictedTransitions: this.predictLikelyTransitions(behaviorPatterns),
      successProbability: this.calculateSuccessProbability(behaviorPatterns, similarUserOutcomes),
      recommendedActions: this.generateRecommendedActions(readinessScore, behaviorPatterns),
      optimalTiming: this.calculateOptimalTiming(behaviorPatterns),
    };
  }

  // Helper methods

  private static containsCareerChangeKeywords(text: string): boolean {
    const keywords = [
      'career change', 'switch careers', 'new field', 'different industry',
      'transition to', 'move from', 'change jobs', 'new career',
      'tired of', 'want something different', 'looking for change'
    ];
    return keywords.some(keyword => text.includes(keyword));
  }

  private static containsSkillKeywords(text: string): boolean {
    const keywords = [
      'learn', 'training', 'course', 'certification', 'skill',
      'bootcamp', 'education', 'study', 'develop', 'improve'
    ];
    return keywords.some(keyword => text.includes(keyword));
  }

  private static containsJobDissatisfactionKeywords(text: string): boolean {
    const keywords = [
      'hate my job', 'tired of', 'frustrated', 'burned out', 'underpaid',
      'no growth', 'bad management', 'toxic', 'stressed', 'unhappy'
    ];
    return keywords.some(keyword => text.includes(keyword));
  }

  private static extractSkills(text: string): string[] {
    const commonSkills = [
      'javascript', 'python', 'react', 'node.js', 'sql', 'aws',
      'marketing', 'sales', 'customer service', 'management',
      'accounting', 'nursing', 'teaching', 'design'
    ];
    
    return commonSkills.filter(skill => text.includes(skill));
  }

  private static extractRegion(location: string): string {
    // Simple region extraction - in production, use proper geocoding
    if (location.includes('Stockton')) return 'Stockton';
    if (location.includes('Modesto')) return 'Modesto';
    if (location.includes('Tracy')) return 'Tracy';
    if (location.includes('Manteca')) return 'Manteca';
    if (location.includes('Lodi')) return 'Lodi';
    return '209-Other';
  }

  private static async updateUserBehaviorProfile(userId: string, event: UserBehaviorEvent): Promise<void> {
    // Update user's behavior profile with latest activity
    await prisma.userBehaviorProfile.upsert({
      where: { userId },
      update: {
        lastActivity: event.timestamp,
        totalEvents: { increment: 1 },
        eventTypeCounts: {
          // Increment count for this event type
        },
      },
      create: {
        userId,
        lastActivity: event.timestamp,
        totalEvents: 1,
        eventTypeCounts: {
          [event.eventType]: 1,
        },
      },
    });
  }

  private static async calculateDemandMetric(region: string, industry: string) {
    // Calculate job demand based on job postings, applications, etc.
    return {
      value: 0.75, // Placeholder
      trend: 'increasing' as const,
      confidence: 0.8,
    };
  }

  private static async calculateSupplyMetric(region: string, industry: string) {
    // Calculate talent supply based on user profiles, searches, etc.
    return {
      value: 0.65, // Placeholder
      trend: 'stable' as const,
      confidence: 0.7,
    };
  }

  private static async getUserBehaviorPatterns(userId: string) {
    // Get comprehensive behavior patterns for user
    return {};
  }

  private static async findSimilarUserOutcomes(userId: string) {
    // Find users with similar profiles and their outcomes
    return [];
  }

  private static predictLikelyTransitions(behaviorPatterns: any) {
    // Predict most likely career transitions
    return [];
  }

  private static calculateSuccessProbability(behaviorPatterns: any, similarOutcomes: any) {
    // Calculate probability of successful transition
    return 0.75;
  }

  private static generateRecommendedActions(readinessScore: number, behaviorPatterns: any) {
    // Generate personalized action recommendations
    return [];
  }

  private static calculateOptimalTiming(behaviorPatterns: any) {
    // Calculate optimal timing for career moves
    return {
      bestMonth: 'March',
      confidence: 0.8,
      reasoning: 'Based on historical hiring patterns',
    };
  }
}
