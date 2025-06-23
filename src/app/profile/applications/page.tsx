import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import ApplicationsClient from './ApplicationsClient';

// Disable static generation for this authenticated page
export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  // Check authentication with Clerk
  const clerkUser = await currentUser();
  if (!clerkUser?.emailAddresses[0]?.emailAddress) {
    redirect('/sign-in?redirect_url=/profile/applications');
  }

  const userEmail = clerkUser.emailAddresses[0].emailAddress;

  // Get user data
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true, role: true },
  });

  if (!user) {
    redirect('/sign-in');
  }

  if (user.role !== 'jobseeker') {
    redirect('/dashboard');
  }

  return <ApplicationsClient userId={user.id} />;
}
