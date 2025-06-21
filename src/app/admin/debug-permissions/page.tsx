import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserPermissions, hasPermission } from '@/components/ui/card';
import { Permission } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

export const dynamic = 'force-dynamic';

export default async function DebugPermissions() {
  const { userId } = await auth();
    if (!userId) {
      redirect('/signin');
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const userRole = user?.role || 'unknown';
  const userPermissions = getUserPermissions(userRole);
  const hasEmailPermission = hasPermission(userRole, Permission.MANAGE_EMAIL_TEMPLATES);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Permissions</h1>
      
      <div className="space-y-4">
        <div>
          <strong>User Email:</strong> {user?.email}
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
