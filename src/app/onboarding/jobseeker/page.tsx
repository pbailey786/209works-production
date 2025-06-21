import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import JobSeekerOnboardingClient from './JobSeekerOnboardingClient';

export default async function JobSeekerOnboardingPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

  if (!user?.email) {
    redirect('/signin?callbackUrl=/onboarding/jobseeker');
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
      phoneNumber: true,
      resumeUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect('/signin');
  }

  // Redirect non-job seekers
  if (user.role !== 'jobseeker') {
    redirect(user.role === 'employer' ? '/onboarding/employer' : '/dashboard');
  }

  // If onboarding is already completed, redirect to dashboard
  if (user.onboardingCompleted) {
    redirect('/dashboard');
  }

  return <JobSeekerOnboardingClient user={user} />;
}
