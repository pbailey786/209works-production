import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect('/sign-in?redirect_url=/onboarding');
  }

  // Try to sync user or get existing user
  const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
  if (!userEmail) {
    redirect('/sign-in');
  }

  // Get or create user data
  let user = await prisma.user.findUnique({
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

  // If user doesn't exist, create them with no role (will trigger role selection)
  if (!user) {
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
  }

  // If onboarding is already completed, redirect to dashboard
  if (user.onboardingCompleted) {
    redirect(user.role === 'employer' ? '/employers/dashboard' : '/dashboard');
  }

  return <OnboardingClient user={user} clerkUserId={clerkUser.id} />;
}
