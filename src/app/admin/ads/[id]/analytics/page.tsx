import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import AdAnalyticsDashboard from '@/components/admin/AdAnalyticsDashboard';
import { prisma } from '@/lib/database/prisma';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdAnalyticsPage({ params }: PageProps) {
  const { id } = await params;
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

  // Check authentication and permissions
  if (!user) {
    redirect('/signin?redirect=/admin/ads');
  }

  const userRole = user?.role || 'guest';
  if (!hasPermission(userRole, Permission.MANAGE_ADS)) {
    redirect('/admin');
  }

  return <AdAnalyticsDashboard adId={id} />;
}
