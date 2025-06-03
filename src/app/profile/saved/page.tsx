import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import SavedJobsClient from './SavedJobsClient';
import type { Session } from 'next-auth';

export default async function SavedJobsPage() {
  const session = await getServerSession(authOptions) as Session | null;

  if (!session?.user?.email) {
    redirect('/signin?callbackUrl=/profile/saved');
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user) {
    redirect('/signin');
  }

  if (user.role !== 'jobseeker') {
    redirect('/dashboard');
  }

  return <SavedJobsClient userId={user.id} />;
}
