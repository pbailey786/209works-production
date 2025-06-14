'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
  fallback?: ReactNode;
}

/**
 * RoleGuard component that protects routes based on user roles
 * 
 * @param children - Content to render if user has required role
 * @param allowedRoles - Array of roles that can access this content
 * @param redirectTo - Where to redirect if user doesn't have required role
 * @param fallback - Component to show while loading or if unauthorized
 */
export default function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo,
  fallback 
}: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (status === 'unauthenticated') {
      // Redirect to appropriate sign-in page
      const signInUrl = allowedRoles.includes('employer') ? '/employers/signin' : '/signin';
      router.push(signInUrl);
      return;
    }

    if (session?.user) {
      const userRole = (session.user as any).role;
      
      // Check if user has required role
      if (!allowedRoles.includes(userRole)) {
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          // Default redirects based on role
          switch (userRole) {
            case 'employer':
              router.push('/employers/dashboard');
              break;
            case 'admin':
              router.push('/admin');
              break;
            case 'jobseeker':
            default:
              router.push('/dashboard');
              break;
          }
        }
        return;
      }
    }
  }, [session, status, router, allowedRoles, redirectTo]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return fallback || (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show loading state while redirecting unauthorized users
  if (status === 'unauthenticated' || 
      (session?.user && !allowedRoles.includes((session.user as any).role))) {
    return fallback || (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // User is authorized, render children
  return <>{children}</>;
}

/**
 * Hook to check if current user has specific role(s)
 */
export function useRoleCheck(allowedRoles: string[]) {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return { hasRole: false, isLoading: true, userRole: null };
  }
  
  if (!session?.user) {
    return { hasRole: false, isLoading: false, userRole: null };
  }
  
  const userRole = (session.user as any).role;
  const hasRole = allowedRoles.includes(userRole);
  
  return { hasRole, isLoading: false, userRole };
}

/**
 * Component that only renders children if user has required role
 */
export function RoleBasedComponent({ 
  children, 
  allowedRoles, 
  fallback = null 
}: {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}) {
  const { hasRole, isLoading } = useRoleCheck(allowedRoles);
  
  if (isLoading) {
    return fallback;
  }
  
  return hasRole ? <>{children}</> : <>{fallback}</>;
}
