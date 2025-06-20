/**
 * Analytics Middleware
 * Automatically tracks user behavior across the platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ComprehensiveAnalytics } from './comprehensive-analytics';
import { prisma } from '@/lib/database/prisma';

export interface AnalyticsConfig {
  trackPageViews: boolean;
  trackApiCalls: boolean;
  trackSearches: boolean;
  trackClicks: boolean;
  excludePaths: string[];
  sampleRate: number; // 0-1, for performance
}

const defaultConfig: AnalyticsConfig = {
  trackPageViews: true,
  trackApiCalls: true,
  trackSearches: true,
  trackClicks: true,
  excludePaths: ['/api/analytics', '/api/health', '/_next', '/favicon.ico'],
  sampleRate: 1.0, // Track 100% in development, reduce in production
};

export class AnalyticsMiddleware {
  private static config: AnalyticsConfig = defaultConfig;
  private static sessionStore = new Map<string, string>(); // userId -> sessionId

  /**
   * Main middleware function to track requests
   */
  static async trackRequest(
    request: NextRequest,
    response: NextResponse,
    config: Partial<AnalyticsConfig> = {}
  ): Promise<void> {
    try {
      // Merge config
      const activeConfig = { ...this.config, ...config };

      // Check if we should track this request
      if (!this.shouldTrack(request, activeConfig)) {
        return;
      }

      // Sample requests for performance
      if (Math.random() > activeConfig.sampleRate) {
        return;
      }

      // Get user info
      const { userId } = auth();
      if (!userId) return; // Only track authenticated users

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) return;

      // Generate or get session ID
      const sessionId = this.getOrCreateSessionId(user.id);

      // Extract request info
      const requestInfo = this.extractRequestInfo(request);

      // Track the event
      await ComprehensiveAnalytics.trackEvent({
        userId: user.id,
        eventType: this.determineEventType(request),
        eventData: requestInfo,
        timestamp: new Date(),
        sessionId,
        deviceInfo: this.extractDeviceInfo(request),
      });

      // Track time-based patterns
      await ComprehensiveAnalytics.trackTimeBasedPatterns(
        user.id,
        this.determineEventType(request),
        new Date()
      );

      // Track geographic patterns if location available
      const location = this.extractLocation(request);
      if (location) {
        await ComprehensiveAnalytics.analyzeGeographicPatterns(user.id, location);
      }

    } catch (error) {
      console.error('Analytics middleware error:', error);
      // Don't throw - analytics should never break the app
    }
  }

  /**
   * Track specific events manually
   */
  static async trackEvent(
    userId: string,
    eventType: string,
    eventData: Record<string, any>,
    sessionId?: string
  ): Promise<void> {
    try {
      const session = sessionId || this.getOrCreateSessionId(userId);

      await ComprehensiveAnalytics.trackEvent({
        userId,
        eventType: eventType as any,
        eventData,
        timestamp: new Date(),
        sessionId: session,
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track job search with enhanced analytics
   */
  static async trackJobSearch(
    userId: string,
    searchQuery: string,
    filters: Record<string, any>,
    results: any[],
    sessionId?: string
  ): Promise<void> {
    const eventData = {
      query: searchQuery,
      filters,
      resultCount: results.length,
      hasResults: results.length > 0,
      searchTerms: this.extractSearchTerms(searchQuery),
      industries: this.extractIndustries(searchQuery, results),
      salaryRange: this.extractSalaryRange(filters),
      location: filters.location,
    };

    await this.trackEvent(userId, 'job_search', eventData, sessionId);

    // Track skill interests if detected
    const skills = this.extractSkillsFromSearch(searchQuery);
    if (skills.length > 0) {
      await ComprehensiveAnalytics.trackSkillInterest(userId, skills, 'job_search');
    }
  }

  /**
   * Track job application with career intent analysis
   */
  static async trackJobApplication(
    userId: string,
    jobId: string,
    jobData: any,
    applicationData: any,
    sessionId?: string
  ): Promise<void> {
    const eventData = {
      jobId,
      jobTitle: jobData.title,
      company: jobData.company,
      industry: jobData.industry,
      salaryMin: jobData.salaryMin,
      salaryMax: jobData.salaryMax,
      requiredSkills: jobData.skills,
      applicationMethod: applicationData.method,
      hasCoverLetter: !!applicationData.coverLetter,
      hasCustomResume: !!applicationData.customResume,
    };

    await this.trackEvent(userId, 'job_apply', eventData, sessionId);

    // Analyze for career transition signals
    await this.analyzeCareerTransitionIntent(userId, jobData);
  }

  /**
   * Track chat interactions with enhanced analysis
   */
  static async trackChatInteraction(
    userId: string,
    userMessage: string,
    aiResponse: string,
    hasCareerInsights: boolean,
    sessionId?: string
  ): Promise<void> {
    const eventData = {
      message: userMessage,
      aiResponse,
      messageLength: userMessage.length,
      responseLength: aiResponse.length,
      hasCareerInsights,
      sentiment: await this.analyzeSentiment(userMessage),
      topics: this.extractTopics(userMessage),
      careerKeywords: this.extractCareerKeywords(userMessage),
    };

    await this.trackEvent(userId, 'chat_interaction', eventData, sessionId);

    // Track skill interests mentioned in chat
    const skills = this.extractSkillsFromText(userMessage);
    if (skills.length > 0) {
      await ComprehensiveAnalytics.trackSkillInterest(userId, skills, 'chat');
    }
  }

  /**
   * Track profile updates for career progression analysis
   */
  static async trackProfileUpdate(
    userId: string,
    updatedFields: string[],
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    sessionId?: string
  ): Promise<void> {
    const eventData = {
      updatedFields,
      fieldCount: updatedFields.length,
      hasJobTitleChange: updatedFields.includes('currentJobTitle'),
      hasSalaryChange: updatedFields.includes('currentSalary'),
      hasSkillsChange: updatedFields.includes('skills'),
      hasLocationChange: updatedFields.includes('location'),
      changes: this.calculateChanges(oldValues, newValues),
    };

    await this.trackEvent(userId, 'profile_update', eventData, sessionId);

    // Detect potential career transitions
    if (eventData.hasJobTitleChange) {
      await this.detectCareerTransition(userId, oldValues, newValues);
    }
  }

  // Private helper methods

  private static shouldTrack(request: NextRequest, config: AnalyticsConfig): boolean {
    const pathname = request.nextUrl.pathname;
    
    // Check excluded paths
    if (config.excludePaths.some(path => pathname.startsWith(path))) {
      return false;
    }

    // Only track specific types based on config
    if (pathname.startsWith('/api/') && !config.trackApiCalls) {
      return false;
    }

    return true;
  }

  private static determineEventType(request: NextRequest): string {
    const pathname = request.nextUrl.pathname;
    const method = request.method;

    if (pathname.startsWith('/api/')) {
      if (pathname.includes('/search') || pathname.includes('/jobs')) {
        return 'job_search';
      }
      if (pathname.includes('/chat')) {
        return 'chat_interaction';
      }
      if (pathname.includes('/profile')) {
        return 'profile_update';
      }
      return 'api_call';
    }

    // Page views
    if (method === 'GET') {
      if (pathname.includes('/jobs/')) {
        return 'job_view';
      }
      if (pathname.includes('/companies/')) {
        return 'company_research';
      }
      if (pathname.includes('/salary')) {
        return 'salary_search';
      }
      return 'page_view';
    }

    return 'unknown';
  }

  private static extractRequestInfo(request: NextRequest): Record<string, any> {
    const url = request.nextUrl;
    
    return {
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams.entries()),
      method: request.method,
      referrer: request.headers.get('referer'),
      timestamp: new Date().toISOString(),
    };
  }

  private static extractDeviceInfo(request: NextRequest) {
    const userAgent = request.headers.get('user-agent') || '';
    
    return {
      userAgent,
      isMobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
      browser: this.extractBrowser(userAgent),
      os: this.extractOS(userAgent),
    };
  }

  private static extractLocation(request: NextRequest): string | undefined {
    // In production, you'd use IP geolocation or user's saved location
    const location = request.headers.get('cf-ipcountry') || 
                    request.headers.get('x-forwarded-for');
    return location || undefined;
  }

  private static getOrCreateSessionId(userId: string): string {
    if (!this.sessionStore.has(userId)) {
      this.sessionStore.set(userId, this.generateSessionId());
    }
    return this.sessionStore.get(userId)!;
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static extractSearchTerms(query: string): string[] {
    return query.toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2)
      .slice(0, 10); // Limit to 10 terms
  }

  private static extractIndustries(query: string, results: any[]): string[] {
    const industries = new Set<string>();
    
    // Extract from query
    const industryKeywords = {
      'tech': 'Technology',
      'healthcare': 'Healthcare',
      'retail': 'Retail',
      'finance': 'Finance',
      'education': 'Education',
    };

    const lowerQuery = query.toLowerCase();
    for (const [keyword, industry] of Object.entries(industryKeywords)) {
      if (lowerQuery.includes(keyword)) {
        industries.add(industry);
      }
    }

    // Extract from results
    results.forEach(job => {
      if (job.industry) {
        industries.add(job.industry);
      }
    });

    return Array.from(industries);
  }

  private static extractSalaryRange(filters: Record<string, any>) {
    return {
      min: filters.salaryMin || null,
      max: filters.salaryMax || null,
    };
  }

  private static extractSkillsFromSearch(query: string): string[] {
    const commonSkills = [
      'javascript', 'python', 'react', 'node.js', 'sql', 'aws',
      'marketing', 'sales', 'customer service', 'management',
      'accounting', 'nursing', 'teaching', 'design', 'excel'
    ];
    
    const lowerQuery = query.toLowerCase();
    return commonSkills.filter(skill => lowerQuery.includes(skill));
  }

  private static extractSkillsFromText(text: string): string[] {
    return this.extractSkillsFromSearch(text);
  }

  private static async analyzeSentiment(text: string): Promise<string> {
    // Simple sentiment analysis - in production, use proper NLP
    const positiveWords = ['love', 'great', 'excellent', 'amazing', 'perfect'];
    const negativeWords = ['hate', 'terrible', 'awful', 'frustrated', 'tired'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static extractTopics(text: string): string[] {
    const topics = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('career') || lowerText.includes('job')) topics.push('career');
    if (lowerText.includes('salary') || lowerText.includes('pay')) topics.push('salary');
    if (lowerText.includes('skill') || lowerText.includes('learn')) topics.push('skills');
    if (lowerText.includes('remote') || lowerText.includes('work from home')) topics.push('remote_work');
    
    return topics;
  }

  private static extractCareerKeywords(text: string): string[] {
    const keywords = [];
    const lowerText = text.toLowerCase();
    
    const careerKeywords = [
      'career change', 'new job', 'transition', 'switch careers',
      'better opportunity', 'growth', 'promotion', 'advancement'
    ];
    
    careerKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        keywords.push(keyword);
      }
    });
    
    return keywords;
  }

  private static async analyzeCareerTransitionIntent(userId: string, jobData: any): Promise<void> {
    // Get user's current profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { jobSeekerProfile: true },
    });

    if (!user?.jobSeekerProfile) return;

    const currentIndustry = this.extractIndustryFromTitle(user.jobSeekerProfile.currentJobTitle);
    const targetIndustry = jobData.industry || this.extractIndustryFromTitle(jobData.title);

    // If applying to different industry, it's a transition signal
    if (currentIndustry !== targetIndustry) {
      await ComprehensiveAnalytics.trackEvent({
        userId,
        eventType: 'career_change_interest',
        eventData: {
          currentIndustry,
          targetIndustry,
          jobTitle: jobData.title,
          salaryDifference: this.calculateSalaryDifference(user.jobSeekerProfile, jobData),
        },
        timestamp: new Date(),
      });
    }
  }

  private static calculateChanges(oldValues: Record<string, any>, newValues: Record<string, any>) {
    const changes: Record<string, any> = {};
    
    for (const [key, newValue] of Object.entries(newValues)) {
      const oldValue = oldValues[key];
      if (oldValue !== newValue) {
        changes[key] = { from: oldValue, to: newValue };
      }
    }
    
    return changes;
  }

  private static async detectCareerTransition(
    userId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>
  ): Promise<void> {
    const oldTitle = oldValues.currentJobTitle;
    const newTitle = newValues.currentJobTitle;
    
    if (!oldTitle || !newTitle || oldTitle === newTitle) return;

    const oldIndustry = this.extractIndustryFromTitle(oldTitle);
    const newIndustry = this.extractIndustryFromTitle(newTitle);

    // Record the transition
    await prisma.careerTransition.create({
      data: {
        userId,
        fromIndustry: oldIndustry,
        toIndustry: newIndustry,
        fromJobTitle: oldTitle,
        toJobTitle: newTitle,
        startDate: new Date(), // Simplified - in reality, track over time
        salaryChange: this.calculateSalaryChangePercent(oldValues, newValues),
      },
    });
  }

  private static extractIndustryFromTitle(title?: string): string {
    if (!title) return 'Unknown';
    
    const industryKeywords = {
      'Technology': ['software', 'developer', 'engineer', 'programmer', 'tech', 'IT'],
      'Healthcare': ['nurse', 'doctor', 'medical', 'healthcare', 'clinical'],
      'Retail': ['cashier', 'sales associate', 'retail', 'store'],
      'Finance': ['accountant', 'financial', 'banker', 'analyst'],
      'Education': ['teacher', 'professor', 'educator', 'instructor'],
    };

    const lowerTitle = title.toLowerCase();
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => lowerTitle.includes(keyword))) {
        return industry;
      }
    }

    return 'Other';
  }

  private static calculateSalaryDifference(profile: any, jobData: any): number {
    const currentSalary = profile.currentSalary || 0;
    const targetSalary = (jobData.salaryMin + jobData.salaryMax) / 2 || 0;
    
    if (currentSalary === 0 || targetSalary === 0) return 0;
    
    return ((targetSalary - currentSalary) / currentSalary) * 100;
  }

  private static calculateSalaryChangePercent(oldValues: any, newValues: any): number {
    const oldSalary = oldValues.currentSalary || 0;
    const newSalary = newValues.currentSalary || 0;
    
    if (oldSalary === 0 || newSalary === 0) return 0;
    
    return ((newSalary - oldSalary) / oldSalary) * 100;
  }

  private static extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private static extractOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }
}
