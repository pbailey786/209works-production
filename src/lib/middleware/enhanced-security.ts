import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { SecurityLogger } from '../security/security-monitor';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

// Environment configuration with validation
const SecurityConfig = z
  .object({
    JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
    SESSION_SECRET: z
      .string()
      .min(32, 'Session secret must be at least 32 characters'),
    API_KEY_SALT: z
      .string()
      .min(16, 'API key salt must be at least 16 characters'),
    SECURITY_HEADERS_ENABLED: z
      .string()
      .default('true')
      .transform(val => val === 'true'),
    CSRF_PROTECTION_ENABLED: z
      .string()
      .default('true')
      .transform(val => val === 'true'),
    RATE_LIMIT_ENABLED: z
      .string()
      .default('true')
      .transform(val => val === 'true'),
    SESSION_TIMEOUT_MINUTES: z
      .string()
      .default('30')
      .transform(val => parseInt(val, 10)),
    MAX_LOGIN_ATTEMPTS: z
      .string()
      .default('5')
      .transform(val => parseInt(val, 10)),
    LOCKOUT_DURATION_MINUTES: z
      .string()
      .default('15')
      .transform(val => parseInt(val, 10)),
    REQUIRE_2FA_FOR_ADMIN: z
      .string()
      .default('true')
      .transform(val => val === 'true'),
    AUDIT_LOG_ENABLED: z
      .string()
      .default('true')
      .transform(val => val === 'true'),
  })
  .parse(process.env);

// Enhanced authentication context
export interface SecureAuthContext {
  user: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    sessionId: string;
    lastActivity: Date;
    requiresMFA: boolean;
    mfaVerified: boolean;
    ipAddress: string;
    userAgent: string;
  } | null;
  session: {
    id: string;
    isValid: boolean;
    expiresAt: Date;
    createdAt: Date;
    lastActivity: Date;
    ipAddress: string;
    userAgent: string;
  } | null;
  security: {
    requestId: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    isSecureConnection: boolean;
    rateLimitRemaining: number;
    csrfToken?: string;
  };
}

// Permission system
export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',

  // Job permissions
  JOB_READ = 'job:read',
  JOB_WRITE = 'job:write',
  JOB_DELETE = 'job:delete',
  JOB_MODERATE = 'job:moderate',

  // Application permissions
  APPLICATION_READ = 'application:read',
  APPLICATION_WRITE = 'application:write',
  APPLICATION_DELETE = 'application:delete',

  // Admin permissions
  ADMIN_READ = 'admin:read',
  ADMIN_WRITE = 'admin:write',
  SYSTEM_CONFIG = 'system:config',

  // Analytics permissions
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_WRITE = 'analytics:write',
}

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  jobseeker: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.JOB_READ,
    Permission.APPLICATION_READ,
    Permission.APPLICATION_WRITE,
  ],
  employer: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.JOB_READ,
    Permission.JOB_WRITE,
    Permission.JOB_DELETE,
    Permission.APPLICATION_READ,
    Permission.ANALYTICS_READ,
  ],
  admin: [
    ...Object.values(Permission), // Admins get all permissions
  ],
};

// Enhanced security middleware configuration
export interface EnhancedSecurityConfig {
  // Authentication requirements
  requireAuthentication?: boolean;
  requiredPermissions?: Permission[];
  requiredRoles?: string[];
  requireMFA?: boolean;

  // Session management
  validateSession?: boolean;
  refreshSession?: boolean;
  requireSecureConnection?: boolean;

  // Rate limiting
  rateLimit?: {
    enabled?: boolean;
    maxRequests?: number;
    windowMs?: number;
    skipSuccessfulRequests?: boolean;
  };

  // CSRF protection
  csrfProtection?: {
    enabled?: boolean;
    methods?: string[];
    origins?: string[];
  };

  // Audit logging
  auditLog?: {
    enabled?: boolean;
    logSuccess?: boolean;
    logFailure?: boolean;
    sensitiveData?: boolean;
  };

  // Security headers
  securityHeaders?: {
    enabled?: boolean;
    contentSecurityPolicy?: boolean;
    strictTransportSecurity?: boolean;
    xFrameOptions?: boolean;
  };
}

// Session management
class SessionManager {
  private static readonly SESSION_COLLECTION = 'user_sessions';

