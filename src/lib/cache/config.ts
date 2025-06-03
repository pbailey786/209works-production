/**
 * Cache configuration constants
 */

// Default cache TTL values (in seconds)
export const DEFAULT_TTL = {
  short: 60 * 5, // 5 minutes
  medium: 60 * 30, // 30 minutes
  long: 60 * 60 * 2, // 2 hours
  veryLong: 60 * 60 * 24, // 24 hours
} as const;

// Cache key prefixes
export const CACHE_PREFIXES = {
  jobs: 'jobs',
  users: 'users',
  search: 'search',
  stats: 'stats',
  session: 'session',
  alerts: 'alerts',
  ads: 'ads',
  analytics: 'analytics',
  company: 'company',
  knowledge: 'knowledge',
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  // Maximum cache key length
  maxKeyLength: 250,

  // Maximum value size (in bytes)
  maxValueSize: 1024 * 1024 * 5, // 5MB

  // Enable compression for large values
  compressionThreshold: 1024 * 10, // 10KB

  // Cache versioning
  version: '1.0',

  // Default options
  defaultOptions: {
    ttl: DEFAULT_TTL.medium,
    compress: false,
    tags: [],
  },
} as const;

// Cache invalidation strategies
export enum InvalidationStrategy {
  IMMEDIATE = 'immediate',
  LAZY = 'lazy',
  SCHEDULED = 'scheduled',
}

// Cache metrics
export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

// Initialize empty metrics
export const initializeMetrics = (): CacheMetrics => ({
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
  hitRate: 0,
});
