import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma';

// Validation schema for onboarding data
const onboardingSchema = z.object({
  // Basic profile info - make these optional to handle partial submissions
  name: z.string().min(1, 'Name is required').max(100).optional(),
  currentJobTitle: z.string().optional(),
  location: z.string().min(1, 'Location is required').max(200).optional(),
  phoneNumber: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),

  // Job seeker specific
  skills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  preferredJobTypes: z.array(z.string()).optional(),
  openToRemote: z.boolean().optional(),
  expectedSalaryMin: z.number().optional(),
  expectedSalaryMax: z.number().optional(),

  // Employer specific - make these more flexible for validation
  companyName: z.string().optional(),
  companyWebsite: z.string().optional().refine(
    (val) => !val || val === '' || z.string().url().safeParse(val).success,
    { message: 'Must be a valid URL or empty' }
  ),
  industry: z.string().optional(),
  companySize: z.string().optional(),

  // Onboarding tracking
  onboardingCompleted: z.boolean().default(true),
  completedSteps: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Onboarding API called');
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user?.emailAddresses?.[0]?.emailAddress) {
      console.log('❌ No session or email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Session found for:', session.user.email);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true },
    });

    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ User found:', { id: user.id, role: user.role, name: user.name });

    const body = await req.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));

    // Validate the data with detailed error logging
    const validationResult = onboardingSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('❌ Validation failed:', validationResult.error.errors);
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    console.log('✅ Data validated successfully:', JSON.stringify(validatedData, null, 2));

    // Update user profile with onboarding data - only update fields that are provided
    const updateData: any = {
      onboardingCompleted: validatedData.onboardingCompleted,
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.location) updateData.location = validatedData.location;
    if (validatedData.phoneNumber !== undefined) updateData.phoneNumber = validatedData.phoneNumber || null;
    if (validatedData.linkedinUrl !== undefined) updateData.linkedinUrl = validatedData.linkedinUrl || null;
    if (validatedData.currentJobTitle !== undefined) updateData.currentJobTitle = validatedData.currentJobTitle || null;

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

    console.log('📝 Update data:', updateData);

    // Update user in database
    console.log('🔄 Attempting to update user with data:', JSON.stringify(updateData, null, 2));

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
        companySize: true,
        companyWebsite: true,
      },
    });

    console.log('✅ User updated successfully:', updatedUser.id);

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
    console.error('💥 Onboarding error:', error);

    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation error:', error.errors);
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        },
        { status: 400 }
      );
    }

    // Check for Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const errorMessage = 'message' in error && typeof error.message === 'string' ? error.message : 'Unknown database error';
      console.error('❌ Database error:', { code: error.code, message: errorMessage });
      return NextResponse.json(
        {
          error: 'Database error occurred. Please try again.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }

    // Handle general errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        error: 'Failed to complete onboarding. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check onboarding status
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: user?.emailAddresses?.[0]?.emailAddress },
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
