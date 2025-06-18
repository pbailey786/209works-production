import { redirect } from 'next/navigation';
import { auth as getServerSession } from "@/auth";
import { prisma } from '@/lib/database/prisma';
import OnboardingClient from './OnboardingClient';
import type { Session } from 'next-auth';

export default async function OnboardingPage() {
  const session = await getServerSession() as Session | null;

  if (!session!.user?.email) {
    redirect('/signin?callbackUrl=/onboarding');
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { email: session!.user?.email },
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
