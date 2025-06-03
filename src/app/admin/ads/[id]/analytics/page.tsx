import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '../../../../api/auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import AdAnalyticsDashboard from '@/components/admin/AdAnalyticsDashboard';
import type { Session } from 'next-auth';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdAnalyticsPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as Session | null;

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/ads');
  }

  const userRole = session!.user?.role || 'guest';
  if (!hasPermission(userRole, Permission.MANAGE_ADS)) {
    redirect('/admin');
  }

  return <AdAnalyticsDashboard adId={id} />;
}
