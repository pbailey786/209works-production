import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '../../api/auth/authOptions';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import AuditLogsDashboard from '@/components/admin/AuditLogsDashboard';
import type { Session } from 'next-auth';

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions) as Session | null;

  // Check authentication and permissions
  if (!session) {
    redirect('/signin?redirect=/admin/audit');
  }

  const userRole = session!.user?.role || 'guest';
  if (!hasPermission(userRole, Permission.VIEW_AUDIT_LOGS)) {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Review all admin actions and system events with detailed logging
        </p>
      </div>

      {/* Audit Logs Dashboard */}
      <AuditLogsDashboard />
    </div>
  );
}
