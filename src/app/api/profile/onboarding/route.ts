import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import type { Session } from 'next-auth';

// Validation schema for onboarding data
const onboardingSchema = z.object({
  // Basic profile info
  name: z.string().min(1, 'Name is required').max(100),
  currentJobTitle: z.string().optional(),
  location: z.string().min(1, 'Location is required').max(200),
  phoneNumber: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),

  // Job seeker specific
  skills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  preferredJobTypes: z.array(z.string()).optional(),
  openToRemote: z.boolean().optional(),
  expectedSalaryMin: z.number().optional(),
  expectedSalaryMax: z.number().optional(),

  // Employer specific
  companyName: z.string().optional(),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  companySize: z.string().optional(),

  // Onboarding tracking
  onboardingCompleted: z.boolean().default(true),
  completedSteps: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = onboardingSchema.parse(body);

    // Update user profile with onboarding data
    const updateData: any = {
      name: validatedData.name,
      location: validatedData.location,
      phoneNumber: validatedData.phoneNumber || null,
      linkedinUrl: validatedData.linkedinUrl || null,
      currentJobTitle: validatedData.currentJobTitle || null,
      onboardingCompleted: validatedData.onboardingCompleted,
      updatedAt: new Date(),
    };

    // Add role-specific fields
    if (user.role === 'jobseeker') {
      updateData.skills = validatedData.skills || [];
      updateData.experienceLevel = validatedData.experienceLevel || null;
      updateData.preferredJobTypes = validatedData.preferredJobTypes || [];
      updateData.isOpenToRemote = validatedData.openToRemote || false;
      updateData.expectedSalaryMin = validatedData.expectedSalaryMin || null;
      updateData.expectedSalaryMax = validatedData.expectedSalaryMax || null;
    } else if (user.role === 'employer') {
      updateData.companyName = validatedData.companyName || null;
      updateData.companyWebsite = validatedData.companyWebsite || null;
      updateData.industry = validatedData.industry || null;
      updateData.companySize = validatedData.companySize || null;
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboardingCompleted: true,
        location: true,
        currentJobTitle: true,
        skills: true,
        experienceLevel: true,
        preferredJobTypes: true,
        companyName: true,
        industry: true,
      },
    });

    // Log onboarding completion for debugging
    console.log(
      `✅ Onboarding completed for user ${user.id} (${user.role}) with steps:`,
      validatedData.completedSteps
    );

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully!',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Onboarding error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
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

// GET endpoint to check onboarding status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        role: true,
        onboardingCompleted: true,
        location: true,
        currentJobTitle: true,
        skills: true,
        experienceLevel: true,
        preferredJobTypes: true,
        companyName: true,
        industry: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate profile completeness
    const requiredFields =
      user.role === 'jobseeker'
        ? ['name', 'location', 'currentJobTitle', 'skills']
        : ['name', 'location', 'companyName', 'industry'];

    const completedFields = requiredFields.filter(field => {
      const value = user[field as keyof typeof user];
      return value && (Array.isArray(value) ? value.length > 0 : true);
    });

    const profileCompleteness = Math.round(
      (completedFields.length / requiredFields.length) * 100
    );

    return NextResponse.json({
      user,
      profileCompleteness,
      missingFields: requiredFields.filter(
        field => !completedFields.includes(field)
      ),
      isNewUser:
        !user.onboardingCompleted &&
        new Date().getTime() - new Date(user.createdAt).getTime() <
          24 * 60 * 60 * 1000, // Less than 24 hours old
    });
  } catch (error) {
    console.error('Get onboarding status error:', error);
    return NextResponse.json(
      { error: 'Failed to get onboarding status' },
      { status: 500 }
    );
  }
}
