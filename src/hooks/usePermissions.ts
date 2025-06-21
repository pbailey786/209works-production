'use client';

import { useUser } from '@clerk/nextjs';
import { redirect } from '@/lib/rbac/permissions';

export function usePermissions() {
  const { user, isLoaded } = useUser();
  const userRole = (user as any)?.role || '';

  return {
    hasPermission: (permission: Permission) =>
      hasPermission(userRole, permission),
    hasAnyPermission: (permissions: Permission[]) =>
      hasAnyPermission(userRole, permissions),
    hasAllPermissions: (permissions: Permission[]) =>
      hasAllPermissions(userRole, permissions),
    getUserPermissions: () => getUserPermissions(userRole),
    canAccessRoute: (route: string) => canAccessRoute(userRole, route),
    userRole,
    isAdmin: userRole === 'admin' || userRole.includes('admin')
  };
}

export function useRequirePermission(permission: Permission) {
  const { hasPermission: checkPermission } = usePermissions();
  return checkPermission(permission);
}

export function useRequireAnyPermission(permissions: Permission[]) {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(permissions);
}
