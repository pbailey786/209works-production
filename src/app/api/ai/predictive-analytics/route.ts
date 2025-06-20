import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { PredictiveAnalyticsService } from '@/lib/ai/predictive-analytics';
import { z } from 'zod';

// Validation schemas
const hiringSuccessSchema = z.object({
  jobId: z.string().uuid(),
  candidateId: z.string().uuid(),
});

const salaryTrendsSchema = z.object({
  jobTitle: z.string().min(1),
  location: z.string().min(1),
  timeframe: z.enum(['3months', '6months', '1year']).default('6months'),
});

const careerProgressionSchema = z.object({
  userId: z.string().uuid(),
});

const marketDemandSchema = z.object({
  skill: z.string().min(1),
  location: z.string().min(1),
  timeframe: z.enum(['3months', '6months', '1year']).default('6months'),
});

// POST /api/ai/predictive-analytics - Generate various predictions
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
    const { type, ...params } = body;

    let result;

    switch (type) {
      case 'hiring_success':
        // Only employers and admins can predict hiring success
        if (user.role !== 'employer' && user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
        
        const hiringParams = hiringSuccessSchema.parse(params);
        result = await PredictiveAnalyticsService.predictHiringSuccess(
          hiringParams.jobId,
          hiringParams.candidateId
        );
        break;

      case 'salary_trends':
        const salaryParams = salaryTrendsSchema.parse(params);
        result = await PredictiveAnalyticsService.predictSalaryTrends(
          salaryParams.jobTitle,
          salaryParams.location,
          salaryParams.timeframe
        );
        break;

      case 'career_progression':
        const careerParams = careerProgressionSchema.parse(params);
        
        // Users can only get their own career progression
        if (careerParams.userId !== user.id && user.role !== 'admin') {
          return NextResponse.json(
            { error: 'Can only access your own career progression' },
            { status: 403 }
          );
        }
        
        result = await PredictiveAnalyticsService.predictCareerProgression(careerParams.userId);
        break;

      case 'market_demand':
        const demandParams = marketDemandSchema.parse(params);
        result = await PredictiveAnalyticsService.predictMarketDemand(
          demandParams.skill,
          demandParams.location,
          demandParams.timeframe
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid prediction type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      prediction: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating prediction:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}

// GET /api/ai/predictive-analytics - Get available prediction types and examples
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role to determine available predictions
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

    const availablePredictions = [
      {
        type: 'salary_trends',
        name: 'Salary Trend Prediction',
        description: 'Predict salary trends for specific roles and locations',
        parameters: {
          jobTitle: 'string (required)',
          location: 'string (required)',
          timeframe: 'enum: 3months, 6months, 1year (optional, default: 6months)',
        },
        example: {
          type: 'salary_trends',
          jobTitle: 'Software Engineer',
          location: 'Stockton, CA',
          timeframe: '6months',
        },
      },
      {
        type: 'career_progression',
        name: 'Career Progression Prediction',
        description: 'Predict career advancement opportunities and skill requirements',
        parameters: {
          userId: 'string (required) - your user ID',
        },
        example: {
          type: 'career_progression',
          userId: user.id,
        },
      },
      {
        type: 'market_demand',
        name: 'Market Demand Prediction',
        description: 'Predict demand trends for specific skills in the job market',
        parameters: {
          skill: 'string (required)',
          location: 'string (required)',
          timeframe: 'enum: 3months, 6months, 1year (optional, default: 6months)',
        },
        example: {
          type: 'market_demand',
          skill: 'React',
          location: 'Modesto, CA',
          timeframe: '1year',
        },
      },
    ];

    // Add employer/admin-only predictions
    if (user.role === 'employer' || user.role === 'admin') {
      availablePredictions.push({
        type: 'hiring_success',
        name: 'Hiring Success Prediction',
        description: 'Predict the likelihood of successful hiring for job-candidate pairs',
        parameters: {
          jobId: 'string (required) - UUID of the job',
          candidateId: 'string (required) - UUID of the candidate',
        },
        example: {
          type: 'hiring_success',
          jobId: 'example-job-uuid',
          candidateId: 'example-candidate-uuid',
        },
      });
    }

    return NextResponse.json({
      success: true,
      availablePredictions,
      userRole: user.role,
      usage: {
        endpoint: '/api/ai/predictive-analytics',
        method: 'POST',
        description: 'Send prediction requests with the type and required parameters',
      },
    });
  } catch (error) {
    console.error('Error fetching prediction types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prediction types' },
      { status: 500 }
    );
  }
}
