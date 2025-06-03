import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '../../api/auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import ReportsExportDashboard from '@/components/admin/ReportsExportDashboard';
import type { Session } from 'next-auth';

export default async function ReportsPage() {
  const session = await getServerSession(authOptions) as Session | null;

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/reports');
  }

  const userRole = session.user?.role || 'guest';
  if (!hasPermission(userRole, Permission.EXPORT_REPORTS)) {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Reports</h1>
        <p className="text-muted-foreground">
          Generate and export comprehensive reports on system activity, users,
          jobs, and performance
        </p>
      </div>

      {/* Reports Export Dashboard */}
      <ReportsExportDashboard />
    </div>
  );
}
