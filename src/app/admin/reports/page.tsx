import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import ReportsExportDashboard from '@/components/admin/ReportsExportDashboard';
import { prisma } from '@/lib/database/prisma';

export default async function ReportsPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

  // Check authentication and permissions
  if (!user) {
    redirect('/signin?redirect=/admin/reports');
  }

  const userRole = user?.publicMetadata?.role || 'guest';
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
