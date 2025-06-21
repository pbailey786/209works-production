'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import path from "path";

interface PermissionGateProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'employer' | 'user';
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export default function PermissionGate({
  children,
  requiredRole = 'user',
  requiredPermissions = [],
  fallback,
  showFallback = true,
}: PermissionGateProps) {
  const { user, isLoaded, isSignedIn } = useUser();

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn || !user) {
    if (!showFallback) return null;
    
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Shield className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
        <p className="text-gray-600 mb-4">You need to sign in to access this content.</p>
        <Button onClick={() => window.location.href = '/sign-in'}>
          Sign In
        </Button>
      </div>
    );
  }

  // Check role permissions
  const userRole = user.publicMetadata?.role as string || 'user';
  const userPermissions = user.publicMetadata?.permissions as string[] || [];

  // Admin check
  const isAdmin = userRole === 'admin' || user.emailAddresses?.[0]?.emailAddress?.includes('admin');
  
  // Role hierarchy: admin > employer > user
  const hasRequiredRole = () => {
    if (isAdmin) return true; // Admin can access everything
    
    switch (requiredRole) {
      case 'admin':
        return isAdmin;
      case 'employer':
        return userRole === 'employer' || isAdmin;
      case 'user':
        return true; // All authenticated users can access user-level content
      default:
        return false;
    }
  };

  // Permission check
  const hasRequiredPermissions = () => {
    if (isAdmin) return true; // Admin has all permissions
    if (requiredPermissions.length === 0) return true;
    
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  };

  // Check if user has access
  const hasAccess = hasRequiredRole() && hasRequiredPermissions();

  if (!hasAccess) {
    if (!showFallback) return null;
    
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600 mb-4">
          You don't have the required permissions to access this content.
        </p>
        <div className="text-sm text-gray-500">
          <p>Required role: <span className="font-medium">{requiredRole}</span></p>
          {requiredPermissions.length > 0 && (
            <p>Required permissions: <span className="font-medium">{requiredPermissions.path.join(', ')}</span></p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function AdminGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate requiredRole="admin" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function EmployerGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate requiredRole="employer" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function UserGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGate requiredRole="user" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}
