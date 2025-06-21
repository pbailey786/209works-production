/**
 * Security Middleware for 209 Works
 * Comprehensive security protection with threat detection and blocking
 */

import { NextRequest, NextResponse } from 'next/server';
import EnterpriseSecurityManager from '@/lib/security/enterprise-security';
import { getDomainConfig } from '@/lib/domain/config';
import path from "path";

export interface SecurityMiddlewareConfig {
  enableThreatDetection: boolean;
  enableRateLimiting: boolean;
  enableIPBlocking: boolean;
  enableSQLInjectionProtection: boolean;
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  rateLimitRequests: number;
  rateLimitWindow: number; // in minutes
}

const DEFAULT_CONFIG: SecurityMiddlewareConfig = {
  enableThreatDetection: true,
  enableRateLimiting: true,
  enableIPBlocking: true,
  enableSQLInjectionProtection: true,
  enableXSSProtection: true,
  enableCSRFProtection: true,
  rateLimitRequests: 100,
  rateLimitWindow: 15, // 15 minutes
};

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Security Middleware
 */
export async function securityMiddleware(
  request: NextRequest,
  config: Partial<SecurityMiddlewareConfig> = {}
): Promise<NextResponse | null> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const securityManager = EnterpriseSecurityManager.getInstance();
  
  // Get request details
  const ipAddress = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const hostname = request.headers.get('host') || '';
  const domainConfig = getDomainConfig(hostname);
  const url = request.url;
  const method = request.method;

  try {
    // 1. Check if IP is blocked
    if (fullConfig.enableIPBlocking && securityManager.isIPBlocked(ipAddress)) {
      await logSecurityEvent(securityManager, {
        type: 'authorization',
        severity: 'high',
        ipAddress,
        userAgent,
        resource: url,
        action: 'blocked_ip_access',
        details: { reason: 'IP address is blocked' },
        region: domainConfig.areaCode,
        blocked: true,
      });

      return new NextResponse('Access Denied', { 
        status: 403,
        headers: {
          'X-Security-Block': 'IP_BLOCKED',
        },
      });
    }

    // 2. Rate limiting
    if (fullConfig.enableRateLimiting) {
      const rateLimitResult = checkRateLimit(
        ipAddress, 
        fullConfig.rateLimitRequests, 
        fullConfig.rateLimitWindow
      );
      
      if (!rateLimitResult.allowed) {
        await logSecurityEvent(securityManager, {
          type: 'suspicious_activity',
          severity: 'medium',
          ipAddress,
          userAgent,
          resource: url,
          action: 'rate_limit_exceeded',
          details: { 
            requestCount: rateLimitResult.count,
            limit: fullConfig.rateLimitRequests,
            window: fullConfig.rateLimitWindow,
          },
          region: domainConfig.areaCode,
          blocked: true,
        });

        return new NextResponse('Rate Limit Exceeded', { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': fullConfig.rateLimitRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          },
        });
      }
    }

    // 3. SQL Injection Protection
    if (fullConfig.enableSQLInjectionProtection) {
      const sqlInjectionDetected = detectSQLInjection(request);
      if (sqlInjectionDetected) {
        await logSecurityEvent(securityManager, {
          type: 'suspicious_activity',
          severity: 'critical',
          ipAddress,
          userAgent,
          resource: url,
          action: 'sql_injection_attempt',
          details: { 
            detectedPattern: sqlInjectionDetected,
            method,
            url,
          },
          region: domainConfig.areaCode,
          blocked: true,
        });

        return new NextResponse('Security Violation Detected', { 
          status: 400,
          headers: {
            'X-Security-Block': 'SQL_INJECTION',
          },
        });
      }
    }

    // 4. XSS Protection
    if (fullConfig.enableXSSProtection) {
      const xssDetected = detectXSS(request);
      if (xssDetected) {
        await logSecurityEvent(securityManager, {
          type: 'suspicious_activity',
          severity: 'high',
          ipAddress,
          userAgent,
          resource: url,
          action: 'xss_attempt',
          details: { 
            detectedPattern: xssDetected,
            method,
            url,
          },
          region: domainConfig.areaCode,
          blocked: true,
        });

        return new NextResponse('Security Violation Detected', { 
          status: 400,
          headers: {
            'X-Security-Block': 'XSS_ATTEMPT',
          },
        });
      }
    }

    // 5. Log legitimate request
    if (fullConfig.enableThreatDetection) {
      await logSecurityEvent(securityManager, {
        type: 'data_access',
        severity: 'low',
        ipAddress,
        userAgent,
        resource: url,
        action: method.toLowerCase(),
        details: { 
          legitimate: true,
          path: new URL(url).pathname,
        },
        region: domainConfig.areaCode,
        blocked: false,
      });
    }

    // Request is clean, continue
    return null;

  } catch (error) {
    console.error('Security middleware error:', error);
    
    // Log the error but don't block the request
    await logSecurityEvent(securityManager, {
      type: 'suspicious_activity',
      severity: 'medium',
      ipAddress,
      userAgent,
      resource: url,
      action: 'security_middleware_error',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      region: domainConfig.areaCode,
      blocked: false,
    });

    // Continue with request
    return null;
  }
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  
  // Fallback to connection IP (may not be available in all environments)
  return request.ip || '127.0.0.1';
}

/**
 * Rate limiting check
 */
function checkRateLimit(
  identifier: string, 
  maxRequests: number, 
  windowMinutes: number
): { allowed: boolean; count: number; resetTime: number } {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const resetTime = Math.ceil(now / windowMs) * windowMs;
  
  const key = `${identifier}:${Math.floor(now / windowMs)}`;
  const current = rateLimitStore.get(key);
  
  if (!current) {
    rateLimitStore.set(key, { count: 1, resetTime });
    
    // Clean up old entries
    cleanupRateLimitStore(now, windowMs);
    
    return { allowed: true, count: 1, resetTime };
  }
  
  current.count++;
  
  return {
    allowed: current.count <= maxRequests,
    count: current.count,
    resetTime,
  };
}

/**
 * Clean up old rate limit entries
 */
function cleanupRateLimitStore(now: number, windowMs: number) {
  const cutoff = now - windowMs;
  
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < cutoff) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Detect SQL injection attempts
 */
function detectSQLInjection(request: NextRequest): string | null {
  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bEXEC\b|\bEXECUTE\b)/i,
    /(\bSCRIPT\b)/i,
    /(--|\#|\/\*)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
  ];

  // Check URL parameters
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(searchParams)) {
      return pattern.toString();
    }
  }

  // Check headers
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(userAgent) || pattern.test(referer)) {
      return pattern.toString();
    }
  }

  return null;
}

/**
 * Detect XSS attempts
 */
function detectXSS(request: NextRequest): string | null {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/i,
    /javascript:/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /onmouseover\s*=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
  ];

  // Check URL parameters
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  
  for (const pattern of xssPatterns) {
    if (pattern.test(searchParams)) {
      return pattern.toString();
    }
  }

  // Check headers
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  
  for (const pattern of xssPatterns) {
    if (pattern.test(userAgent) || pattern.test(referer)) {
      return pattern.toString();
    }
  }

  return null;
}

/**
 * Log security event
 */
async function logSecurityEvent(
  securityManager: EnterpriseSecurityManager,
  event: Omit<any, 'id' | 'timestamp'>
) {
  try {
    await securityManager.processSecurityEvent(event);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.clerk.dev https://*.supabase.co",
    "frame-src 'self' https://js.stripe.com",
  ].path.join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

export default securityMiddleware;
