import { auth as getServerSession } from "@/auth";
import { getUserPermissions, hasPermission } from '@/lib/rbac/permissions';
import { Permission } from '@/lib/rbac/permissions';
import type { Session } from 'next-auth';

export const dynamic = 'force-dynamic';

export default async function DebugPermissions() {
  const session = await getServerSession() as Session | null;

  if (!session) {
    return <div>Not authenticated</div>;
  }

  const userRole = session.user?.role || 'unknown';
  const userPermissions = getUserPermissions(userRole);
  const hasEmailPermission = hasPermission(userRole, Permission.MANAGE_EMAIL_TEMPLATES);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Permissions</h1>
      
      <div className="space-y-4">
        <div>
          <strong>User Email:</strong> {session.user?.email}
        </div>
        
        <div>
          <strong>User Role:</strong> {userRole}
        </div>
        
        <div>
          <strong>Has Email Management Permission:</strong> {hasEmailPermission ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>All User Permissions:</strong>
          <ul className="list-disc list-inside mt-2">
            {userPermissions.map((permission) => (
              <li key={permission}>{permission}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <strong>Required Permission for Email:</strong> {Permission.MANAGE_EMAIL_TEMPLATES}
        </div>
      </div>
    </div>
  );
}
