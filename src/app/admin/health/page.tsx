import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasPermission, Permission } from '@/lib/rbac/permissions';
import SystemHealthDashboard from '@/components/admin/SystemHealthDashboard';
import { prisma } from '@/lib/database/prisma';

export default async function SystemHealthPage() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

  // Check authentication and permissions
  if (!user) {
    redirect('/signin?redirect=/admin/health');
  }

  const userRole = user?.publicMetadata?.role || 'guest';
  if (!hasPermission(userRole, Permission.VIEW_SYSTEM_HEALTH)) {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          System Health Monitoring
        </h1>
        <p className="text-muted-foreground">
          Monitor system performance, errors, and uptime in real-time
        </p>
      </div>

      {/* System Health Dashboard */}
      <SystemHealthDashboard />
    </div>
  );
}
