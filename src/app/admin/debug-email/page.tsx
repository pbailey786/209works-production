'use client';

import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/rbac/permissions';


export default function DebugEmailPage() {
  const { user, isLoaded } = useUser();
  const { hasPermission, userRole, getUserPermissions } = usePermissions();

  const emailPermission = hasPermission(Permission.MANAGE_EMAIL_TEMPLATES);
  const allPermissions = getUserPermissions();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Email Permission Debug</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold">User Info</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold">User Role</h2>
          <p className="text-lg">{userRole || 'No role'}</p>
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold">Email Permission Check</h2>
          <p className="text-lg">
            MANAGE_EMAIL_TEMPLATES: {emailPermission ? '✅ YES' : '❌ NO'}
          </p>
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold">All User Permissions</h2>
          <div className="text-sm bg-gray-100 p-2 rounded mt-2 max-h-40 overflow-y-auto">
            {allPermissions.length > 0 ? (
              <ul>
                {allPermissions.map(permission => (
                  <li key={permission} className="py-1">
                    {permission}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No permissions found</p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold">Direct Links</h2>
          <div className="space-y-2">
            <a href="/admin/email" className="block text-blue-600 hover:underline">
              /admin/email
            </a>
            <a href="/admin/email/templates" className="block text-blue-600 hover:underline">
              /admin/email/templates
            </a>
            <a href="/admin/email/test" className="block text-blue-600 hover:underline">
              /admin/email/test
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
