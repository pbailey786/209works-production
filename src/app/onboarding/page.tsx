import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/signin?callbackUrl=/onboarding');
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
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

  return <OnboardingClient user={user} />;
}
