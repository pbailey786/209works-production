'use client';

import { ReactNode } from '@/components/ui/card';
import { Permission } from '@/components/ui/card';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  role?: string;
}

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  role,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, userRole } =
    usePermissions();

  // Check role-based access if role is specified
  if (role && userRole !== role && userRole !== 'admin') {
    return <>{fallback}</>;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Convenience components for common permission patterns
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate role="admin" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function ModeratorOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate
      permissions={[Permission.VIEW_MODERATION_QUEUE, Permission.MODERATE_JOBS]}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

export function AnalystOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate
      permission={Permission.VIEW_DETAILED_ANALYTICS}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}
