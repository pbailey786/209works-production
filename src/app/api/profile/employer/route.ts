import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

// Validation schema for employer profile data
const employerProfileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100),
  industryType: z.string().min(1, 'Industry type is required'),
  location: z.string().min(1, 'Location is required').max(200),
  businessDescription: z.string().min(1, 'Business description is required').max(500),
});

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Employer profile API called');
    
    // Get current user from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      console.log('❌ No session or email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress;
    console.log('✅ Session found for:', userEmail);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, role: true, name: true },
    });

    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is an employer
    if (user.role !== 'employer' && user.role !== 'admin') {
      console.log('❌ User is not an employer');
      return NextResponse.json({ error: 'Forbidden - Employer access only' }, { status: 403 });
    }

    console.log('✅ Employer user found:', { id: user.id, name: user.name });

    const body = await req.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));

    // Validate the data
    const validationResult = employerProfileSchema.safeParse(body);
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
    console.log('✅ Data validated successfully');

    // Update user profile with employer-specific data
    const updateData = {
      companyName: validatedData.companyName,
      industry: validatedData.industryType,
      location: validatedData.location,
      companyDescription: validatedData.businessDescription,
      updatedAt: new Date(),
    };

    console.log('📝 Updating employer profile...');

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        industry: true,
        location: true,
        companyDescription: true,
      },
    });

    console.log('✅ Employer profile updated successfully');

    // Create or update EmployerProfile if you have a separate model
    // This is where you would handle any additional employer-specific data

    return NextResponse.json({
      success: true,
      message: 'Employer profile updated successfully!',
      user: updatedUser,
    });
  } catch (error) {
    console.error('💥 Employer profile error:', error);

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
        error: 'Failed to update employer profile. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve employer profile
export async function GET(req: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress;

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        industry: true,
        location: true,
        companyDescription: true,
        companyWebsite: true,
        companySize: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is an employer
    if (user.role !== 'employer' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Employer access only' }, { status: 403 });
    }

    // Calculate profile completeness
    const requiredFields = ['companyName', 'industry', 'location'];
    const completedFields = requiredFields.filter(field => {
      const value = user[field as keyof typeof user];
      return value && value !== '';
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
    });
  } catch (error) {
    console.error('Get employer profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get employer profile' },
      { status: 500 }
    );
  }
}