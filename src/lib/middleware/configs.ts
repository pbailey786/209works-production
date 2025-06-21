import { APIMiddlewareConfig } from './api';
import { RateLimitType } from './ratelimit';
import { getCORSConfig } from './cors';

// Preset configurations for common use cases
export const apiConfigs = {
  // Public endpoint (no auth, basic rate limiting)
  public: {
    requireAuthentication: false,
    rateLimit: { enabled: true, type: 'general' as RateLimitType },
    cors: { enabled: true, config: getCORSConfig('public') },
    logging: { enabled: true },
  } as APIMiddlewareConfig,

  // Authenticated endpoint
  authenticated: {
    requireAuthentication: true,
    rateLimit: { enabled: true, type: 'authenticated' as RateLimitType },
    cors: { enabled: true },
    logging: { enabled: true },
  } as APIMiddlewareConfig,

  // Admin only endpoint
  admin: {
    requiredRoles: ['admin'],
    rateLimit: { enabled: true, type: 'premium' as RateLimitType },
    cors: { enabled: true },
    logging: { enabled: true, includeBody: true },
  } as APIMiddlewareConfig,

  // Employer endpoint
  employer: {
    requiredRoles: ['admin', 'employer'],
    rateLimit: { enabled: true, type: 'premium' as RateLimitType },
    cors: { enabled: true },
    logging: { enabled: true },
  } as APIMiddlewareConfig,

  // Search endpoint (rate limited)
  search: {
    requireAuthentication: false,
    rateLimit: { enabled: true, type: 'search' as RateLimitType },
    cors: { enabled: true },
    logging: { enabled: true, includeQuery: true },
  } as APIMiddlewareConfig,

  // Upload endpoint
  upload: {
    requireAuthentication: true,
    rateLimit: { enabled: true, type: 'upload' as RateLimitType },
    cors: { enabled: true },
    logging: { enabled: true },
  } as APIMiddlewareConfig,

  // Authentication endpoint (heavily rate limited)
  auth: {
    requireAuthentication: false,
    rateLimit: { enabled: true, type: 'auth' as RateLimitType },
    cors: { enabled: true },
    logging: { enabled: true, includeBody: false }, // Don't log passwords
  } as APIMiddlewareConfig,
};

// Utility function to merge configs
export function mergeAPIConfig(
  baseConfig: APIMiddlewareConfig,
  overrides: Partial<APIMiddlewareConfig>
): APIMiddlewareConfig {
  return {
    ...baseConfig,
    ...overrides,
    rateLimit: {
      ...baseConfig.rateLimit,
      ...overrides.rateLimit,
    },
    cors: {
      ...baseConfig.cors,
      ...overrides.cors,
    },
    logging: {
      ...baseConfig.logging,
      ...overrides.logging,
    },
    monitoring: {
      ...baseConfig.monitoring,
      ...overrides.monitoring,
    },
  };
}
