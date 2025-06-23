import { redirect } from 'next/navigation';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import JobSeekerOnboardingClient from './JobSeekerOnboardingClient';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export default async function JobSeekerOnboardingPage() {
  // Skip database operations during build
  if (process.env.NODE_ENV === 'production' && process.env.NETLIFY) {
    const mockUser = {
      id: 'build-mock-id',
      name: 'Mock User',
      email: 'mock@example.com',
      role: 'jobseeker' as const,
      onboardingCompleted: false,
      location: null,
      currentJobTitle: null,
      experienceLevel: null,
      skills: [],
      preferredJobTypes: [],
      phoneNumber: null,
      resumeUrl: null,
      createdAt: new Date(),
    };
    return <JobSeekerOnboardingClient user={mockUser} />;
  }

  // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

  if (!session?.user?.email) {
    redirect('/signin?callbackUrl=/onboarding/jobseeker');
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
