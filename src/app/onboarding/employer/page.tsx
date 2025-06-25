import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import EmployerOnboardingClient from './EmployerOnboardingClient';

export default async function EmployerOnboardingPage() {
  const clerkUser = await currentUser();
  
  if (!clerkUser?.emailAddresses[0]?.emailAddress) {
    redirect('/sign-in?redirect_url=/onboarding/employer');
  }
  
  const userEmail = clerkUser.emailAddresses[0].emailAddress;

  // Get user data
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      onboardingCompleted: true,
      companyName: true,
      companyWebsite: true,
      industry: true,
      location: true,
      createdAt: true,
      employerOnboardingCompleted: true,
    },
  });

  if (!user) {
    redirect('/sign-in');
  }

  // Redirect non-employers
  if (user.role !== 'employer') {
    redirect(user.role === 'jobseeker' ? '/onboarding/jobseeker' : '/dashboard');
  }

  // If employer onboarding is already completed, redirect to dashboard
  if ((user as any).employerOnboardingCompleted) {
    redirect('/employers/dashboard');
  }

  return <EmployerOnboardingClient user={user} />;
}