  static async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + SecurityConfig.SESSION_TIMEOUT_MINUTES * 60 * 1000
    );

    await prisma.userSession.create({
      data: {
        id: sessionId,
        sessionId: sessionId,
        userId,
        ipAddress,
        userAgent,
        expiresAt,
        lastActivity: new Date(),
      },
    });

    return sessionId;
  }

  static async validateSession(
    sessionId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.invalidateSession(sessionId);
      }
      return false;
    }

    // Validate IP address and user agent for session hijacking protection
    if (session.ipAddress !== ipAddress || session.userAgent !== userAgent) {
      SecurityLogger.suspiciousRequest(
        ipAddress,
        'Session hijacking attempt detected',
        { sessionId, originalIp: session.ipAddress, currentIp: ipAddress }
      );
      await this.invalidateSession(sessionId);
      return false;
    }

    // Update last activity
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });

    return true;
  }

  static async invalidateSession(sessionId: string): Promise<void> {
    await prisma.userSession
      .delete({
        where: { id: sessionId },
      })
      .catch(() => {}); // Ignore if already deleted
  }

  static async invalidateAllUserSessions(userId: string): Promise<void> {
    await prisma.userSession.deleteMany({
      where: { userId },
    });
  }

  static async cleanupExpiredSessions(): Promise<void> {
    await prisma.userSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}

// CSRF protection
class CSRFProtection {
  private static readonly CSRF_TOKEN_LENGTH = 32;

  static generateToken(): string {
    return randomBytes(this.CSRF_TOKEN_LENGTH).toString('hex');
  }

  static validateToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) return false;

    const expectedToken = createHash('sha256')
      .update(sessionToken + SecurityConfig.API_KEY_SALT)
      .digest('hex');

    const providedToken = createHash('sha256').update(token).digest('hex');

    return timingSafeEqual(
      Buffer.from(expectedToken, 'hex'),
      Buffer.from(providedToken, 'hex')
    );
  }
}

// Enhanced authentication validator
class AuthenticationValidator {
  static async validateUser(
    req: NextRequest
  ): Promise<SecureAuthContext['user']> {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;
    if (!session?.user?.email) return null;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        role: true,
        twoFactorEnabled: true,
        isEmailVerified: true,
        lastLoginAt: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) return null;

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      SecurityLogger.unauthorizedAccess(
        req.url,
        this.getClientIP(req),
        user.id
      );
      return null;
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return null;
    }

    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: ROLE_PERMISSIONS[user.role] || [],
      sessionId: user.id, // Temporary - should be actual session ID
      lastActivity: new Date(),
      requiresMFA:
        user.role === 'admin' && SecurityConfig.REQUIRE_2FA_FOR_ADMIN,
      mfaVerified:
        !user.twoFactorEnabled || (session.user as any).mfaVerified === true,
      ipAddress,
      userAgent,
    };
  }

  static getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const remoteAddr = req.headers.get('remote-addr');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    return realIP || remoteAddr || 'unknown';
  }

  static async checkPermissions(
    user: SecureAuthContext['user'],
    requiredPermissions: Permission[]
  ): Promise<boolean> {
    if (!user || !requiredPermissions.length) return true;

    return requiredPermissions.every(permission =>
      user.permissions.includes(permission)
    );
  }

  static async checkRoles(
    user: SecureAuthContext['user'],
    requiredRoles: string[]
  ): Promise<boolean> {
    if (!user || !requiredRoles.length) return true;

    return requiredRoles.includes(user.role);
  }
}

// Rate limiting with enhanced security
class EnhancedRateLimit {
  static async checkRateLimit(
    req: NextRequest,
    config: EnhancedSecurityConfig['rateLimit']
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
  }> {
    if (!config?.enabled) {
      return { allowed: true, remaining: 1000, resetTime: new Date() };
    }

    const identifier = AuthenticationValidator.getClientIP(req);
    const key = `rate_limit:${identifier}:${req.url}`;

    try {
      // Simple rate limiting implementation
      // In a real application, you would use Redis or a similar store
      const maxRequests = config.maxRequests || 100;
      const windowMs = config.windowMs || 60000;

      return {
        allowed: true, // Allow all requests for now
        remaining: maxRequests,
        resetTime: new Date(Date.now() + windowMs),
      };
    } catch (error) {
      // If rate limiting fails, allow the request but log the error
      console.error('Rate limiting error:', error);
      return { allowed: true, remaining: 0, resetTime: new Date() };
    }
  }
}

