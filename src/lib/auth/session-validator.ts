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
 */
export async function validateSession(): Promise<SessionValidationResult> {
  const errors: string[] = [];

  try {
    const session = await auth() as Session | null;

    // No session
    if (!session) {
      errors.push('No active session');
      return { isValid: false, session: null, user: null, errors };
    }

    // No user in session
    if (!session.user) {
      errors.push('Session missing user data');
      return { isValid: false, session, user: null, errors };
    }

    const user = session.user as any;

    // Validate critical user fields (ID and email are required)
    if (!user.id) {
      errors.push('User missing ID');
    }

    if (!user.email) {
      errors.push('User missing email');
    }

    // Role is important but not critical - provide default if missing
    if (!user.role) {
      console.warn('⚠️ User missing role, defaulting to jobseeker:', {
        userId: user.id,
        email: user.email
      });
      user.role = 'jobseeker'; // Default role for users without role
    }

    // Only fail validation for critical missing fields (ID, email)
    const criticalErrors = errors.filter(error =>
      error.includes('missing ID') || error.includes('missing email')
    );

    if (criticalErrors.length > 0) {
      console.error('🚨 Session validation failed (critical errors):', criticalErrors, { session, user });
      return { isValid: false, session, user, errors: criticalErrors };
    }

    console.log('✅ Session validation passed:', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return { isValid: true, session, user, errors: [] };

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
  const validation = await validateSession();
  
  if (!validation.isValid) {
    const error = new Error(`Authentication failed: ${validation.errors.join(', ')}`);
    (error as any).statusCode = 401;
    throw error;
  }
  
  const userRole = validation.user.role;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  // Admin role can access everything
  if (userRole === 'admin' || roles.includes(userRole)) {
    return { session: validation.session!, user: validation.user! };
  }
  
  const error = new Error(`Insufficient permissions. Required: ${roles.join(' or ')}, Current: ${userRole}`);
  (error as any).statusCode = 403;
  throw error;
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