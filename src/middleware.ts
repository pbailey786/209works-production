import { NextRequest, NextResponse } from 'next/server';
import { getDomainConfig, isValidDomain, DEFAULT_DOMAIN } from '@/lib/domain/config';
// import { validateEncryptionEnvironment } from '@/lib/encryption';

// TEMPORARILY DISABLE ENCRYPTION VALIDATION TO FIX EDGE RUNTIME ISSUE
// Validate encryption environment on server startup
// try {
//   validateEncryptionEnvironment();
//   console.log('✅ Encryption environment validation passed');
// } catch (error) {
//   console.error('❌ Encryption environment validation failed:', error);
//   // process.exit(1); // Not supported in Edge Runtime
// }

// Security configuration
const SECURITY_CONFIG = {
  // Content Security Policy
  contentSecurityPolicy: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // TODO: Remove and use nonces in production
      "'unsafe-eval'", // Required for Next.js dev mode
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
      "https://www.google.com",
      "https://www.gstatic.com",
      "https://apis.google.com",
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind CSS
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net",
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com",
      "data:",
    ],
    'img-src': [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "http:", // Allow all image sources for job logos, avatars, etc.
    ],
    'connect-src': [
      "'self'",
      "https://api.openai.com",
      "https://api.anthropic.com",
      "https://upload.uploadcare.com",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
      ...(process.env.NODE_ENV === 'development' ? [
        "http://localhost:3000",
        "ws://localhost:3000",
        "ws://localhost:*",
        "http://localhost:*",
      ] : []),
    ],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'", "data:", "blob:"],
  },
};

// Convert CSP object to string
function buildCSPHeader(csp: typeof SECURITY_CONFIG.contentSecurityPolicy): string {
  return Object.entries(csp)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

// Apply security headers
function applySecurityHeaders(request: NextRequest, response: NextResponse) {
  // Content Security Policy
  const cspHeader = buildCSPHeader(SECURITY_CONFIG.contentSecurityPolicy);
  response.headers.set('Content-Security-Policy', cspHeader);

  // Strict Transport Security (HSTS)
  if (request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Additional security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()'
  );

  // Remove server information
  response.headers.set('Server', '');
  response.headers.delete('X-Powered-By');

  return response;
}

// HTTPS enforcement
function enforceHTTPS(request: NextRequest): NextResponse | null {
  // Skip HTTPS enforcement in development
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  // Force HTTPS in production
  if (request.nextUrl.protocol === 'http:') {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = 'https:';

    return NextResponse.redirect(httpsUrl, 301);
  }

  return null;
}

// Rate limiting check (integration with existing rate limiting)
function shouldApplyRateLimit(pathname: string): boolean {
  // Skip rate limiting for static assets
  if (pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/_next') ||
      pathname.includes('.')) {
    return false;
  }

  return true;
}

// Domain traffic logging
function logDomainTraffic(request: NextRequest, domainConfig: any) {
  if (process.env.NODE_ENV === 'production') {
    // Log domain traffic for analytics
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`[DOMAIN_TRAFFIC] ${domainConfig.domain} - ${request.nextUrl.pathname} - ${ip}`);
  }
}

// Handle legacy domain redirects
function handleLegacyRedirects(request: NextRequest): NextResponse | null {
  const hostname = request.nextUrl.hostname;
  const pathname = request.nextUrl.pathname;

  // Redirect from old .com/.net domains to .works
  if (hostname === '209jobs.com' || hostname === 'www.209jobs.com') {
    const newUrl = new URL(request.url);
    newUrl.hostname = '209.works';
    return NextResponse.redirect(newUrl, 301);
  }

  // Handle www redirects for .works domains
  if (hostname.startsWith('www.') && hostname.endsWith('.works')) {
    const newUrl = new URL(request.url);
    newUrl.hostname = hostname.replace('www.', '');
    return NextResponse.redirect(newUrl, 301);
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // 1. Handle legacy domain redirects first
  const legacyRedirect = handleLegacyRedirects(request);
  if (legacyRedirect) {
    return legacyRedirect;
  }

  // 2. HTTPS Enforcement
  const httpsRedirect = enforceHTTPS(request);
  if (httpsRedirect) {
    return httpsRedirect;
  }

  // 3. Skip middleware for static files and internal Next.js routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 4. Get domain configuration
  const domainConfig = getDomainConfig(hostname);

  // 5. Log domain traffic
  logDomainTraffic(request, domainConfig);

  // 6. Apply security headers and domain context
  const response = NextResponse.next();
  applySecurityHeaders(request, response);

  // Add domain context headers for client-side access
  response.headers.set('x-domain-config', JSON.stringify({
    domain: domainConfig.domain,
    areaCode: domainConfig.areaCode,
    region: domainConfig.region,
    displayName: domainConfig.displayName
  }));

  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};