// Security headers manager
class SecurityHeaders {
  static apply(
    response: NextResponse,
    config: EnhancedSecurityConfig['securityHeaders']
  ): void {
    if (!config?.enabled) return;

    // Basic security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );

    // Strict Transport Security
    if (config.strictTransportSecurity) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Content Security Policy
    if (config.contentSecurityPolicy) {
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');

      response.headers.set('Content-Security-Policy', csp);
    }
  }
}

// Audit logger
class AuditLogger {
  static async logSecurityEvent(
    action: string,
    context: SecureAuthContext,
    details: Record<string, any> = {}
  ): Promise<void> {
    if (!SecurityConfig.AUDIT_LOG_ENABLED) return;

    try {
      await prisma.auditLog.create({
        data: {
          action,
          userId: context.user?.id,
          resource: 'security',
          resourceId: context.session?.id,
          details: JSON.stringify(details),
          ipAddress: context.security.ipAddress,
          userAgent: context.security.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }
}

// Main enhanced security middleware
export function withEnhancedSecurity(
  handler: (
    req: NextRequest,
    context: SecureAuthContext
  ) => Promise<NextResponse>,
  config: EnhancedSecurityConfig = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = randomBytes(16).toString('hex');
    const timestamp = new Date();
    const ipAddress = AuthenticationValidator.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const isSecureConnection = req.url.startsWith('https://');

    // Initialize security context
    const securityContext: SecureAuthContext = {
      user: null,
      session: null,
      security: {
        requestId,
        timestamp,
        ipAddress,
        userAgent,
        isSecureConnection,
        rateLimitRemaining: 0,
      },
    };

    try {
      // 1. Require secure connection in production
      if (
        config.requireSecureConnection &&
        !isSecureConnection &&
        process.env.NODE_ENV === 'production'
      ) {
        SecurityLogger.suspiciousRequest(
          ipAddress,
          'Insecure connection attempt',
          { url: req.url, userAgent }
        );

        return NextResponse.json(
          { error: 'Secure connection required' },
          { status: 400 }
        );
      }

      // 2. Rate limiting
      if (config.rateLimit?.enabled) {
        const rateLimitResult = await EnhancedRateLimit.checkRateLimit(
          req,
          config.rateLimit
        );
        securityContext.security.rateLimitRemaining = rateLimitResult.remaining;

        if (!rateLimitResult.allowed) {
          SecurityLogger.rateLimitExceeded(ipAddress, req.url);

          const response = NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          );

          response.headers.set(
            'X-RateLimit-Remaining',
            rateLimitResult.remaining.toString()
          );
          response.headers.set(
            'X-RateLimit-Reset',
            rateLimitResult.resetTime.toISOString()
          );

          return response;
        }
      }

      // 3. Authentication
      if (config.requireAuthentication) {
        const user = await AuthenticationValidator.validateUser(req);
        if (!user) {
          SecurityLogger.unauthorizedAccess(req.url, ipAddress);

          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        securityContext.user = user;

        // Check MFA requirement
        if (config.requireMFA && (!user.mfaVerified || user.requiresMFA)) {
          return NextResponse.json(
            { error: 'Multi-factor authentication required' },
            { status: 403 }
          );
        }
      }

      // 4. Authorization - Permission check
      if (config.requiredPermissions?.length) {
        const hasPermissions = await AuthenticationValidator.checkPermissions(
          securityContext.user,
          config.requiredPermissions
        );

        if (!hasPermissions) {
          SecurityLogger.unauthorizedAccess(
            req.url,
            ipAddress,
            securityContext.user?.id
          );

          await AuditLogger.logSecurityEvent(
            'AUTHORIZATION_FAILED',
            securityContext,
            { requiredPermissions: config.requiredPermissions }
          );

          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // 5. Authorization - Role check
      if (config.requiredRoles?.length) {
        const hasRoles = await AuthenticationValidator.checkRoles(
          securityContext.user,
          config.requiredRoles
        );

        if (!hasRoles) {
          SecurityLogger.unauthorizedAccess(
            req.url,
            ipAddress,
            securityContext.user?.id
          );

          await AuditLogger.logSecurityEvent(
            'AUTHORIZATION_FAILED',
            securityContext,
            { requiredRoles: config.requiredRoles }
          );

          return NextResponse.json(
            { error: 'Insufficient role permissions' },
            { status: 403 }
          );
        }
      }

      // 6. CSRF protection
      if (
        config.csrfProtection?.enabled &&
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
      ) {
        const csrfToken = req.headers.get('x-csrf-token');
        const sessionToken = req.headers.get('x-session-token');

        if (
          !csrfToken ||
          !sessionToken ||
          !CSRFProtection.validateToken(csrfToken, sessionToken)
        ) {
          SecurityLogger.suspiciousRequest(
            ipAddress,
            'CSRF token validation failed',
            { url: req.url, method: req.method }
          );

          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          );
        }

        securityContext.security.csrfToken = csrfToken;
      }

      // 7. Audit logging - Request start
      if (config.auditLog?.enabled) {
        await AuditLogger.logSecurityEvent('REQUEST_START', securityContext, {
          method: req.method,
          url: req.url,
          userAgent,
          requiresAuth: config.requireAuthentication,
        });
      }

      // 8. Execute handler
      const response = await handler(req, securityContext);

      // 9. Apply security headers
      SecurityHeaders.apply(response, config.securityHeaders);

      // 10. Add security context headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set(
        'X-RateLimit-Remaining',
        securityContext.security.rateLimitRemaining.toString()
      );

      // 11. Audit logging - Request success
      if (config.auditLog?.logSuccess) {
        await AuditLogger.logSecurityEvent('REQUEST_SUCCESS', securityContext, {
          method: req.method,
          url: req.url,
          statusCode: response.status,
          duration: Date.now() - timestamp.getTime(),
        });
      }

      return response;
    } catch (error) {
      // Security error handling
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown security error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      SecurityLogger.suspiciousRequest(
        ipAddress,
        `Security middleware error: ${errorMessage}`,
        {
          url: req.url,
          method: req.method,
          error: errorStack,
        }
      );

      // Audit logging - Request failure
      if (config.auditLog?.logFailure) {
        await AuditLogger.logSecurityEvent('REQUEST_FAILURE', securityContext, {
          method: req.method,
          url: req.url,
          error: errorMessage,
          duration: Date.now() - timestamp.getTime(),
        });
      }

      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      );
    }
  };
}

// Preset security configurations
export const securityConfigs = {
  // Public endpoint (minimal security)
  public: {
    requireAuthentication: false,
    rateLimit: { enabled: true, maxRequests: 100, windowMs: 60000 },
    securityHeaders: { enabled: true, contentSecurityPolicy: true },
    auditLog: { enabled: true, logFailure: true },
  } as EnhancedSecurityConfig,

  // Authenticated endpoint
  authenticated: {
    requireAuthentication: true,
    rateLimit: { enabled: true, maxRequests: 200, windowMs: 60000 },
    securityHeaders: { enabled: true, contentSecurityPolicy: true },
    auditLog: { enabled: true, logSuccess: true, logFailure: true },
    csrfProtection: { enabled: true },
  } as EnhancedSecurityConfig,

  // Admin endpoint (maximum security)
  admin: {
    requireAuthentication: true,
    requiredRoles: ['admin'],
    requireMFA: true,
    requireSecureConnection: true,
    rateLimit: { enabled: true, maxRequests: 50, windowMs: 60000 },
    securityHeaders: {
      enabled: true,
      contentSecurityPolicy: true,
      strictTransportSecurity: true,
    },
    auditLog: {
      enabled: true,
      logSuccess: true,
      logFailure: true,
      sensitiveData: true,
    },
    csrfProtection: { enabled: true },
  } as EnhancedSecurityConfig,

  // Sensitive data endpoint
  sensitive: {
    requireAuthentication: true,
    requiredPermissions: [Permission.USER_READ],
    requireSecureConnection: true,
    rateLimit: { enabled: true, maxRequests: 30, windowMs: 60000 },
    securityHeaders: {
      enabled: true,
      contentSecurityPolicy: true,
      strictTransportSecurity: true,
    },
    auditLog: {
      enabled: true,
      logSuccess: true,
      logFailure: true,
      sensitiveData: true,
    },
    csrfProtection: { enabled: true },
  } as EnhancedSecurityConfig,
};

// Utility functions
export const SecurityUtils = {
  generateCSRFToken: CSRFProtection.generateToken,
  validateCSRFToken: CSRFProtection.validateToken,
  createSession: SessionManager.createSession,
  validateSession: SessionManager.validateSession,
  invalidateSession: SessionManager.invalidateSession,
  cleanupExpiredSessions: SessionManager.cleanupExpiredSessions,
  checkPermissions: AuthenticationValidator.checkPermissions,
  checkRoles: AuthenticationValidator.checkRoles,
  getClientIP: AuthenticationValidator.getClientIP,
};
