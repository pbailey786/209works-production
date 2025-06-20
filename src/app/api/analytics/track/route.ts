import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { AnalyticsMiddleware } from '@/lib/analytics/analytics-middleware';
import { z } from 'zod';

// Validation schema for tracking events
const trackEventSchema = z.object({
  eventType: z.string().min(1).max(100),
  eventData: z.record(z.any()).default({}),
  sessionId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

// POST /api/analytics/track - Track user behavior events
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
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { eventType, eventData, sessionId, timestamp } = trackEventSchema.parse(body);

    // Enhanced event data with request context
    const enhancedEventData = {
      ...eventData,
      userAgent: req.headers.get('user-agent'),
      referer: req.headers.get('referer'),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      timestamp: timestamp || new Date().toISOString(),
    };

    // Track the event using our analytics middleware
    await AnalyticsMiddleware.trackEvent(
      user.id,
      eventType,
      enhancedEventData,
      sessionId
    );

    // Handle specific event types with additional processing
    switch (eventType) {
      case 'job_search':
        await handleJobSearchEvent(user.id, enhancedEventData, sessionId);
        break;
      
      case 'job_apply':
        await handleJobApplicationEvent(user.id, enhancedEventData, sessionId);
        break;
      
      case 'chat_interaction':
        await handleChatInteractionEvent(user.id, enhancedEventData, sessionId);
        break;
      
      case 'profile_update':
        await handleProfileUpdateEvent(user.id, enhancedEventData, sessionId);
        break;
      
      case 'career_change_interest':
        await handleCareerChangeInterestEvent(user.id, enhancedEventData, sessionId);
        break;
    }

    return NextResponse.json({
      success: true,
      eventId: `${user.id}_${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

// GET /api/analytics/track - Get tracking configuration
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return tracking configuration and user preferences
    const config = {
      trackingEnabled: true,
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
      eventTypes: [
        'page_view',
        'job_search',
        'job_view',
        'job_apply',
        'job_save',
        'chat_interaction',
        'profile_update',
        'salary_search',
        'company_research',
        'skill_search',
        'career_change_interest',
        'training_program_interest',
        'button_click',
        'form_submission',
        'error',
        'feature_usage',
        'time_spent',
      ],
      privacySettings: {
        collectPersonalData: false,
        collectLocationData: true,
        collectDeviceData: true,
        dataRetentionDays: 365,
      },
    };

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error fetching tracking config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking configuration' },
      { status: 500 }
    );
  }
}

// Event-specific handlers

async function handleJobSearchEvent(
  userId: string,
  eventData: any,
  sessionId?: string
): Promise<void> {
  try {
    await AnalyticsMiddleware.trackJobSearch(
      userId,
      eventData.query || '',
      eventData.filters || {},
      [], // Results would be passed from frontend
      sessionId
    );

    // Update user search history
    await prisma.searchHistory.create({
      data: {
        userId,
        query: eventData.query || '',
        filters: eventData.filters || {},
        resultCount: eventData.resultCount || 0,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to handle job search event:', error);
  }
}

async function handleJobApplicationEvent(
  userId: string,
  eventData: any,
  sessionId?: string
): Promise<void> {
  try {
    // Track the application
    await AnalyticsMiddleware.trackJobApplication(
      userId,
      eventData.jobId,
      {
        title: eventData.jobTitle,
        company: eventData.company,
        industry: eventData.industry,
        salaryMin: eventData.salaryMin,
        salaryMax: eventData.salaryMax,
      },
      {
        method: eventData.applicationMethod,
        coverLetter: eventData.hasCoverLetter,
        customResume: eventData.hasCustomResume,
      },
      sessionId
    );

    // Create application record if it doesn't exist
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        userId,
        jobId: eventData.jobId,
      },
    });

    if (!existingApplication) {
      await prisma.jobApplication.create({
        data: {
          userId,
          jobId: eventData.jobId,
          status: 'applied',
          appliedAt: new Date(),
          applicationData: {
            method: eventData.applicationMethod,
            hasCoverLetter: eventData.hasCoverLetter,
            hasCustomResume: eventData.hasCustomResume,
          },
        },
      });
    }
  } catch (error) {
    console.error('Failed to handle job application event:', error);
  }
}

async function handleChatInteractionEvent(
  userId: string,
  eventData: any,
  sessionId?: string
): Promise<void> {
  try {
    await AnalyticsMiddleware.trackChatInteraction(
      userId,
      eventData.message || '',
      eventData.aiResponse || '',
      eventData.hasCareerInsights || false,
      sessionId
    );

    // Store chat message for conversation history
    if (sessionId) {
      // Find or create chat session
      let chatSession = await prisma.chatSession.findFirst({
        where: {
          userId,
          sessionId,
        },
      });

      if (!chatSession) {
        chatSession = await prisma.chatSession.create({
          data: {
            userId,
            sessionId,
            title: eventData.message.slice(0, 50) + '...',
            isActive: true,
          },
        });
      }

      // Store the messages
      await prisma.chatMessage.createMany({
        data: [
          {
            sessionId: chatSession.id,
            role: 'user',
            content: eventData.message,
          },
          {
            sessionId: chatSession.id,
            role: 'assistant',
            content: eventData.aiResponse,
            metadata: {
              hasCareerInsights: eventData.hasCareerInsights,
            },
          },
        ],
      });
    }
  } catch (error) {
    console.error('Failed to handle chat interaction event:', error);
  }
}

async function handleProfileUpdateEvent(
  userId: string,
  eventData: any,
  sessionId?: string
): Promise<void> {
  try {
    await AnalyticsMiddleware.trackProfileUpdate(
      userId,
      eventData.updatedFields || [],
      {}, // Old values would need to be passed from frontend
      eventData.changes || {},
      sessionId
    );

    // If job title changed, check for career transition
    if (eventData.hasJobTitleChange && eventData.changes?.currentJobTitle) {
      const change = eventData.changes.currentJobTitle;
      await detectAndRecordCareerTransition(userId, change.from, change.to);
    }
  } catch (error) {
    console.error('Failed to handle profile update event:', error);
  }
}

async function handleCareerChangeInterestEvent(
  userId: string,
  eventData: any,
  sessionId?: string
): Promise<void> {
  try {
    // Record career intent signal
    await prisma.careerIntentSignal.create({
      data: {
        userId,
        signalType: 'career_change_interest',
        strength: 0.8, // High strength for explicit interest
        context: {
          currentIndustry: eventData.currentIndustry,
          targetIndustry: eventData.targetIndustry,
          context: eventData.context,
        },
        detectedAt: new Date(),
      },
    });

    // Update user's career change readiness score
    await updateCareerChangeReadiness(userId);
  } catch (error) {
    console.error('Failed to handle career change interest event:', error);
  }
}

// Helper functions

async function detectAndRecordCareerTransition(
  userId: string,
  oldJobTitle: string,
  newJobTitle: string
): Promise<void> {
  if (!oldJobTitle || !newJobTitle || oldJobTitle === newJobTitle) return;

  const oldIndustry = extractIndustryFromTitle(oldJobTitle);
  const newIndustry = extractIndustryFromTitle(newJobTitle);

  if (oldIndustry !== newIndustry) {
    await prisma.careerTransition.create({
      data: {
        userId,
        fromIndustry: oldIndustry,
        toIndustry: newIndustry,
        fromJobTitle: oldJobTitle,
        toJobTitle: newJobTitle,
        startDate: new Date(),
      },
    });
  }
}

async function updateCareerChangeReadiness(userId: string): Promise<void> {
  // Calculate readiness score based on recent signals
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSignals = await prisma.careerIntentSignal.findMany({
    where: {
      userId,
      detectedAt: { gte: thirtyDaysAgo },
    },
  });

  const readinessScore = calculateReadinessScore(recentSignals);

  await prisma.userBehaviorProfile.upsert({
    where: { userId },
    update: {
      careerChangeReadiness: readinessScore,
      lastAnalyzed: new Date(),
    },
    create: {
      userId,
      lastActivity: new Date(),
      totalEvents: 1,
      eventTypeCounts: {},
      careerChangeReadiness: readinessScore,
      lastAnalyzed: new Date(),
    },
  });
}

function calculateReadinessScore(signals: any[]): number {
  if (signals.length === 0) return 0;

  const signalWeights = {
    'career_change_interest': 0.3,
    'job_dissatisfaction': 0.25,
    'skill_development': 0.2,
    'salary_research': 0.15,
    'industry_exploration': 0.1,
  };

  let totalScore = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    const weight = signalWeights[signal.signalType as keyof typeof signalWeights] || 0.1;
    totalScore += signal.strength * weight;
    totalWeight += weight;
  }

  const baseScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  const frequencyMultiplier = Math.min(1.5, 1 + (signals.length - 1) * 0.1);
  
  return Math.min(1, baseScore * frequencyMultiplier);
}

function extractIndustryFromTitle(title: string): string {
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
