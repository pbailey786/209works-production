import { NextRequest, NextResponse } from 'next/server';

// CORS configuration interface
export interface CORSConfig {
  origin: string | string[] | boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

// Default CORS configuration
const defaultCORSConfig: CORSConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS?.split(',') || false)
    : true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent',
    'DNT',
    'Cache-Control',
    'X-Mx-ReqToken',
    'Keep-Alive',
    'X-Requested-With',
    'If-Modified-Since',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining', 
    'X-RateLimit-Reset',
    'X-Request-ID',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Check if origin is allowed
function isOriginAllowed(origin: string | null, allowedOrigin: string | string[] | boolean): boolean {
  if (allowedOrigin === true) return true;
  if (allowedOrigin === false) return false;
  if (!origin) return false;
  
  if (typeof allowedOrigin === 'string') {
    return origin === allowedOrigin;
  }
  
  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(origin);
  }
  
  return false;
}

// Apply CORS headers
export function applyCORS(
  req: NextRequest,
  res: NextResponse,
  config: Partial<CORSConfig> = {}
): NextResponse {
  const corsConfig = { ...defaultCORSConfig, ...config };
  const origin = req.headers.get('Origin');
  
  // Check if origin is allowed
  if (isOriginAllowed(origin, corsConfig.origin)) {
    if (origin) {
      res.headers.set('Access-Control-Allow-Origin', origin);
    } else if (corsConfig.origin === true) {
      res.headers.set('Access-Control-Allow-Origin', '*');
    }
  }
  
  // Set credentials header
  if (corsConfig.credentials) {
    res.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  // Set allowed methods
  res.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
  
  // Set allowed headers
  res.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
  
  // Set exposed headers
  if (corsConfig.exposedHeaders.length > 0) {
    res.headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
  }
  
  // Set max age for preflight requests
  res.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());
  
  return res;
}

// Handle preflight requests
export function handlePreflight(req: NextRequest, config: Partial<CORSConfig> = {}): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return applyCORS(req, response, config);
}

// CORS middleware wrapper
export function withCORS<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  config: Partial<CORSConfig> = {}
): T {
  return (async (req: NextRequest, ...args: any[]) => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return handlePreflight(req, config);
    }
    
    // Execute the actual handler
    const response = await handler(req, ...args);
    
    // Apply CORS headers to the response
    return applyCORS(req, response, config);
  }) as T;
}

// Environment-specific CORS configurations
export const corsConfigs = {
  // Development: Allow all origins
  development: {
    origin: true,
    credentials: true,
  } as Partial<CORSConfig>,
  
  // Production: Restrict to specific domains
  production: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
    credentials: true,
  } as Partial<CORSConfig>,
  
  // API-only: More restrictive for pure API endpoints
  api: {
    origin: process.env.API_ALLOWED_ORIGINS?.split(',') || false,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  } as Partial<CORSConfig>,
  
  // Public: For public endpoints that don't need credentials
  public: {
    origin: true,
    credentials: false,
    methods: ['GET', 'POST'],
  } as Partial<CORSConfig>,
};

// Get CORS config based on environment and endpoint type
export function getCORSConfig(type: keyof typeof corsConfigs = 'development'): Partial<CORSConfig> {
  const envType = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  return corsConfigs[type] || corsConfigs[envType];
} 