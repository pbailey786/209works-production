import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

// GET - Check onboarding status
export async function GET(request: NextRequest) {
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
        role: true,
        onboardingCompleted: true,
        employerOnboardingCompleted: true,
        companyName: true,
        industry: true,
        location: true,
        employerPreferences: true,
      },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      user,
      isOnboarded: user.employerOnboardingCompleted,
    });
  } catch (error) {
    console.error('Get employer onboarding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - This endpoint redirects to the main profile onboarding API
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Use /api/profile/employer for employer profile updates' 
  }, { status: 301 });
}
