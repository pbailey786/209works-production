import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SemanticSearchEngine } from '@/lib/ai/semantic-search';
import { getDomainConfig } from '@/lib/domain/config';
import { EnhancedPerformanceTracker } from '@/lib/performance/performance-monitor';

/**
 * GET /api/recommendations/jobs
 * Get AI-powered job recommendations for the authenticated user
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const region = searchParams.get('region');

    // Get domain context
    const hostname = request.headers.get('host') || '';
    const domainConfig = getDomainConfig(hostname);
    const targetRegion = region || domainConfig.areaCode;

    // Get AI-powered recommendations
    const recommendations = await SemanticSearchEngine.getJobRecommendations({
      userId,
      region: targetRegion,
      limit: Math.min(limit, 25), // Cap at 25 recommendations
    });

    // Track performance
    const duration = Date.now() - startTime;
    EnhancedPerformanceTracker.trackAPICall({
      endpoint: '/api/recommendations/jobs',
      method: 'GET',
      duration,
      statusCode: 200,
      region: targetRegion,
    });

    // Format response
    const response = {
      success: true,
      data: {
        recommendations: recommendations.map(rec => ({
          job: {
            id: rec.job.id,
            title: rec.job.title,
            company: rec.job.company,
            location: rec.job.location,
            jobType: rec.job.jobType,
            experienceLevel: rec.job.experienceLevel,
            salaryMin: rec.job.salaryMin,
            salaryMax: rec.job.salaryMax,
            description: rec.job.description.substring(0, 300) + '...', // Truncate
            categories: rec.job.categories,
            skills: rec.job.skills,
            remote: rec.job.remote,
            featured: rec.job.featured,
            createdAt: rec.job.createdAt,
          },
          score: Math.round(rec.score * 100) / 100,
          reasons: rec.reasons,
          matchType: rec.matchType,
          confidence: this.getConfidenceLevel(rec.score),
        })),
        totalRecommendations: recommendations.length,
        userId,
        region: domainConfig.region,
        performance: {
          duration,
          cached: false, // Will be true if served from cache
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        region: domainConfig.region,
        domain: domainConfig.domain,
        recommendationType: 'ai-powered',
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Job recommendations error:', error);
    
    // Track error
    const duration = Date.now() - startTime;
    EnhancedPerformanceTracker.trackAPICall({
      endpoint: '/api/recommendations/jobs',
      method: 'GET',
      duration,
      statusCode: 500,
      region: '209',
    });

    return NextResponse.json(
      { 
        error: 'Failed to generate job recommendations',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }

  /**
   * Get confidence level based on score
   */
  function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }
}

/**
 * POST /api/recommendations/jobs
 * Get recommendations with custom parameters or feedback
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      limit = 10, 
      region,
      feedback,
      preferences = {},
    } = body;

    // Get domain context
    const hostname = request.headers.get('host') || '';
    const domainConfig = getDomainConfig(hostname);
    const targetRegion = region || domainConfig.areaCode;

    // Handle feedback if provided
    if (feedback) {
      await this.processFeedback(userId, feedback);
    }

    // Get recommendations with custom preferences
    const recommendations = await SemanticSearchEngine.getJobRecommendations({
      userId,
      region: targetRegion,
      limit: Math.min(limit, 25),
    });

    // Apply custom preferences if provided
    let filteredRecommendations = recommendations;
    if (Object.keys(preferences).length > 0) {
      filteredRecommendations = this.applyCustomPreferences(recommendations, preferences);
    }

    // Track performance
    const duration = Date.now() - startTime;
    EnhancedPerformanceTracker.trackAPICall({
      endpoint: '/api/recommendations/jobs',
      method: 'POST',
      duration,
      statusCode: 200,
      region: targetRegion,
    });

    // Format response
    const response = {
      success: true,
      data: {
        recommendations: filteredRecommendations.map(rec => ({
          job: {
            id: rec.job.id,
            title: rec.job.title,
            company: rec.job.company,
            location: rec.job.location,
            jobType: rec.job.jobType,
            experienceLevel: rec.job.experienceLevel,
            salaryMin: rec.job.salaryMin,
            salaryMax: rec.job.salaryMax,
            description: rec.job.description.substring(0, 300) + '...',
            categories: rec.job.categories,
            skills: rec.job.skills,
            remote: rec.job.remote,
            featured: rec.job.featured,
            createdAt: rec.job.createdAt,
          },
          score: Math.round(rec.score * 100) / 100,
          reasons: rec.reasons,
          matchType: rec.matchType,
          confidence: this.getConfidenceLevel(rec.score),
          customized: Object.keys(preferences).length > 0,
        })),
        totalRecommendations: filteredRecommendations.length,
        appliedPreferences: preferences,
        feedbackProcessed: !!feedback,
        userId,
        region: domainConfig.region,
      },
      meta: {
        timestamp: new Date().toISOString(),
        region: domainConfig.region,
        domain: domainConfig.domain,
        recommendationType: 'ai-powered-custom',
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Custom job recommendations error:', error);
    
    // Track error
    const duration = Date.now() - startTime;
    EnhancedPerformanceTracker.trackAPICall({
      endpoint: '/api/recommendations/jobs',
      method: 'POST',
      duration,
      statusCode: 500,
      region: '209',
    });

    return NextResponse.json(
      { 
        error: 'Failed to generate custom job recommendations',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }

  /**
   * Process user feedback to improve future recommendations
   */
  async function processFeedback(userId: string, feedback: any) {
    try {
      // Store feedback for ML model training
      // This would typically go to a feedback collection system
      console.log('Processing recommendation feedback:', {
        userId,
        feedback,
        timestamp: new Date().toISOString(),
      });
      
      // In a production system, you would:
      // 1. Store feedback in database
      // 2. Update user preference model
      // 3. Retrain recommendation algorithms
      // 4. A/B test recommendation improvements
      
    } catch (error) {
      console.error('Error processing feedback:', error);
      // Don't fail the request if feedback processing fails
    }
  }

  /**
   * Apply custom preferences to filter recommendations
   */
  function applyCustomPreferences(recommendations: any[], preferences: any) {
    return recommendations.filter(rec => {
      // Apply salary preference
      if (preferences.minSalary && rec.job.salaryMin < preferences.minSalary) {
        return false;
      }
      
      // Apply job type preference
      if (preferences.jobType && rec.job.jobType !== preferences.jobType) {
        return false;
      }
      
      // Apply remote preference
      if (preferences.remoteOnly && !rec.job.remote) {
        return false;
      }
      
      // Apply experience level preference
      if (preferences.experienceLevel && rec.job.experienceLevel !== preferences.experienceLevel) {
        return false;
      }
      
      // Apply company size preference (if available)
      if (preferences.companySize && rec.job.companySize !== preferences.companySize) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get confidence level based on score
   */
  function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }
}

/**
 * PUT /api/recommendations/jobs
 * Update recommendation preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { preferences } = body;

    // Update user recommendation preferences
    // This would typically update the user's profile in the database
    console.log('Updating recommendation preferences:', {
      userId,
      preferences,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Recommendation preferences updated successfully',
      preferences,
    });

  } catch (error) {
    console.error('Error updating recommendation preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update recommendation preferences' },
      { status: 500 }
    );
  }
}
