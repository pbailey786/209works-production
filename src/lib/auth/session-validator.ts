import { auth } from '@/auth';
import type { Session } from 'next-auth';

interface SessionValidationResult {
  isValid: boolean;
  session: Session | null;
  user: any;
  errors: string[];
}

/**
 * Validates a session for protected requests
 * Enhanced for NextAuth v5 beta compatibility
 */
export async function validateSession(): Promise<SessionValidationResult> {
  const errors: string[] = [];

  try {
    const session = await auth() as Session | null;

    console.log('🔍 Session validation debug:', {
      hasSession: !!session,
      sessionType: typeof session,
      sessionKeys: session ? Object.keys(session) : [],
      hasUser: !!session?.user,
      userKeys: session?.user ? Object.keys(session.user) : [],
      rawUser: session?.user
    });

    // No session
    if (!session) {
      console.log('❌ No session found');
      errors.push('No active session');
      return { isValid: false, session: null, user: null, errors };
    }

    // No user in session
    if (!session.user) {
      console.log('❌ No user in session');
      errors.push('Session missing user data');
      return { isValid: false, session, user: null, errors };
    }

    const user = session.user as any;

    // Enhanced debugging for user data
    console.log('🔍 User data debug:', {
      hasId: !!user.id,
      hasEmail: !!user.email,
      hasRole: !!user.role,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      allUserProps: Object.keys(user)
    });

    // Create a normalized user object with fallbacks
    const normalizedUser = {
      id: user.id || user.sub || '', // NextAuth v5 might use 'sub' instead of 'id'
      email: user.email || '',
      name: user.name || user.email || '',
      role: user.role || 'jobseeker', // Always provide a default role
      onboardingCompleted: user.onboardingCompleted || false,
      twoFactorEnabled: user.twoFactorEnabled || false,
      isEmailVerified: user.isEmailVerified || false
    };

    console.log('🔧 Normalized user:', normalizedUser);

    // Validate critical user fields (ID and email are required)
    if (!normalizedUser.id) {
      console.error('❌ User missing ID (checked both id and sub fields)');
      errors.push('User missing ID');
    }

    if (!normalizedUser.email) {
      console.error('❌ User missing email');
      errors.push('User missing email');
    }

    // Only fail validation for critical missing fields (ID, email)
    if (errors.length > 0) {
      console.error('🚨 Session validation failed (critical errors):', errors, {
        session,
        originalUser: user,
        normalizedUser
      });
      return { isValid: false, session, user: normalizedUser, errors };
    }

    console.log('✅ Session validation passed:', {
      userId: normalizedUser.id,
      email: normalizedUser.email,
      role: normalizedUser.role
    });

    return { isValid: true, session, user: normalizedUser, errors: [] };

  } catch (error) {
    console.error('❌ Session validation error:', error);
    errors.push(`Session validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, session: null, user: null, errors };
  }
}

/**
 * Validates session and throws error if invalid (for API routes)
 */
export async function requireValidSession(): Promise<{ session: Session; user: any }> {
  const validation = await validateSession();
  
  if (!validation.isValid) {
    const error = new Error(`Authentication failed: ${validation.errors.join(', ')}`);
    (error as any).statusCode = 401;
    (error as any).errors = validation.errors;
    throw error;
  }
  
  return { session: validation.session!, user: validation.user! };
}

/**
 * Validates session for specific role
 */
export async function requireRole(allowedRoles: string | string[]): Promise<{ session: Session; user: any }> {
  try {
    const validation = await validateSession();

    if (!validation.isValid) {
      console.error('🔒 Session validation failed:', validation.errors);
      const error = new Error(`Authentication failed: ${validation.errors.join(', ')}`);
      (error as any).statusCode = 401;
      throw error;
    }

    const userRole = validation.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    console.log('🔍 Role check:', { userRole, requiredRoles: roles, userId: validation.user.id });

    // Admin role can access everything
    if (userRole === 'admin' || roles.includes(userRole)) {
      return { session: validation.session!, user: validation.user! };
    }

    console.error('🚫 Insufficient permissions:', { userRole, requiredRoles: roles });
    const error = new Error(`Insufficient permissions. Required: ${roles.join(' or ')}, Current: ${userRole}`);
    (error as any).statusCode = 403;
    throw error;
  } catch (error) {
    console.error('💥 Error in requireRole:', error);
    throw error;
  }
}

/**
 * Client-side session validation helper
 */
export function validateClientSession(session: Session | null): {
  isValid: boolean;
  errors: string[];
  user: any;
} {
  const errors: string[] = [];
  
  if (!session) {
    errors.push('No session');
    return { isValid: false, errors, user: null };
  }
  
  if (!session.user) {
    errors.push('No user in session');
    return { isValid: false, errors, user: null };
  }
  
  const user = session.user as any;
  
  if (!user.id) errors.push('Missing user ID');
  if (!user.email) errors.push('Missing user email');
  if (!user.role) errors.push('Missing user role');
  
  return {
    isValid: errors.length === 0,
    errors,
    user: errors.length === 0 ? user : null
  };
}