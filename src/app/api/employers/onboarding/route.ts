import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import type { Session } from 'next-auth';

// Validation schema for onboarding data
const onboardingSchema = z.object({
  // Step 1: Company Profile & Branding
  companyLogo: z.string().optional(),
  companyName: z.string().min(1, 'Company name is required').max(200),
  companyWebsite: z.string().url('Please enter a valid website URL').max(500),
  companyDescription: z.string().min(1, 'Company description is required').max(1000),
  industry: z.string().min(1, 'Industry selection is required').max(100),

  // Step 2: Hiring Preferences
  hiringPlans: z.string().min(1, 'Hiring plans selection is required').max(100),
  typicallyRequiresDegree: z.boolean(),
  offersRemoteWork: z.boolean(),
  preferredExperienceLevel: z.string().min(1, 'Experience level preference is required').max(100),
});

// POST /api/employers/onboarding - Complete employer onboarding
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json(
        { error: 'Authentication required. Only employers can complete onboarding.' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = onboardingSchema.parse(body);

    // Update user with onboarding data
    const updatedUser = await prisma.user.update({
      where: { id: (session!.user as any).id },
      data: {
        // Company Profile & Branding
        companyLogo: validatedData.companyLogo,
        companyName: validatedData.companyName,
        companyWebsite: validatedData.companyWebsite,
        companyDescription: validatedData.companyDescription,
        industry: validatedData.industry,

        // Hiring Preferences
        hiringPlans: validatedData.hiringPlans,
        typicallyRequiresDegree: validatedData.typicallyRequiresDegree,
        offersRemoteWork: validatedData.offersRemoteWork,
        preferredExperienceLevel: validatedData.preferredExperienceLevel,

        // Mark onboarding as completed
        employerOnboardingCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully!',
      user: {
        id: updatedUser.id,
        companyName: updatedUser.companyName,
        industry: updatedUser.industry,
        employerOnboardingCompleted: updatedUser.employerOnboardingCompleted,
      },
    });
  } catch (error) {
    console.error('Employer onboarding error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid onboarding data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to complete onboarding. Please try again.' },
      { status: 500 }
    );
  }
}

// GET /api/employers/onboarding - Get current onboarding status
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json(
        { error: 'Authentication required. Only employers can access onboarding status.' },
        { status: 401 }
      );
    }

    // Get user's current onboarding data
    const user = await prisma.user.findUnique({
      where: { id: (session!.user as any).id },
      select: {
        id: true,
        companyName: true,
        companyWebsite: true,
        companyDescription: true,
        industry: true,
        hiringPlans: true,
        typicallyRequiresDegree: true,
        offersRemoteWork: true,
        preferredExperienceLevel: true,
        employerOnboardingCompleted: true,
        companyLogo: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      onboardingCompleted: user.employerOnboardingCompleted,
      data: {
        companyLogo: user.companyLogo,
        companyName: user.companyName || '',
        companyWebsite: user.companyWebsite || '',
        companyDescription: user.companyDescription || '',
        industry: user.industry || '',
        hiringPlans: user.hiringPlans || '',
        typicallyRequiresDegree: user.typicallyRequiresDegree || false,
        offersRemoteWork: user.offersRemoteWork || false,
        preferredExperienceLevel: user.preferredExperienceLevel || '',
      },
    });
  } catch (error) {
    console.error('Get onboarding status error:', error);
    return NextResponse.json(
      { error: 'Failed to get onboarding status' },
      { status: 500 }
    );
  }
}
