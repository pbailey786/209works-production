import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import authOptions from '../../../../api/auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import AdAnalyticsDashboard from '@/components/admin/AdAnalyticsDashboard';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdAnalyticsPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/ads');
  }

  const userRole = (session.user as any)?.role;
  if (!hasPermission(userRole, Permission.MANAGE_ADS)) {
    redirect('/admin');
  }

  return <AdAnalyticsDashboard adId={id} />;
}
