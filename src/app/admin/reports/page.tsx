// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import { redirect } from 'next/navigation';
import authOptions from '../../api/auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import ReportsExportDashboard from '@/components/admin/ReportsExportDashboard';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export default async function ReportsPage() {
  // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/reports');
  }

  const userRole = session!.user?.role || 'guest';
  // TODO: Replace with Clerk permissions
  // if (!hasPermission(userRole, Permission.MANAGE_ADS)) {
  //   redirect('/admin');
  // }

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
