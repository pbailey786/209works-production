import { redirect } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';
import ApplicationsClient from './ApplicationsClient';

export default async function ApplicationsPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

  if (!user?.email) {
    redirect('/signin?callbackUrl=/profile/applications');
  }

  // Get user data
  const dbUser = await prisma.user.findUnique({
    where: { email: user?.email },
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
