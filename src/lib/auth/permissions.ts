// Permission system for role-based access control

export enum Permission {
  // User management
  VIEW_USERS = 'view_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  MANAGE_USER_ROLES = 'manage_user_roles',

  // Job management
  VIEW_ALL_JOBS = 'view_all_jobs',
  EDIT_ALL_JOBS = 'edit_all_jobs',
  DELETE_ALL_JOBS = 'delete_all_jobs',
  MODERATE_JOBS = 'moderate_jobs',

  // Content moderation
  VIEW_REPORTS = 'view_reports',
  MODERATE_CONTENT = 'moderate_content',
  BAN_USERS = 'ban_users',

  // Analytics and admin
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_SYSTEM_LOGS = 'view_system_logs',
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',

  // Credits and billing
  VIEW_BILLING = 'view_billing',
  MANAGE_CREDITS = 'manage_credits',
  VIEW_PAYMENTS = 'view_payments',

  // API and integrations
  MANAGE_API_KEYS = 'manage_api_keys',
  VIEW_API_USAGE = 'view_api_usage',
}

export type Role = 'admin' | 'moderator' | 'employer' | 'user' | 'guest';

// Define permissions for each role
const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    // Admins have all permissions
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
    Permission.MANAGE_USER_ROLES,
    Permission.VIEW_ALL_JOBS,
    Permission.EDIT_ALL_JOBS,
    Permission.DELETE_ALL_JOBS,
    Permission.MODERATE_JOBS,
    Permission.VIEW_REPORTS,
    Permission.MODERATE_CONTENT,
    Permission.BAN_USERS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_SYSTEM_LOGS,
    Permission.MANAGE_SYSTEM_SETTINGS,
    Permission.VIEW_BILLING,
    Permission.MANAGE_CREDITS,
    Permission.VIEW_PAYMENTS,
    Permission.MANAGE_API_KEYS,
    Permission.VIEW_API_USAGE,
  ],
  moderator: [
    // Moderators can view users and moderate content
    Permission.VIEW_USERS,
    Permission.VIEW_ALL_JOBS,
    Permission.MODERATE_JOBS,
    Permission.VIEW_REPORTS,
    Permission.MODERATE_CONTENT,
    Permission.BAN_USERS,
    Permission.VIEW_ANALYTICS,
  ],
  employer: [
    // Employers can only manage their own content
    // No special permissions - handled at application level
  ],
  user: [
    // Regular users have no special permissions
  ],
  guest: [
    // Guests have no permissions
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if a user (by role) can access an admin route
 */
export function canAccessAdminRoute(role: Role): boolean {
  return hasAnyPermission(role, [
    Permission.VIEW_USERS,
    Permission.VIEW_ALL_JOBS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_REPORTS,
    Permission.MODERATE_CONTENT,
  ]);
}

/**
 * Get user role from Clerk user object or metadata
 */
export function getUserRole(user: any): Role {
  // Check public metadata first
  if (user?.publicMetadata?.role) {
    return user.publicMetadata.role as Role;
  }

  // Check if email indicates admin
  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
  if (email?.includes('admin') || email?.endsWith('@209works.com')) {
    return 'admin';
  }

  // Default to user role
  return 'user';
}

/**
 * Check if user is admin (convenience function)
 */
export function isAdmin(user: any): boolean {
  const role = getUserRole(user);
  return role === 'admin';
}

/**
 * Check if user is employer (convenience function)
 */
export function isEmployer(user: any): boolean {
  const role = getUserRole(user);
  return role === 'employer';
}

/**
 * Middleware helper to check permissions
 */
export function requirePermission(role: Role, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new Error(`Access denied: Missing permission ${permission} for role ${role}`);
  }
}

/**
 * Middleware helper to check admin access
 */
export function requireAdmin(role: Role) {
  if (role !== 'admin') {
    throw new Error('Access denied: Admin role required');
  }
}
