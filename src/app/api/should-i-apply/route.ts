import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { getJobMatchScore } from '@/lib/matching';
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

    // Get match score
    const matchResult = await getJobMatchScore(jobId, user.id);

    if (!matchResult) {
      return NextResponse.json({
        error: 'Job not found or unable to calculate match score',
      }, { status: 404 });
    }

    // Generate recommendation based on score
    let recommendation: 'strong' | 'good' | 'fair' | 'poor';
    let message: string;
    let shouldApply: boolean;

    if (matchResult.score >= 4) {
      recommendation = 'strong';
      message = "You're a strong match for this position! This job aligns well with your skills and preferences.";
      shouldApply = true;
    } else if (matchResult.score >= 3) {
      recommendation = 'good';
      message = "This looks like a good opportunity for you. You meet several of the key requirements.";
      shouldApply = true;
    } else if (matchResult.score >= 2) {
      recommendation = 'fair';
      message = "This could be worth considering. While not a perfect match, you have some relevant qualifications.";
      shouldApply = false;
    } else {
      recommendation = 'poor';
      message = "This position might not be the best fit based on your current profile, but you can still apply if you're interested.";
      shouldApply = false;
    }

    // Log usage for analytics
    try {
      await prisma.shouldIApplyUsage.create({
        data: {
          userId: user.id,
          jobId: jobId,
          userTier: 'free', // You can expand this based on user subscription
          analysisType: 'basic',
          usedAt: new Date(),
        },
      });
    } catch (logError) {
      console.error('Failed to log Should I Apply usage:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      recommendation,
      shouldApply,
      message,
      score: matchResult.score,
      maxScore: 5,
      reasons: matchResult.reasons,
      analysis: {
        matchPercentage: Math.round((matchResult.score / 5) * 100),
        strengthAreas: matchResult.reasons,
        tips: generateApplicationTips(matchResult, profile),
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

function generateApplicationTips(matchResult: any, profile: any): string[] {
  const tips: string[] = [];

  if (matchResult.score >= 4) {
    tips.push("Highlight your relevant skills in your application");
    tips.push("Apply soon - you're a strong candidate for this role");
  } else if (matchResult.score >= 3) {
    tips.push("Emphasize the skills and experience that match the job requirements");
    tips.push("Consider mentioning your willingness to learn new skills");
  } else if (matchResult.score >= 2) {
    tips.push("Focus on transferable skills in your application");
    tips.push("Show enthusiasm for learning and growing in this role");
  } else {
    tips.push("Consider gaining more relevant experience before applying");
    tips.push("Look for similar roles that might be a better match");
  }

  // Career goal specific tips
  if (profile.careerGoal === 'need_job_asap') {
    tips.push("Apply quickly if this meets your immediate needs");
  } else if (profile.careerGoal === 'build_career') {
    tips.push("Ask about growth opportunities during the interview");
  } else if (profile.careerGoal === 'exploring_fields') {
    tips.push("Mention your interest in learning about this industry");
  }

  return tips;
}




