import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import authOptions from "../../api/auth/authOptions";
import { hasPermission, Permission } from "@/lib/rbac/permissions";
import SystemHealthDashboard from "@/components/admin/SystemHealthDashboard";

export default async function SystemHealthPage() {
  const session = await getServerSession(authOptions);

  // Check authentication and permissions
  if (!session) {
    redirect("/signin?redirect=/admin/health");
  }

  const userRole = (session.user as any)?.role;
  if (!hasPermission(userRole, Permission.VIEW_SYSTEM_HEALTH)) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health Monitoring</h1>
        <p className="text-muted-foreground">
          Monitor system performance, errors, and uptime in real-time
        </p>
      </div>

      {/* System Health Dashboard */}
      <SystemHealthDashboard />
    </div>
  );
}