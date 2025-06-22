import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

/**
 * AI Security Middleware
 * Protects AI endpoints from abuse and ensures user data privacy
 */

export interface AISecurityContext {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  isAuthenticated: boolean;
  rateLimitRemaining: number;
  requestId: string;
  body?: any; // Parsed request body
  startTime: number;
}

export interface AISecurityConfig {
  requireAuthentication?: boolean;
  maxRequestsPerMinute?: number;
  maxRequestsPerHour?: number;
  maxTokensPerRequest?: number;
  allowedRoles?: string[];
  logRequests?: boolean;
  blockSuspiciousPatterns?: boolean;
}

// Default security configurations
export const aiSecurityConfigs = {
  public: {
    requireAuthentication: false,
    maxRequestsPerMinute: 10,
    maxRequestsPerHour: 100,
    maxTokensPerRequest: 1000,
    logRequests: true,
    blockSuspiciousPatterns: true,
  },
  authenticated: {
    requireAuthentication: true,
    maxRequestsPerMinute: 30,
    maxRequestsPerHour: 500,
    maxTokensPerRequest: 2000,
    allowedRoles: ['jobseeker', 'employer', 'admin'],
    logRequests: true,
    blockSuspiciousPatterns: true,
  },
  premium: {
    requireAuthentication: true,
    maxRequestsPerMinute: 100,
    maxRequestsPerHour: 2000,
    maxTokensPerRequest: 4000,
    allowedRoles: ['employer', 'admin'],
    logRequests: true,
    blockSuspiciousPatterns: true,
  },
};

// In-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<
  string,
  {
    count: number;
    resetTime: number;
    hourlyCount: number;
    hourlyResetTime: number;
  }
>();

// Suspicious patterns to block
const suspiciousPatterns = [
  /show me all users/i,
  /list all resumes/i,
  /get user data/i,
  /admin password/i,
  /database/i,
  /sql injection/i,
  /drop table/i,
  /delete from/i,
  /update.*set/i,
  /insert into/i,
  /select.*from.*users/i,
  /show.*tables/i,
  /describe.*table/i,
  /personal information/i,
  /private data/i,
  /confidential/i,
  /social security/i,
  /credit card/i,
  /password/i,
  /api key/i,
  /secret/i,
  /token/i,
];

/**
 * Check if a message contains suspicious patterns
 */
function containsSuspiciousPatterns(message: string): boolean {
  return suspiciousPatterns.some(pattern => pattern.test(message));
}

/**
 * Rate limiting implementation
 */
function checkRateLimit(
  identifier: string,
  config: AISecurityConfig
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const minuteWindow = 60 * 1000; // 1 minute
  const hourWindow = 60 * 60 * 1000; // 1 hour

  const current = rateLimitStore.get(identifier) || {
    count: 0,
    resetTime: now + minuteWindow,
    hourlyCount: 0,
    hourlyResetTime: now + hourWindow,
  };

  // Reset minute counter if window expired
  if (now > current.resetTime) {
    current.count = 0;
    current.resetTime = now + minuteWindow;
  }

  // Reset hourly counter if window expired
  if (now > current.hourlyResetTime) {
    current.hourlyCount = 0;
    current.hourlyResetTime = now + hourWindow;
  }

  // Check limits
  const minuteLimit = config.maxRequestsPerMinute || 10;
  const hourlyLimit = config.maxRequestsPerHour || 100;

  if (current.count >= minuteLimit || current.hourlyCount >= hourlyLimit) {
    rateLimitStore.set(identifier, current);
    return { allowed: false, remaining: minuteLimit - current.count };
  }

  // Increment counters
  current.count++;
  current.hourlyCount++;
  rateLimitStore.set(identifier, current);

  return { allowed: true, remaining: minuteLimit - current.count };
}

/**
 * Log AI request for monitoring
 */
async function logAIRequest(
  userId: string | null,
  userMessage: string,
  ipAddress: string,
  userAgent: string,
  blocked: boolean = false,
  reason?: string
) {
  if (!process.env.AI_REQUEST_LOGGING_ENABLED) return;

  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || 'anonymous',
        action: 'AI_CHAT_REQUEST',
        resource: 'chat-job-search',
        details: {
          message: userMessage.substring(0, 500), // Truncate long messages
          ipAddress,
          userAgent,
          blocked,
          reason,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to log AI request:', error);
  }
}

