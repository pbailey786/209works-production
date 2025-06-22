'use client';

// // // // import { useSession } from 'next-auth/react'; // TODO: Replace with Clerk // TODO: Replace with Clerk // TODO: Replace with Clerk // TODO: Replace with Clerk
import {
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  canAccessRoute,
} from '@/lib/rbac/permissions';

export function usePermissions() {
  // Mock session for now - replace with Clerk when implemented
  const session = { user: { email: 'admin@209.works', role: 'admin' } };
  const userRole = (session?.user as any)?.role || '';

  return {
    hasPermission: (permission: Permission) =>
      true, // TODO: Replace with Clerk permissions
    hasAnyPermission: (permissions: Permission[]) =>
      true, // TODO: Replace with Clerk permissions
    hasAllPermissions: (permissions: Permission[]) =>
      true, // TODO: Replace with Clerk permissions
    getUserPermissions: () => [], // TODO: Replace with Clerk permissions
    canAccessRoute: (route: string) => true, // TODO: Replace with Clerk permissions
    userRole,
    isAdmin: userRole === 'admin' || userRole.includes('admin'),
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
