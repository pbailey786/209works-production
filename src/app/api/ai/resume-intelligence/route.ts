import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { ResumeIntelligenceService } from '@/lib/ai/resume-intelligence';
import { z } from 'zod';

// Validation schemas
const analyzeResumeSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters'),
  targetJobTitle: z.string().optional(),
  targetIndustry: z.string().optional(),
});

const optimizeResumeSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters'),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  jobTitle: z.string().min(1, 'Job title is required'),
});

const skillGapSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters'),
  targetJobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  targetJobTitle: z.string().min(1, 'Job title is required'),
});

const resumeInsightsSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters'),
  targetJobs: z.array(z.string()).optional(),
});

const extractSkillsSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters'),
});

// POST /api/ai/resume-intelligence - Analyze and optimize resumes
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
      case 'analyze':
        const analyzeParams = analyzeResumeSchema.parse(params);
        result = await ResumeIntelligenceService.analyzeResume(
          analyzeParams.resumeText,
          analyzeParams.targetJobTitle,
          analyzeParams.targetIndustry
        );
        break;

      case 'optimize':
        const optimizeParams = optimizeResumeSchema.parse(params);
        result = await ResumeIntelligenceService.optimizeResumeForJob(
          optimizeParams.resumeText,
          optimizeParams.jobDescription,
          optimizeParams.jobTitle
        );
        break;

      case 'skill_gaps':
        const skillGapParams = skillGapSchema.parse(params);
        result = await ResumeIntelligenceService.analyzeSkillGaps(
          skillGapParams.resumeText,
          skillGapParams.targetJobDescription,
          skillGapParams.targetJobTitle
        );
        break;

      case 'insights':
        const insightsParams = resumeInsightsSchema.parse(params);
        result = await ResumeIntelligenceService.generateResumeInsights(
          user.id,
          insightsParams.resumeText,
          insightsParams.targetJobs
        );
        break;

      case 'extract_skills':
        const extractParams = extractSkillsSchema.parse(params);
        result = await ResumeIntelligenceService.extractAndEnhanceSkills(
          extractParams.resumeText
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid analysis type' },
          { status: 400 }
        );
    }

    // Log the analysis for analytics
    await prisma.resumeAnalysis.create({
      data: {
        userId: user.id,
        analysisType: type,
        resumeLength: params.resumeText?.length || 0,
        targetJobTitle: params.targetJobTitle || params.jobTitle,
        overallScore: result.overallScore || null,
        createdAt: new Date(),
      },
    }).catch(error => {
      console.error('Failed to log resume analysis:', error);
      // Don't fail the request if logging fails
    });

    return NextResponse.json({
      success: true,
      type,
      analysis: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}

// GET /api/ai/resume-intelligence - Get available analysis types and examples
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const availableAnalyses = [
      {
        type: 'analyze',
        name: 'Resume Analysis',
        description: 'Comprehensive analysis of resume quality, ATS compatibility, and improvement suggestions',
        parameters: {
          resumeText: 'string (required) - Full resume text',
          targetJobTitle: 'string (optional) - Target job title for analysis',
          targetIndustry: 'string (optional) - Target industry for analysis',
        },
        example: {
          type: 'analyze',
          resumeText: 'Your complete resume text here...',
          targetJobTitle: 'Software Engineer',
          targetIndustry: 'Technology',
        },
      },
      {
        type: 'optimize',
        name: 'Resume Optimization',
        description: 'Optimize resume for a specific job posting with ATS improvements and keyword suggestions',
        parameters: {
          resumeText: 'string (required) - Current resume text',
          jobDescription: 'string (required) - Target job description',
          jobTitle: 'string (required) - Target job title',
        },
        example: {
          type: 'optimize',
          resumeText: 'Your current resume text...',
          jobDescription: 'Job posting description...',
          jobTitle: 'Senior Developer',
        },
      },
      {
        type: 'skill_gaps',
        name: 'Skill Gap Analysis',
        description: 'Identify missing skills and provide learning recommendations for target roles',
        parameters: {
          resumeText: 'string (required) - Current resume text',
          targetJobDescription: 'string (required) - Target job description',
          targetJobTitle: 'string (required) - Target job title',
        },
        example: {
          type: 'skill_gaps',
          resumeText: 'Your resume text...',
          targetJobDescription: 'Target job description...',
          targetJobTitle: 'Product Manager',
        },
      },
      {
        type: 'insights',
        name: 'Resume Insights',
        description: 'Generate market position, salary predictions, and career progression insights',
        parameters: {
          resumeText: 'string (required) - Resume text',
          targetJobs: 'array of strings (optional) - Target job IDs for analysis',
        },
        example: {
          type: 'insights',
          resumeText: 'Your resume text...',
          targetJobs: ['job-id-1', 'job-id-2'],
        },
      },
      {
        type: 'extract_skills',
        name: 'Skill Extraction',
        description: 'Extract and categorize skills from resume with enhancement suggestions',
        parameters: {
          resumeText: 'string (required) - Resume text',
        },
        example: {
          type: 'extract_skills',
          resumeText: 'Your resume text...',
        },
      },
    ];

    return NextResponse.json({
      success: true,
      availableAnalyses,
      usage: {
        endpoint: '/api/ai/resume-intelligence',
        method: 'POST',
        description: 'Send analysis requests with the type and required parameters',
        tips: [
          'Ensure resume text is complete and well-formatted for best results',
          'Include target job information for more accurate analysis',
          'Use the optimize feature when applying to specific positions',
          'Regular skill gap analysis helps with career planning',
        ],
      },
      limits: {
        resumeTextMinLength: 50,
        maxRequestsPerHour: 20,
        analysisRetention: '30 days',
      },
    });
  } catch (error) {
    console.error('Error fetching resume intelligence info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis types' },
      { status: 500 }
    );
  }
}