/**
 * Main AI security middleware
 */
export function withAISecurity(
  handler: (
    req: NextRequest,
    context: AISecurityContext
  ) => Promise<NextResponse>,
  config: AISecurityConfig = aiSecurityConfigs.public
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = Math.random().toString(36).substring(7);
    const ipAddress =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      // 1. Authentication check
      let user = null;
      let isAuthenticated = false;

      if (config.requireAuthentication) {
        // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;
        if (!session?.user?.email) {
          return NextResponse.json(
            { error: 'Authentication required for this AI service' },
            { status: 401 }
          );
        }

        user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, email: true, role: true },
        });

        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 401 }
          );
        }

        isAuthenticated = true;

        // Check role permissions
        if (config.allowedRoles && !config.allowedRoles.includes(user.role)) {
          await logAIRequest(
            user.id,
            '',
            ipAddress,
            userAgent,
            true,
            'Insufficient role permissions'
          );
          return NextResponse.json(
            { error: 'Insufficient permissions for this AI service' },
            { status: 403 }
          );
        }
      } else {
        // Try to get user if available (optional auth)
        // TODO: Replace with Clerk
    const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } }; // Mock session
        if (session?.user?.email) {
          user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, email: true, role: true },
          });
          isAuthenticated = !!user;
        }
      }

      // 2. Rate limiting
      const rateLimitIdentifier = user?.id || ipAddress;
      const rateLimit = checkRateLimit(rateLimitIdentifier, config);

      if (!rateLimit.allowed) {
        await logAIRequest(
          user?.id || null,
          '',
          ipAddress,
          userAgent,
          true,
          'Rate limit exceeded'
        );
        return NextResponse.json(
          {
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter: 60,
          },
          { status: 429 }
        );
      }

      // 3. Parse request body once
      let body = null;
      let userMessage = '';

      try {
        body = await req.json();
        userMessage = body.userMessage || body.message || '';
      } catch (error) {
        // If body is not JSON or empty, continue without message checking
        body = null;
        userMessage = '';
      }

      if (
        config.blockSuspiciousPatterns &&
        userMessage &&
        containsSuspiciousPatterns(userMessage)
      ) {
        await logAIRequest(
          user?.id || null,
          userMessage,
          ipAddress,
          userAgent,
          true,
          'Suspicious pattern detected'
        );
        return NextResponse.json(
          { error: 'Request blocked due to security policy' },
          { status: 400 }
        );
      }

      // 4. Check message length
      if (
        config.maxTokensPerRequest &&
        userMessage.length > config.maxTokensPerRequest
      ) {
        await logAIRequest(
          user?.id || null,
          userMessage,
          ipAddress,
          userAgent,
          true,
          'Message too long'
        );
        return NextResponse.json(
          { error: 'Message too long. Please shorten your request.' },
          { status: 400 }
        );
      }

      // 5. Log request if enabled
      if (config.logRequests && userMessage) {
        await logAIRequest(user?.id || null, userMessage, ipAddress, userAgent);
      }

      // 6. Create security context
      const context: AISecurityContext = {
        user: user || undefined,
        isAuthenticated,
        rateLimitRemaining: rateLimit.remaining,
        requestId,
        body,
        startTime: Date.now(),
      };

      // 7. Call the handler
      return await handler(req, context);
    } catch (error) {
      console.error('AI Security middleware error:', error);
      return NextResponse.json(
        { error: 'Security check failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Sanitize user data before sending to AI
 */
export function sanitizeUserData(userData: any): any {
  if (!userData) return null;

  // Remove sensitive fields
  const sanitized = { ...userData };
  delete sanitized.passwordHash;
  delete sanitized.twoFactorSecret;
  delete sanitized.magicLinkToken;
  delete sanitized.passwordResetToken;
  delete sanitized.stripeCustomerId;
  delete sanitized.phoneNumber;
  delete sanitized.resumeUrl; // Don't send resume URLs to AI

  return sanitized;
}
