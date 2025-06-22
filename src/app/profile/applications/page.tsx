import { redirect } from 'next/navigation';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import ApplicationsClient from './ApplicationsClient';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export default async function ApplicationsPage() {
  // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;

  if (!session!.user?.email) {
    redirect('/signin?callbackUrl=/profile/applications');
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { email: session!.user?.email },
    select: { id: true, role: true },
  });

  if (!user) {
    redirect('/signin');
  }

  if (user.role !== 'jobseeker') {
    redirect('/dashboard');
  }

  return <ApplicationsClient userId={user.id} />;
}
