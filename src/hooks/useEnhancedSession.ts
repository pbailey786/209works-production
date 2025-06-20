'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import type { Session } from 'next-auth';

interface EnhancedUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: 'jobseeker' | 'employer' | 'admin';
  onboardingCompleted?: boolean;
  twoFactorEnabled?: boolean;
  isEmailVerified?: boolean;
}

// Enhanced session interface that ensures user is fully populated
interface EnhancedSession {
  user: EnhancedUser;
  expires: string;
}

interface UseEnhancedSessionReturn {
  session: EnhancedSession | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isLoading: boolean;
  isAuthenticated: boolean;
  user: EnhancedUser | null;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Enhanced session hook that ensures user data is fully populated
 * and provides better error handling and loading states
 */
export function useEnhancedSession(): UseEnhancedSessionReturn {
  const { data: session, status, update } = useSession();
  const [enhancedSession, setEnhancedSession] = useState<EnhancedSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Validate and enhance session data
  const validateSession = useCallback((sessionData: Session | null): EnhancedSession | null => {
    if (!sessionData?.user) {
      return null;
    }

    const user = sessionData.user;

    // Check for required fields - handle both optional and required types
    if (!user.email) {
      console.warn('🚨 Session user missing email');
      setError('Session missing required user email');
      return null;
    }

    if (!user.id) {
      console.warn('🚨 Session user missing ID');
      setError('Session missing required user ID');
      return null;
    }

    // Create enhanced user object that matches the Session.user type plus additional fields
    const enhancedUser: EnhancedUser = {
      id: user.id,
      email: user.email,
      name: user.name || null,
      image: user.image || null,
      role: user.role || 'jobseeker',
      onboardingCompleted: (user as any).onboardingCompleted || false,
      twoFactorEnabled: (user as any).twoFactorEnabled || false,
      isEmailVerified: (user as any).isEmailVerified || false,
    };

    // Return properly typed enhanced session
    return {
      user: enhancedUser,
      expires: (sessionData as any).expires || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }, []);

  // Refresh session data
  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      console.log('🔄 Refreshing session data...');
      await update();
    } catch (refreshError) {
      console.error('❌ Failed to refresh session:', refreshError);
      setError('Failed to refresh session data');
    } finally {
      setIsRefreshing(false);
    }
  }, [update, isRefreshing]);

  // Update enhanced session when base session changes
  useEffect(() => {
    console.log('🔍 Session data changed:', {
      status,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!(session?.user as any)?.id,
      hasUserEmail: !!session?.user?.email
    });

    if (status === 'loading') {
      setEnhancedSession(null);
      setError(null);
      return;
    }

    if (status === 'unauthenticated') {
      setEnhancedSession(null);
      setError(null);
      return;
    }

    if (status === 'authenticated' && session) {
      // Type assertion to handle NextAuth v5 beta type differences
      const sessionWithUser = session as Session & {
        user: {
          id: string;
          email: string;
          name?: string | null;
          image?: string | null;
          role: 'jobseeker' | 'employer' | 'admin';
        }
      };

      const validated = validateSession(sessionWithUser);
      if (validated) {
        setEnhancedSession(validated);
        setError(null);
        console.log('✅ Enhanced session created:', {
          userId: validated.user.id,
          userEmail: validated.user.email,
          userRole: validated.user.role
        });
      } else {
        setEnhancedSession(null);
        // Error is set by validateSession
      }
    }
  }, [session, status, validateSession]);

  // Auto-refresh if session is incomplete
  useEffect(() => {
    if (
      status === 'authenticated' && 
      session?.user?.email && 
      !(session?.user as any)?.id && 
      !isRefreshing
    ) {
      console.log('🔄 Session incomplete, auto-refreshing...');
      refresh();
    }
  }, [session, status, refresh, isRefreshing]);

  const isLoading = status === 'loading' || isRefreshing;
  const isAuthenticated = status === 'authenticated' && !!enhancedSession;

  return {
    session: enhancedSession,
    status,
    isLoading,
    isAuthenticated,
    user: enhancedSession?.user || null,
    error,
    refresh
  };
}

/**
 * Hook for components that require authentication
 * Throws error if user is not authenticated
 */
export function useRequireAuth(): EnhancedUser {
  const { user, isAuthenticated, isLoading, error } = useEnhancedSession();

  if (isLoading) {
    throw new Error('Authentication loading');
  }

  if (error) {
    throw new Error(`Authentication error: ${error}`);
  }

  if (!isAuthenticated || !user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Hook for role-based access control
 */
export function useRequireRole(allowedRoles: string | string[]): EnhancedUser {
  const user = useRequireAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role) && user.role !== 'admin') {
    throw new Error(`Access denied. Required roles: ${roles.join(', ')}`);
  }

  return user;
}
