import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';
import { RateLimitError } from '../errors/api-errors';

// Check if Redis is configured
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Initialize Redis client and rate limit configs lazily
let redis: Redis | null = null;
let rateLimitConfigs: Record<string, Ratelimit> = {};
let isInitialized = false;

// Lazy initialization function
function initializeRateLimit() {
  if (isInitialized) return;

  if (isRedisConfigured) {
    try {
      redis = Redis.fromEnv();

      // Define rate limit configurations
      rateLimitConfigs = {
        // General API limits (per IP)
        general: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
          analytics: true,
        }),

        // Authenticated user limits (per user ID)
        authenticated: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(200, '1 m'), // 200 requests per minute
          analytics: true,
        }),

        // Premium user limits (employers/admin)
        premium: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(500, '1 m'), // 500 requests per minute
          analytics: true,
        }),

        // Search endpoints (more restrictive)
        search: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 searches per minute
          analytics: true,
        }),

        // Authentication endpoints (very restrictive)
        auth: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 auth attempts per minute
          analytics: true,
        }),

        // File upload endpoints
        upload: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 uploads per minute
          analytics: true,
        }),
      };
    } catch (error) {
      console.warn('Failed to initialize Redis for rate limiting:', error);
      redis = null;
    }
  }

  isInitialized = true;
}

// Rate limit types
export type RateLimitType =
  | 'general'
  | 'authenticated'
  | 'premium'
  | 'search'
  | 'auth'
  | 'upload';

// Helper function to get client IP from NextRequest
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}

// Get client identifier (IP or user ID)
function getClientIdentifier(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get real IP from headers (for production behind proxy)
  const ip = getClientIP(req);
  return `ip:${ip}`;
}

// Determine rate limit type based on request
function getRateLimitType(req: NextRequest, userRole?: string): RateLimitType {
  const { pathname } = new URL(req.url);

  // Authentication endpoints
  if (
    pathname.includes('/auth/') ||
    pathname.includes('/register') ||
    pathname.includes('/login')
  ) {
    return 'auth';
  }

  // Search endpoints
  if (pathname.includes('/search') || pathname.includes('/semantic-search')) {
    return 'search';
  }

  // Upload endpoints
  if (
    pathname.includes('/upload') ||
    (req.method === 'POST' &&
      req.headers.get('content-type')?.includes('multipart/form-data'))
  ) {
    return 'upload';
  }

  // User role based limits
  if (userRole) {
    if (userRole === 'admin' || userRole === 'employer') {
      return 'premium';
    } else {
      return 'authenticated';
    }
  }

  return 'general';
}

// Rate limit result interface
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}

// Rate limiting middleware
export async function applyRateLimit(
  req: NextRequest,
  options?: {
    userId?: string;
    userRole?: string;
    customType?: RateLimitType;
  }
): Promise<RateLimitResult> {
  // Initialize rate limiting on first use
  initializeRateLimit();

  // Skip rate limiting in development if environment variable is set
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.SKIP_RATE_LIMIT === 'true'
  ) {
    return {
      success: true,
      limit: 1000,
      remaining: 999,
      reset: Date.now() + 60000,
      headers: getRateLimitHeaders(1000, 999, Date.now() + 60000),
    };
  }

  // If Redis is not configured, return a permissive result
  if (!isRedisConfigured || !redis) {
    console.warn(
      'Redis not configured for rate limiting, allowing all requests'
    );
    return {
      success: true,
      limit: 1000,
      remaining: 999,
      reset: Date.now() + 60000,
      headers: getRateLimitHeaders(1000, 999, Date.now() + 60000),
    };
  }

  const { userId, userRole, customType } = options || {};

  const rateLimitType = customType || getRateLimitType(req, userRole);
  const rateLimit = rateLimitConfigs[rateLimitType];

  if (!rateLimit) {
    console.warn(
      `Rate limit configuration not found for type: ${rateLimitType}`
    );
    return {
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
      headers: getRateLimitHeaders(100, 99, Date.now() + 60000),
    };
  }

  const identifier = getClientIdentifier(req, userId);

  try {
    const { success, limit, reset, remaining } =
      await rateLimit.limit(identifier);

    const result: RateLimitResult = {
      success,
      limit,
      remaining,
      reset,
      headers: getRateLimitHeaders(limit, remaining, reset),
    };

    if (!success) {
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.round((reset - Date.now()) / 1000)} seconds.`,
        result
      );
    }

    console.log(
      `Rate limit check passed for ${identifier} (${rateLimitType}): ${remaining}/${limit} remaining`
    );

    return result;
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }

    // If rate limiting service is down, log error but don't block requests
    console.error('Rate limiting service error:', error);

    // Return a fallback result
    return {
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
      headers: getRateLimitHeaders(100, 99, Date.now() + 60000),
    };
  }
}

// Rate limit headers for responses
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };
}

// Utility to check if request should be rate limited
export function shouldRateLimit(pathname: string): boolean {
  // Skip rate limiting for health checks, static assets, etc.
  const skipPaths = ['/health', '/favicon.ico', '/_next', '/static', '/public'];

  return !skipPaths.some(path => pathname.startsWith(path));
}
