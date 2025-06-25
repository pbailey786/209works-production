import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['jobseeker', 'employer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    // Update user with role and mark onboarding as completed
    const updatedUser = await prisma.user.upsert({
      where: { email: userEmail },
      update: {
        role,
        onboardingCompleted: true,
      },
      create: {
        id: clerkUser.id,
        email: userEmail,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        passwordHash: 'clerk_managed',
        role,
        onboardingCompleted: true,
      },
    });

    console.log(`✅ Onboarding completed for ${userEmail} as ${role}`);

    return NextResponse.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        onboardingCompleted: updatedUser.onboardingCompleted,
      }
    });

  } catch (error) {
    console.error('❌ Onboarding completion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}