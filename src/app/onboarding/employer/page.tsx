import { redirect } from 'next/navigation';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import EmployerOnboardingClient from './EmployerOnboardingClient';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export default async function EmployerOnboardingPage() {
  // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;

  if (!session?.user?.email) {
    redirect('/signin?callbackUrl=/onboarding/employer');
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
