import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { getJobMatchScore } from '@/lib/matching';
import { ShouldIApplyAnalysisService } from '@/lib/llm/shouldIApplyAnalysis';
import { JobAnalysisInput } from '@/lib/prompts/shouldIApply';
import { z } from 'zod';
import type { Session } from 'next-auth';

const shouldIApplySchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
});

export async function POST(req: NextRequest) {
  try {
    console.log('🤔 Should I Apply API called');
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'jobseeker') {
      console.log('❌ User is not a job seeker');
      return NextResponse.json({ error: 'This feature is only available for job seekers' }, { status: 403 });
    }

    const body = await req.json();
    const validationResult = shouldIApplySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    const { jobId } = validationResult.data;

    // Check if user has completed onboarding and has a profile
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({
        error: 'Profile required',
        message: 'Please complete your profile first to get personalized job recommendations.',
        redirectTo: '/onboarding/jobseeker',
      }, { status: 400 });
    }

    // Get job details for AI analysis
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        company: true,
        description: true,
        location: true,
        requirements: true,
        benefits: true,
        salaryMin: true,
        salaryMax: true,
        skills: true,
        jobType: true,
      },
    });

    if (!job) {
      return NextResponse.json({
        error: 'Job not found',
      }, { status: 404 });
    }

    // Prepare input for AI analysis
    const analysisInput: JobAnalysisInput = {
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        description: job.description,
        location: job.location,
        requirements: job.requirements || undefined,
        benefits: job.benefits || undefined,
        salaryMin: job.salaryMin || undefined,
        salaryMax: job.salaryMax || undefined,
        skills: job.skills || [],
        jobType: job.jobType,
      },
      profile: {
        skills: profile.skills || [],
        experience: profile.careerGoal || undefined,
        careerGoal: profile.careerGoal || undefined,
        jobTypes: profile.jobTypes || [],
        location: profile.zipCode || undefined,
        availabilityDays: profile.availabilityDays || [],
        availabilityShifts: profile.availabilityShifts || [],
      },
    };

    // Get AI-powered analysis
    const aiAnalysis = await ShouldIApplyAnalysisService.analyzeJobFit(analysisInput);

    // Convert to legacy format for backward compatibility
    const legacyResult = ShouldIApplyAnalysisService.convertToLegacyFormat(aiAnalysis);

    // Log usage for analytics
    try {
      await prisma.shouldIApplyUsage.create({
        data: {
          userId: user.id,
          jobId: jobId,
          userTier: 'free', // You can expand this based on user subscription
          analysisType: 'enhanced', // Updated to reflect AI analysis
          usedAt: new Date(),
        },
      });
    } catch (logError) {
      console.error('Failed to log Should I Apply usage:', logError);
      // Don't fail the request if logging fails
    }

    // Return enhanced AI analysis with backward compatibility
    return NextResponse.json({
      ...legacyResult,
      // Enhanced fields from AI analysis
      aiAnalysis: {
        matchScore: aiAnalysis.matchScore,
        summary: aiAnalysis.summary,
        strengths: aiAnalysis.strengths,
        skillGaps: aiAnalysis.skillGaps,
        advice: aiAnalysis.advice,
        localInsights: aiAnalysis.localInsights,
      },
    });
  } catch (error) {
    console.error('Should I Apply error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze job match',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}






