/**
 * Authentication and Authorization Types
 */

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT'
}

export enum Permission {
  // User Management
  VIEW_USERS = 'VIEW_USERS',
  EDIT_USERS = 'EDIT_USERS',
  DELETE_USERS = 'DELETE_USERS',
  IMPERSONATE_USERS = 'IMPERSONATE_USERS',
  
  // Job Management
  VIEW_JOBS = 'VIEW_JOBS',
  EDIT_JOBS = 'EDIT_JOBS',
  DELETE_JOBS = 'DELETE_JOBS',
  MODERATE_JOBS = 'MODERATE_JOBS',
  BULK_MODERATE_JOBS = 'BULK_MODERATE_JOBS',
  
  // Analytics & Reports
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  VIEW_FINANCIAL_DATA = 'VIEW_FINANCIAL_DATA',
  
  // System Administration
  MANAGE_ROLES = 'MANAGE_ROLES',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  MANAGE_SYSTEM_SETTINGS = 'MANAGE_SYSTEM_SETTINGS',
  
  // Email & Communications
  SEND_BULK_EMAILS = 'SEND_BULK_EMAILS',
  MANAGE_EMAIL_TEMPLATES = 'MANAGE_EMAIL_TEMPLATES',
  
  // Credits & Billing
  MANAGE_CREDITS = 'MANAGE_CREDITS',
  VIEW_BILLING = 'VIEW_BILLING',
  
  // API & Integrations
  MANAGE_API_KEYS = 'MANAGE_API_KEYS',
  VIEW_API_LOGS = 'VIEW_API_LOGS'
}

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: Object.values(Permission),
  [AdminRole.ADMIN]: [
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.VIEW_JOBS,
    Permission.EDIT_JOBS,
    Permission.DELETE_JOBS,
    Permission.MODERATE_JOBS,
    Permission.BULK_MODERATE_JOBS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.SEND_BULK_EMAILS,
    Permission.MANAGE_EMAIL_TEMPLATES,
    Permission.MANAGE_CREDITS,
    Permission.VIEW_BILLING
  ],
  [AdminRole.MODERATOR]: [
    Permission.VIEW_USERS,
    Permission.VIEW_JOBS,
    Permission.EDIT_JOBS,
    Permission.MODERATE_JOBS,
    Permission.BULK_MODERATE_JOBS,
    Permission.VIEW_ANALYTICS
  ],
  [AdminRole.SUPPORT]: [
    Permission.VIEW_USERS,
    Permission.VIEW_JOBS,
    Permission.VIEW_ANALYTICS
  ]
};

export const ROLE_DISPLAY_INFO: Record<AdminRole, { name: string; description: string; color: string }> = {
  [AdminRole.SUPER_ADMIN]: {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    color: 'red'
  },
  [AdminRole.ADMIN]: {
    name: 'Administrator',
    description: 'Comprehensive management access',
    color: 'blue'
  },
  [AdminRole.MODERATOR]: {
    name: 'Moderator',
    description: 'Content moderation and basic management',
    color: 'green'
  },
  [AdminRole.SUPPORT]: {
    name: 'Support',
    description: 'Read-only access for customer support',
    color: 'gray'
  }
};

export interface UserPermissions {
  role: AdminRole;
  permissions: Permission[];
  canAccess: (permission: Permission) => boolean;
  hasRole: (role: AdminRole) => boolean;
}

export interface AuthContext {
  user: {
    id: string;
    email: string;
    role: AdminRole;
    permissions: Permission[];
  } | null;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: AdminRole) => boolean;
}

// Permission check utilities
export function hasPermission(userRole: AdminRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(userRole: AdminRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: AdminRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

export function getRoleHierarchy(): AdminRole[] {
  return [
    AdminRole.SUPER_ADMIN,
    AdminRole.ADMIN,
    AdminRole.MODERATOR,
    AdminRole.SUPPORT
  ];
}

export function isHigherRole(role1: AdminRole, role2: AdminRole): boolean {
  const hierarchy = getRoleHierarchy();
  return hierarchy.indexOf(role1) < hierarchy.indexOf(role2);
}

export function canManageRole(managerRole: AdminRole, targetRole: AdminRole): boolean {
  // Super admins can manage all roles
  if (managerRole === AdminRole.SUPER_ADMIN) {
    return true;
  }
  
  // Admins can manage moderators and support
  if (managerRole === AdminRole.ADMIN) {
    return [AdminRole.MODERATOR, AdminRole.SUPPORT].includes(targetRole);
  }
  
  // Moderators and support cannot manage other roles
  return false;
}

// Permission groups for UI organization
export const PERMISSION_GROUPS = {
  'User Management': [
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
    Permission.IMPERSONATE_USERS
  ],
  'Content Management': [
    Permission.VIEW_JOBS,
    Permission.EDIT_JOBS,
    Permission.DELETE_JOBS,
    Permission.MODERATE_JOBS,
    Permission.BULK_MODERATE_JOBS
  ],
  'Analytics & Reports': [
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_FINANCIAL_DATA
  ],
  'System Administration': [
    Permission.MANAGE_ROLES,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_SYSTEM_SETTINGS
  ],
  'Communications': [
    Permission.SEND_BULK_EMAILS,
    Permission.MANAGE_EMAIL_TEMPLATES
  ],
  'Billing & Credits': [
    Permission.MANAGE_CREDITS,
    Permission.VIEW_BILLING
  ],
  'API & Integrations': [
    Permission.MANAGE_API_KEYS,
    Permission.VIEW_API_LOGS
  ]
};

export type PermissionGroup = keyof typeof PERMISSION_GROUPS;
