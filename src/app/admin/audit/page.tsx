import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasPermission, Permission } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';


export default async function AuditLogsPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

  // Check authentication and permissions
  if (!user) {
    redirect('/signin?redirect=/admin/audit');
  }

  const userRole = user?.role || 'guest';
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
