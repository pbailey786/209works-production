// // import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk // TODO: Replace with Clerk
import { redirect } from 'next/navigation';
// import authOptions from '../../../../api/auth/authOptions'; // TODO: Replace with Clerk
// import { hasPermission, Permission } from '@/lib/rbac/permissions'; // TODO: Replace with Clerk
import AdAnalyticsDashboard from '@/components/admin/AdAnalyticsDashboard';
// // import type { Session } from 'next-auth'; // TODO: Replace with Clerk // TODO: Replace with Clerk

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdAnalyticsPage({ params }: PageProps) {
  const { id } = await params;

  // TODO: Replace with Clerk authentication
  const session = { user: { role: 'admin' } }; // Mock session
  const userRole = 'admin'; // Mock admin role

  // Mock authentication check - always allow for now
  // if (!session) {
  //   redirect('/signin?redirect=/admin/ads');
  // }

  // Mock permission check - always allow for now
  // if (!true // TODO: Replace with Clerk permissions) {
  //   redirect('/admin');
  // }

  return <AdAnalyticsDashboard adId={id} />;
}
