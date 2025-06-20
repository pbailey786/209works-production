import { redirect } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';
import EmployerOnboardingClient from './EmployerOnboardingClient';

export default async function EmployerOnboardingPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

  if (!user?.email) {
    redirect('/signin?callbackUrl=/onboarding/employer');
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
      companyName: true,
      companyWebsite: true,
      industry: true,
      location: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect('/signin');
  }

  // Redirect non-employers
  if (user.role !== 'employer') {
    redirect(user.role === 'jobseeker' ? '/onboarding/jobseeker' : '/dashboard');
  }

  // If onboarding is already completed, redirect to dashboard
  if (user.onboardingCompleted) {
    redirect('/employers/dashboard');
  }

  return <EmployerOnboardingClient user={user} />;
}
