// Environment configuration for API middleware

export const middlewareConfig = {
  // Rate limiting configuration
  rateLimit: {
    skipInDevelopment: process.env.SKIP_RATE_LIMIT === 'true',
    redis: {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
  },

  // CORS configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    apiAllowedOrigins: process.env.API_ALLOWED_ORIGINS?.split(',') || [],
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableExternalLogging: process.env.NODE_ENV === 'production',
    externalService: {
      // Add your logging service configuration here
      // e.g., DataDog, LogRocket, etc.
    },
  },

  // Performance monitoring
  monitoring: {
    slowRequestThreshold: parseInt(
      process.env.SLOW_REQUEST_THRESHOLD || '1000'
    ),
    enablePerformanceLogging: process.env.ENABLE_PERFORMANCE_LOGGING === 'true',
  },

  // Security headers
  security: {
    enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS !== 'false',
    contentSecurityPolicy: process.env.CSP_HEADER,
  },

  // Environment flags
  environment: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
} as const;

// Validation for required environment variables
export function validateMiddlewareConfig(): void {
  const errors: string[] = [];

  // Check for required Upstash configuration in production
  if (middlewareConfig.environment.isProduction) {
    if (!middlewareConfig.rateLimit.redis.url) {
      errors.push('UPSTASH_REDIS_REST_URL is required in production');
    }
    if (!middlewareConfig.rateLimit.redis.token) {
      errors.push('UPSTASH_REDIS_REST_TOKEN is required in production');
    }
  }

  // Check for CORS configuration in production
  if (
    middlewareConfig.environment.isProduction &&
    middlewareConfig.cors.allowedOrigins.length === 0
  ) {
    console.warn(
      'Warning: No ALLOWED_ORIGINS configured in production. CORS will be restrictive.'
    );
  }

  if (errors.length > 0) {
    throw new Error(`Middleware configuration errors:\n${errors.join('\n')}`);
  }
}

// Call validation on module load
if (typeof window === 'undefined') {
  try {
    validateMiddlewareConfig();
  } catch (error) {
    console.error('Middleware configuration validation failed:', error);
    if (middlewareConfig.environment.isProduction) {
      process.exit(1);
    }
  }
}
