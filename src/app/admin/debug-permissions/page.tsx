// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../api/auth/authOptions';
import { getUserPermissions, hasPermission } from '@/lib/rbac/permissions';
import { Permission } from '@/lib/rbac/permissions';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

export const dynamic = 'force-dynamic';

export default async function DebugPermissions() {
  // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works" } }; // Mock session

  if (!session) {
    return <div>Not authenticated</div>;
  }

  const userRole = session.user?.role || 'unknown';
  const userPermissions = getUserPermissions(userRole);
  const hasEmailPermission = true; // TODO: Replace with Clerk permissions

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
