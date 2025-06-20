import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { AdvancedRecommendationEngine } from '@/lib/ai/advanced-recommendation-engine';
import { z } from 'zod';

// Validation schemas
const personalizedRecommendationsSchema = z.object({
  limit: z.number().min(1).max(50).default(20),
  includeApplied: z.boolean().default(false),
  refreshCache: z.boolean().default(false),
});

const trendingJobsSchema = z.object({
  region: z.string().default('209'),
  timeframe: z.enum(['24h', '7d', '30d']).default('7d'),
  limit: z.number().min(1).max(50).default(10),
});

const collaborativeInsightsSchema = z.object({
  userId: z.string().uuid().optional(),
});

// GET /api/ai/recommendations/advanced - Get advanced ML-powered recommendations
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
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'personalized';

    let result;

    switch (type) {
      case 'personalized':
        const personalizedParams = personalizedRecommendationsSchema.parse({
          limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
          includeApplied: url.searchParams.get('includeApplied') === 'true',
          refreshCache: url.searchParams.get('refreshCache') === 'true',
        });

        result = await AdvancedRecommendationEngine.generatePersonalizedRecommendations(
          user.id,
          personalizedParams.limit,
          personalizedParams.includeApplied
        );
        break;

      case 'trending':
        const trendingParams = trendingJobsSchema.parse({
          region: url.searchParams.get('region') || undefined,
          timeframe: url.searchParams.get('timeframe') as any || undefined,
          limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
        });

        result = await AdvancedRecommendationEngine.generateTrendingJobs(
          trendingParams.region,
          trendingParams.timeframe,
          trendingParams.limit
        );
        break;

      case 'collaborative':
        const collaborativeParams = collaborativeInsightsSchema.parse({
          userId: url.searchParams.get('userId') || user.id,
        });

        // Users can only get their own insights unless they're admin
        if (collaborativeParams.userId !== user.id && user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Can only access your own collaborative insights' },
            { status: 403 }
          );
        }

        result = await AdvancedRecommendationEngine.generateCollaborativeInsights(
          collaborativeParams.userId!
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid recommendation type' },
          { status: 400 }
        );
    }

    // Log recommendation request for analytics
    await prisma.recommendationAnalytics.create({
      data: {
        userId: user.id,
        recommendationType: type,
        requestedCount: type === 'personalized' ? result.recommendations?.length : 
                       type === 'trending' ? result.length : 1,
        generatedAt: new Date(),
      },
    }).catch(error => {
      console.error('Failed to log recommendation analytics:', error);
      // Don't fail the request if logging fails
    });

    return NextResponse.json({
      success: true,
      type,
      data: result,
      generatedAt: new Date().toISOString(),
      metadata: {
        algorithm: 'Advanced ML Hybrid Recommendation Engine',
        version: '2.0',
        features: ['Content-based filtering', 'Collaborative filtering', 'Semantic matching', 'Trend analysis'],
      },
    });
  } catch (error) {
    console.error('Error generating advanced recommendations:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

// POST /api/ai/recommendations/advanced - Provide feedback on recommendations
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const feedbackSchema = z.object({
      jobId: z.string().uuid(),
      action: z.enum(['viewed', 'applied', 'saved', 'dismissed', 'not_interested']),
      rating: z.number().min(1).max(5).optional(),
      feedback: z.string().optional(),
      recommendationId: z.string().optional(),
    });

    const feedback = feedbackSchema.parse(body);

    // Store feedback for improving recommendations
    await prisma.recommendationFeedback.create({
      data: {
        userId: user.id,
        jobId: feedback.jobId,
        action: feedback.action,
        rating: feedback.rating,
        feedback: feedback.feedback,
        recommendationId: feedback.recommendationId,
        createdAt: new Date(),
      },
    });

    // Update user preference model based on feedback
    await updateUserPreferenceModel(user.id, feedback);

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
      impact: 'Your feedback will improve future recommendations',
    });
  } catch (error) {
    console.error('Error recording recommendation feedback:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}

// Helper function to update user preference model
async function updateUserPreferenceModel(userId: string, feedback: any) {
  try {
    // Get the job details to extract features
    const job = await prisma.job.findUnique({
      where: { id: feedback.jobId },
      select: {
        title: true,
        company: true,
        location: true,
        jobType: true,
        salaryMin: true,
        salaryMax: true,
        skills: true,
        industry: true,
      },
    });

    if (!job) return;

    // Update or create user preference record
    const preferenceWeight = getPreferenceWeight(feedback.action, feedback.rating);
    
    await prisma.userPreference.upsert({
      where: { userId },
      update: {
        preferences: {
          // Update preferences based on job features and feedback
          jobTypes: updatePreferenceArray(job.jobType, preferenceWeight),
          industries: updatePreferenceArray(job.industry, preferenceWeight),
          locations: updatePreferenceArray(job.location, preferenceWeight),
          companies: updatePreferenceArray(job.company, preferenceWeight),
          salaryRange: updateSalaryPreference(job.salaryMin, job.salaryMax, preferenceWeight),
          skills: updateSkillPreferences(job.skills, preferenceWeight),
        },
        updatedAt: new Date(),
      },
      create: {
        userId,
        preferences: {
          jobTypes: [{ value: job.jobType, weight: preferenceWeight }],
          industries: [{ value: job.industry, weight: preferenceWeight }],
          locations: [{ value: job.location, weight: preferenceWeight }],
          companies: [{ value: job.company, weight: preferenceWeight }],
          salaryRange: { min: job.salaryMin, max: job.salaryMax, weight: preferenceWeight },
          skills: job.skills?.map((skill: string) => ({ value: skill, weight: preferenceWeight })) || [],
        },
      },
    });
  } catch (error) {
    console.error('Error updating user preference model:', error);
  }
}

function getPreferenceWeight(action: string, rating?: number): number {
  const baseWeights = {
    applied: 1.0,
    saved: 0.8,
    viewed: 0.3,
    dismissed: -0.5,
    not_interested: -1.0,
  };

  let weight = baseWeights[action as keyof typeof baseWeights] || 0;
  
  // Adjust based on rating if provided
  if (rating) {
    weight *= (rating / 3); // Normalize rating to affect weight
  }

  return weight;
}

function updatePreferenceArray(value: string, weight: number) {
  // Implementation for updating preference arrays
  return [{ value, weight }];
}

function updateSalaryPreference(min?: number, max?: number, weight?: number) {
  // Implementation for updating salary preferences
  return { min, max, weight };
}

function updateSkillPreferences(skills: string[], weight: number) {
  // Implementation for updating skill preferences
  return skills.map(skill => ({ value: skill, weight }));
}
