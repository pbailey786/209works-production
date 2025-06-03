// Role-Based Access Control (RBAC) System
// Defines permissions and roles for the admin dashboard

export enum Permission {
  // User Management
  VIEW_USERS = 'view_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  MANAGE_USER_ROLES = 'manage_user_roles',

  // Content Moderation
  VIEW_MODERATION_QUEUE = 'view_moderation_queue',
  MODERATE_JOBS = 'moderate_jobs',
  MODERATE_USERS = 'moderate_users',
  HANDLE_REPORTS = 'handle_reports',

  // Analytics & Reports
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_DETAILED_ANALYTICS = 'view_detailed_analytics',
  EXPORT_REPORTS = 'export_reports',
  VIEW_FINANCIAL_DATA = 'view_financial_data',

  // Advertisement Management
  VIEW_ADS = 'view_ads',
  MANAGE_ADS = 'manage_ads',
  VIEW_AD_PERFORMANCE = 'view_ad_performance',
  MANAGE_AD_CAMPAIGNS = 'manage_ad_campaigns',

  // System Administration
  VIEW_SYSTEM_HEALTH = 'view_system_health',
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_AUDIT_LOGS = 'manage_audit_logs',

  // Email & Communications
  MANAGE_EMAIL_TEMPLATES = 'manage_email_templates',
  VIEW_EMAIL_ANALYTICS = 'view_email_analytics',
  SEND_BULK_EMAILS = 'send_bulk_emails',

  // Super Admin Only
  MANAGE_ADMIN_ROLES = 'manage_admin_roles',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  DATABASE_ACCESS = 'database_access',
}

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  CONTENT_MODERATOR = 'content_moderator',
  ANALYTICS_SPECIALIST = 'analytics_specialist',
  MARKETING_MANAGER = 'marketing_manager',
  SUPPORT_SPECIALIST = 'support_specialist',
}

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: [
    // Super admin has all permissions
    ...Object.values(Permission),
  ],

  [AdminRole.CONTENT_MODERATOR]: [
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.VIEW_MODERATION_QUEUE,
    Permission.MODERATE_JOBS,
    Permission.MODERATE_USERS,
    Permission.HANDLE_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_AUDIT_LOGS,
  ],

  [AdminRole.ANALYTICS_SPECIALIST]: [
    Permission.VIEW_USERS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_DETAILED_ANALYTICS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_FINANCIAL_DATA,
    Permission.VIEW_AD_PERFORMANCE,
    Permission.VIEW_EMAIL_ANALYTICS,
    Permission.VIEW_SYSTEM_HEALTH,
  ],

  [AdminRole.MARKETING_MANAGER]: [
    Permission.VIEW_USERS,
    Permission.VIEW_ADS,
    Permission.MANAGE_ADS,
    Permission.VIEW_AD_PERFORMANCE,
    Permission.MANAGE_AD_CAMPAIGNS,
    Permission.MANAGE_EMAIL_TEMPLATES,
    Permission.VIEW_EMAIL_ANALYTICS,
    Permission.SEND_BULK_EMAILS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_REPORTS,
  ],

  [AdminRole.SUPPORT_SPECIALIST]: [
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.HANDLE_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_EMAIL_ANALYTICS,
    Permission.VIEW_AUDIT_LOGS,
  ],
};

// Helper functions for permission checking
export function hasPermission(
  userRole: string,
  permission: Permission
): boolean {
  // For backward compatibility, treat 'admin' as super admin
  if (userRole === 'admin') {
    return true;
  }

  const adminRole = userRole as AdminRole;
  const permissions = ROLE_PERMISSIONS[adminRole];
  return permissions ? permissions.includes(permission) : false;
}

export function hasAnyPermission(
  userRole: string,
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(
  userRole: string,
  permissions: Permission[]
): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

export function getUserPermissions(userRole: string): Permission[] {
  // For backward compatibility, treat 'admin' as super admin
  if (userRole === 'admin') {
    return Object.values(Permission);
  }

  const adminRole = userRole as AdminRole;
  return ROLE_PERMISSIONS[adminRole] || [];
}

export function canAccessRoute(userRole: string, route: string): boolean {
  const routePermissions: Record<string, Permission[]> = {
    '/admin': [Permission.VIEW_ANALYTICS],
    '/admin/users': [Permission.VIEW_USERS],
    '/admin/analytics': [Permission.VIEW_ANALYTICS],
    '/admin/moderation': [Permission.VIEW_MODERATION_QUEUE],
    '/admin/moderation/jobs': [Permission.MODERATE_JOBS],
    '/admin/moderation/reports': [Permission.HANDLE_REPORTS],
    '/admin/ads': [Permission.VIEW_ADS],
    '/admin/ads/campaigns': [Permission.MANAGE_AD_CAMPAIGNS],
    '/admin/ads/performance': [Permission.VIEW_AD_PERFORMANCE],
    '/admin/system': [Permission.VIEW_SYSTEM_HEALTH],
    '/admin/system/monitoring': [Permission.VIEW_SYSTEM_HEALTH],
    '/admin/system/database': [Permission.DATABASE_ACCESS],
    '/admin/reports': [Permission.EXPORT_REPORTS],
    '/admin/settings': [Permission.MANAGE_SYSTEM_SETTINGS],
  };

  const requiredPermissions = routePermissions[route];
  if (!requiredPermissions) {
    return true; // Allow access if no specific permissions required
  }

  return hasAnyPermission(userRole, requiredPermissions);
}

// Role display names and descriptions
export const ROLE_DISPLAY_INFO = {
  [AdminRole.SUPER_ADMIN]: {
    name: 'Super Administrator',
    description: 'Full system access with all permissions',
    color: 'red',
  },
  [AdminRole.CONTENT_MODERATOR]: {
    name: 'Content Moderator',
    description: 'Manages content moderation and user reports',
    color: 'blue',
  },
  [AdminRole.ANALYTICS_SPECIALIST]: {
    name: 'Analytics Specialist',
    description: 'Focuses on data analysis and reporting',
    color: 'green',
  },
  [AdminRole.MARKETING_MANAGER]: {
    name: 'Marketing Manager',
    description: 'Manages advertisements and marketing campaigns',
    color: 'purple',
  },
  [AdminRole.SUPPORT_SPECIALIST]: {
    name: 'Support Specialist',
    description: 'Handles user support and basic moderation',
    color: 'orange',
  },
};
