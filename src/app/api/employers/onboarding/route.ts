import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { prisma } from '@/components/ui/card';
import { z } from 'zod';

// Validation schema for onboarding data
const onboardingSchema = z.object({
  // Step 1: Company Info & Contact Person
  companyName: z.string().min(1, 'Company name is required').max(200),
  businessLocation: z.string().min(1, 'Business location is required').max(100),
  industry: z.string().min(1, 'Please tell us what your company does').max(200),
  contactName: z.string().min(1, 'Contact name is required').max(100),
  contactEmail: z.string().email('Please enter a valid email').max(200),
  contactPhone: z.string().max(20).optional(),
  companyLogo: z.string().optional(),

  // Step 2: Hiring Goals
  urgentlyHiring: z.boolean(),
  seasonalHiring: z.boolean(),
  alwaysHiring: z.boolean(),
}).refine(
  (data) => data.urgentlyHiring || data.seasonalHiring || data.alwaysHiring,
  {
    message: 'Please select at least one hiring goal',
    path: ['hiringGoals'],
  }
);

// POST /api/employers/onboarding - Complete employer onboarding
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });
    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json(
        { error: 'Authentication required. Only employers can complete onboarding.' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = onboardingSchema.parse(body);

    // Create hiring goals array for backend analysis
    const hiringGoals = [];
    if (validatedData.urgentlyHiring) hiringGoals.push('urgent');
    if (validatedData.seasonalHiring) hiringGoals.push('seasonal');
    if (validatedData.alwaysHiring) hiringGoals.push('always');

    // Update user with onboarding data
    const updatedUser = await prisma.user.update({
      where: { id: (session!.user as any).id },
      data: {
        // Company Info & Contact Person
        companyName: validatedData.companyName,
        businessLocation: validatedData.businessLocation,
        industry: validatedData.industry,
        contactName: validatedData.contactName,
        contactEmail: validatedData.contactEmail,
        contactPhone: validatedData.contactPhone,
        companyLogo: validatedData.companyLogo,

        // Hiring Goals (store as JSON array)
        hiringGoals: hiringGoals,

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });
    if (!session || !session.user || (session!.user as any).role !== 'employer') {
      return NextResponse.json(
        { error: 'Authentication required. Only employers can access onboarding status.' },
        { status: 401 }
      );
    }

    // Get user's current onboarding data
    const userRecord = await prisma.user.findUnique({
      where: { id: (session!.user as any).id },
      select: {
        id: true,
        companyName: true,
        businessLocation: true,
        industry: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        companyLogo: true,
        hiringGoals: true,
        employerOnboardingCompleted: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse hiring goals from JSON array
    const hiringGoalsArray = Array.isArray(user.hiringGoals) ? user.hiringGoals : [];

    return NextResponse.json({
      success: true,
      onboardingCompleted: user.employerOnboardingCompleted,
      data: {
        companyName: user.companyName || '',
        businessLocation: user.businessLocation || '',
        industry: user.industry || '',
        contactName: user.contactName || '',
        contactEmail: user.contactEmail || '',
        contactPhone: user.contactPhone || '',
        companyLogo: user.companyLogo,
        urgentlyHiring: hiringGoalsArray.includes('urgent'),
        seasonalHiring: hiringGoalsArray.includes('seasonal'),
        alwaysHiring: hiringGoalsArray.includes('always'),
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
