import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import ApplicationsClient from './ApplicationsClient';
import { prisma } from '@/lib/database/prisma';

export default async function ApplicationsPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

  if (!user?.emailAddresses?.[0]?.emailAddress) {
    redirect('/signin?callbackUrl=/profile/applications');
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { email: user?.emailAddresses?.[0]?.emailAddress },
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
