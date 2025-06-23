import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import OnboardingClient from './OnboardingClient';

// Disable static generation for this page due to authentication requirements
export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      redirect('/sign-in?redirect_url=/onboarding');
    }

    // Try to sync user or get existing user
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      redirect('/sign-in');
    }

    // Get or create user data (with build-time protection)
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          onboardingCompleted: true,
          location: true,
          currentJobTitle: true,
          experienceLevel: true,
          skills: true,
          preferredJobTypes: true,
          companyWebsite: true,
          companyName: true,
          industry: true,
          createdAt: true,
        },
      });
    } catch (dbError) {
      console.error('Database connection error in onboarding:', dbError);
      // If database is unavailable (like during build), redirect to sign-in
      redirect('/sign-in?redirect_url=/onboarding');
    }

    // If user doesn't exist, create them with no role (will trigger role selection)
    if (!user) {
      try {
        const newUser = await prisma.user.create({
          data: {
            id: clerkUser.id,
            email: userEmail,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
            passwordHash: 'clerk_managed',
            role: 'jobseeker', // Temporary default - will be updated by role selection
            onboardingCompleted: false,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            onboardingCompleted: true,
            location: true,
            currentJobTitle: true,
            experienceLevel: true,
            skills: true,
            preferredJobTypes: true,
            companyWebsite: true,
            companyName: true,
            industry: true,
            createdAt: true,
          },
        });
        user = newUser;
      } catch (createError) {
        console.error('Error creating user in onboarding:', createError);
        redirect('/sign-in?redirect_url=/onboarding');
      }
    }

    // If onboarding is already completed, redirect to dashboard
    if (user.onboardingCompleted) {
      redirect(user.role === 'employer' ? '/employers/dashboard' : '/dashboard');
    }

    return <OnboardingClient user={user} clerkUserId={clerkUser.id} />;
  } catch (error) {
    console.error('Onboarding page error:', error);
    // If there's any error, redirect to sign-in
    redirect('/sign-in?redirect_url=/onboarding');
  }
}
