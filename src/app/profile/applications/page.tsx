import { redirect } from 'next/navigation';
import { auth as getServerSession } from "@/auth";
import { prisma } from '@/lib/database/prisma';
import ApplicationsClient from './ApplicationsClient';
import type { Session } from 'next-auth';

export default async function ApplicationsPage() {
  const session = await getServerSession() as Session | null;

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
