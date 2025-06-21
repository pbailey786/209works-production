import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

  if (!user?.email) {
    redirect('/signin?callbackUrl=/onboarding');
  }

  // Get user data
  const dbUser = await prisma.user.findUnique({
    where: { email: user?.email },
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

  if (!user) {
    redirect('/signin');
  }

  // If onboarding is already completed, redirect to dashboard
  if (user.onboardingCompleted) {
    redirect(user.role === 'employer' ? '/employers/dashboard' : '/dashboard');
  }

  // Redirect to role-specific onboarding
  if (user.role === 'jobseeker') {
    redirect('/onboarding/jobseeker');
  } else if (user.role === 'employer') {
    redirect('/onboarding/employer');
  }

  return <OnboardingClient user={user} />;
}
