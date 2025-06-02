import { NextRequest, NextResponse } from 'next/server';
import { 
  withEnhancedSecurity, 
  securityConfigs, 
  Permission,
  SecurityUtils,
  type SecureAuthContext 
} from '../../../lib/middleware/enhanced-security';

// Example 1: Public endpoint with basic security
export const GET = withEnhancedSecurity(
  async (req: NextRequest, context: SecureAuthContext) => {
    // This endpoint is publicly accessible but has rate limiting and security headers
    return NextResponse.json({
      message: 'Public endpoint accessed successfully',
      requestId: context.security.requestId,
      timestamp: context.security.timestamp,
      rateLimitRemaining: context.security.rateLimitRemaining,
    });
  },
  securityConfigs.public
);

// Example 2: Authenticated endpoint with CSRF protection
export const POST = withEnhancedSecurity(
  async (req: NextRequest, context: SecureAuthContext) => {
    // User is guaranteed to be authenticated here
    const { user } = context;
    
    const body = await req.json();
    
    return NextResponse.json({
      message: 'Authenticated request processed',
      user: {
        id: user!.id,
        email: user!.email,
        role: user!.role,
      },
      requestId: context.security.requestId,
      csrfToken: context.security.csrfToken,
    });
  },
  securityConfigs.authenticated
);

// Example 3: Admin-only endpoint with maximum security
export const PUT = withEnhancedSecurity(
  async (req: NextRequest, context: SecureAuthContext) => {
    // User is guaranteed to be admin with MFA verified
    const { user } = context;
    
    const body = await req.json();
    
    // Perform admin operations here
    return NextResponse.json({
      message: 'Admin operation completed',
      user: {
        id: user!.id,
        email: user!.email,
        role: user!.role,
        mfaVerified: user!.mfaVerified,
      },
      requestId: context.security.requestId,
    });
  },
  securityConfigs.admin
);

// Example 4: Custom security configuration for sensitive data
export const PATCH = withEnhancedSecurity(
  async (req: NextRequest, context: SecureAuthContext) => {
    const { user } = context;
    
    // Access sensitive user data
    return NextResponse.json({
      message: 'Sensitive data accessed',
      user: {
        id: user!.id,
        permissions: user!.permissions,
      },
      requestId: context.security.requestId,
    });
  },
  {
    requireAuthentication: true,
    requiredPermissions: [Permission.USER_READ, Permission.ANALYTICS_READ],
    requireSecureConnection: true,
    rateLimit: { 
      enabled: true, 
      maxRequests: 20, 
      windowMs: 60000 
    },
    securityHeaders: { 
      enabled: true, 
      contentSecurityPolicy: true, 
      strictTransportSecurity: true 
    },
    auditLog: { 
      enabled: true, 
      logSuccess: true, 
      logFailure: true, 
      sensitiveData: true 
    },
    csrfProtection: { enabled: true },
  }
);

// Example 5: Role-based endpoint with custom permissions
export const DELETE = withEnhancedSecurity(
  async (req: NextRequest, context: SecureAuthContext) => {
    const { user } = context;
    
    // Only employers and admins can access this endpoint
    return NextResponse.json({
      message: 'Resource deleted successfully',
      user: {
        id: user!.id,
        role: user!.role,
      },
      requestId: context.security.requestId,
    });
  },
  {
    requireAuthentication: true,
    requiredRoles: ['employer', 'admin'],
    requiredPermissions: [Permission.JOB_DELETE],
    rateLimit: { 
      enabled: true, 
      maxRequests: 10, 
      windowMs: 60000 
    },
    auditLog: { 
      enabled: true, 
      logSuccess: true, 
      logFailure: true 
    },
    csrfProtection: { enabled: true },
  }
);

// Example utility function for CSRF token generation (not exported to avoid Next.js conflicts)
async function generateCSRFToken(req: NextRequest) {
  const token = SecurityUtils.generateCSRFToken();
  
  return NextResponse.json({
    csrfToken: token,
    expiresIn: 3600, // 1 hour
  });
}

// Example utility function for session management (not exported to avoid Next.js conflicts)
async function createUserSession(req: NextRequest, userId: string) {
  const ipAddress = SecurityUtils.getClientIP(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  const sessionId = await SecurityUtils.createSession(userId, ipAddress, userAgent);
  
  return NextResponse.json({
    sessionId,
    message: 'Session created successfully',
  });
}

// Example endpoint with manual security checks
export const OPTIONS = withEnhancedSecurity(
  async (req: NextRequest, context: SecureAuthContext) => {
    const { user } = context;
    
    // Manual permission check example
    if (user) {
      const hasJobWritePermission = await SecurityUtils.checkPermissions(
        user, 
        [Permission.JOB_WRITE]
      );
      
      const isEmployerOrAdmin = await SecurityUtils.checkRoles(
        user, 
        ['employer', 'admin']
      );
      
      return NextResponse.json({
        user: {
          id: user.id,
          role: user.role,
          permissions: user.permissions,
        },
        capabilities: {
          canCreateJobs: hasJobWritePermission && isEmployerOrAdmin,
          canModerateJobs: user.permissions.includes(Permission.JOB_MODERATE),
          canAccessAnalytics: user.permissions.includes(Permission.ANALYTICS_READ),
        },
        requestId: context.security.requestId,
      });
    }
    
    return NextResponse.json({
      message: 'Anonymous user capabilities',
      capabilities: {
        canCreateJobs: false,
        canModerateJobs: false,
        canAccessAnalytics: false,
      },
      requestId: context.security.requestId,
    });
  },
  {
    requireAuthentication: false, // Optional authentication
    rateLimit: { enabled: true, maxRequests: 100, windowMs: 60000 },
    securityHeaders: { enabled: true },
    auditLog: { enabled: true, logFailure: true },
  }
); 