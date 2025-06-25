import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  console.log('🚀 ONBOARDING API CALLED - Starting...');
  
  try {
    console.log('🔍 Getting current user from Clerk...');
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      console.log('❌ No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('✅ Clerk user found:', clerkUser.emailAddresses[0]?.emailAddress);

    console.log('📝 Parsing request body...');
    const body = await request.json();
    const { role } = body;
    console.log('🎯 Role selected:', role);

    if (!role || !['jobseeker', 'employer'].includes(role)) {
      console.log('❌ Invalid role provided:', role);
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      console.log('❌ No email found in Clerk user');
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }
    
    console.log('💾 Updating database for:', userEmail);

    // Update user with role and mark onboarding as completed
    // For employers, don't mark onboarding as complete yet - they need to fill out company info
    const updatedUser = await prisma.user.upsert({
      where: { email: userEmail },
      update: {
        role,
        onboardingCompleted: role === 'jobseeker' ? true : false,
        employerOnboardingCompleted: false, // Always false initially for employers
      },
      create: {
        id: clerkUser.id,
        email: userEmail,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        passwordHash: 'clerk_managed',
        role,
        onboardingCompleted: role === 'jobseeker' ? true : false,
        employerOnboardingCompleted: false,
      },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingCompleted: true,
      },
    });

    console.log(`✅ Database updated! User: ${userEmail}, Role: ${updatedUser.role}, Onboarding: ${updatedUser.onboardingCompleted}`);

    return NextResponse.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        onboardingCompleted: updatedUser.onboardingCompleted,
      }
    });

  } catch (error) {
    console.error('❌ ONBOARDING ERROR - Full details:', error);
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}