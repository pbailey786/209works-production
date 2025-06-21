/**
 * Authentication Middleware
 * Handles role-based access control and authentication checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { AdminRole, Permission, hasPermission } from '@/types/auth';

export interface AuthContext {
  userId: string;
  role: AdminRole;
  permissions: Permission[];
}

/**
 * Require authentication for API routes
 */
export function requireAuth(handler: (req: NextRequest, auth: AuthContext) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const { userId } = getAuth(req);
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Get user role from Clerk metadata or database
      // For now, we'll use a default role - in production, fetch from database
      const role = AdminRole.SUPPORT; // Default role
      const permissions: Permission[] = [];

      const authContext: AuthContext = {
        userId,
        role,
        permissions
      };

      return await handler(req, authContext);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * Require specific role for API routes
 */
export function requireRole(role: AdminRole) {
  return function(handler: (req: NextRequest, auth: AuthContext) => Promise<NextResponse>) {
    return requireAuth(async (req: NextRequest, auth: AuthContext) => {
      if (auth.role !== role) {
        return NextResponse.json(
          { error: `Access denied. Required role: ${role}` },
          { status: 403 }
        );
      }

      return await handler(req, auth);
    });
  };
}

/**
 * Require specific permission for API routes
 */
export function requirePermission(permission: Permission) {
  return function(handler: (req: NextRequest, auth: AuthContext) => Promise<NextResponse>) {
    return requireAuth(async (req: NextRequest, auth: AuthContext) => {
      if (!hasPermission(auth.role, permission)) {
        return NextResponse.json(
          { error: `Access denied. Required permission: ${permission}` },
          { status: 403 }
        );
      }

      return await handler(req, auth);
    });
  };
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return function(handler: (req: NextRequest, auth: AuthContext) => Promise<NextResponse>) {
    return requireAuth(async (req: NextRequest, auth: AuthContext) => {
      const hasAnyPermission = permissions.some(permission => 
        hasPermission(auth.role, permission)
      );

      if (!hasAnyPermission) {
        return NextResponse.json(
          { error: `Access denied. Required permissions: ${permissions.join(', ')}` },
          { status: 403 }
        );
      }

      return await handler(req, auth);
    });
  };
}

/**
 * Require admin role (any admin level)
 */
export function requireAdmin() {
  return function(handler: (req: NextRequest, auth: AuthContext) => Promise<NextResponse>) {
    return requireAuth(async (req: NextRequest, auth: AuthContext) => {
      const adminRoles = [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MODERATOR];
      
      if (!adminRoles.includes(auth.role)) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      return await handler(req, auth);
    });
  };
}

/**
 * Optional authentication - doesn't fail if not authenticated
 */
export function optionalAuth(handler: (req: NextRequest, auth?: AuthContext) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const { userId } = getAuth(req);
      
      if (!userId) {
        return await handler(req);
      }

      // Get user role from Clerk metadata or database
      const role = AdminRole.SUPPORT; // Default role
      const permissions: Permission[] = [];

      const authContext: AuthContext = {
        userId,
        role,
        permissions
      };

      return await handler(req, authContext);
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      return await handler(req);
    }
  };
}

/**
 * Rate limiting middleware
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
      const now = Date.now();
      
      const userRequests = requests.get(ip);
      
      if (!userRequests || now > userRequests.resetTime) {
        requests.set(ip, { count: 1, resetTime: now + windowMs });
        return await handler(req);
      }
      
      if (userRequests.count >= maxRequests) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }
      
      userRequests.count++;
      return await handler(req);
    };
  };
}

/**
 * CORS middleware
 */
export function cors(options: {
  origin?: string | string[];
  methods?: string[];
  headers?: string[];
} = {}) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization']
  } = options;

  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin,
            'Access-Control-Allow-Methods': methods.join(', '),
            'Access-Control-Allow-Headers': headers.join(', '),
            'Access-Control-Max-Age': '86400'
          }
        });
      }

      const response = await handler(req);
      
      // Add CORS headers to response
      response.headers.set('Access-Control-Allow-Origin', Array.isArray(origin) ? origin.join(', ') : origin);
      response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
      response.headers.set('Access-Control-Allow-Headers', headers.join(', '));
      
      return response;
    };
  };
}

/**
 * Logging middleware
 */
export function logging(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const start = Date.now();
    const { method, url } = req;
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} - Started`);
    
    try {
      const response = await handler(req);
      const duration = Date.now() - start;
      
      console.log(`[${new Date().toISOString()}] ${method} ${url} - ${response.status} (${duration}ms)`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[${new Date().toISOString()}] ${method} ${url} - Error (${duration}ms):`, error);
      throw error;
    }
  };
}

/**
 * Compose multiple middleware functions
 */
export function compose(...middlewares: Array<(handler: any) => any>) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}
