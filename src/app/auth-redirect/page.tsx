import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

// This page handles post-authentication redirects and ensures proper onboarding
export const dynamic = 'force-dynamic';

export default async function AuthRedirectPage() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      redirect('/sign-in');
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      redirect('/sign-in');
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        onboardingCompleted: true,
        employerOnboardingCompleted: true,
        role: true,
      },
    });

    // If user doesn't exist, create them
    if (!user) {
      console.log('🆕 Creating new user from auth redirect:', userEmail);
      user = await prisma.user.create({
        data: {
          id: clerkUser.id,
          email: userEmail,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
          passwordHash: 'clerk_managed',
          role: 'jobseeker',
          onboardingCompleted: false,
        },
        select: {
          id: true,
          onboardingCompleted: true,
          employerOnboardingCompleted: true,
          role: true,
        },
      });
    }

    // Check onboarding status and redirect accordingly
    console.log('✅ Checking onboarding for user:', userEmail, 'role:', user.role, 'onboarding:', user.onboardingCompleted);
    
    // If user hasn't completed basic onboarding, send to role selection
    if (!user.onboardingCompleted) {
      console.log('→ Redirecting to onboarding (role selection)');
      redirect('/onboarding');
    }
    
    // For employers, check employer-specific onboarding
    if (user.role === 'employer' && !user.employerOnboardingCompleted) {
      console.log('→ Redirecting to employer onboarding');
      redirect('/onboarding/employer');
    }
    
    // Otherwise, redirect to appropriate dashboard
    console.log('→ Redirecting to dashboard');
    if (user.role === 'employer') {
      redirect('/employers/dashboard');
    } else {
      redirect('/dashboard');
    }
  } catch (error) {
    console.error('❌ Auth redirect error:', error);
    redirect('/sign-in');
  }
}