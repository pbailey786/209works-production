/**
 * Enhanced Cache Manager for 209 Works
 * Provides comprehensive caching with performance optimization, regional support, and CDN integration
 */

import { unstable_cache, revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { getDomainConfig } from '@/lib/domain/config';

// Cache configuration constants
export const CACHE_DURATIONS = {
  INSTANT: 0,
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes  
  LONG: 1800,       // 30 minutes
  VERY_LONG: 3600,  // 1 hour
  DAILY: 86400,     // 24 hours
  WEEKLY: 604800,   // 7 days
} as const;

export const CACHE_TAGS = {
  // Core entities
  JOBS: 'jobs',
  USERS: 'users',
  COMPANIES: 'companies',
  APPLICATIONS: 'applications',
  
  // Features
  SEARCH: 'search',
  ANALYTICS: 'analytics',
  ALERTS: 'alerts',
  ADS: 'ads',
  
  // Regional
  REGIONAL: 'regional',
  DOMAIN_CONFIG: 'domain-config',
  
  // AI/ML
  AI_RESPONSES: 'ai-responses',
  RECOMMENDATIONS: 'recommendations',
  
  // Static content
  STATIC_CONTENT: 'static-content',
  SEO_DATA: 'seo-data',
} as const;

// Regional cache prefixes
export const REGIONAL_CACHE_PREFIXES = {
  '209': 'cv',    // Central Valley
  '916': 'sac',   // Sacramento
  '510': 'eb',    // East Bay
  '925': 'tv',    // Tri-Valley
  '559': 'fr',    // Fresno
  'norcal': 'nc', // Northern California
} as const;

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  regional?: boolean;
  revalidateOnStale?: boolean;
  compression?: boolean;
}

export interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  avgResponseTime: number;
  slowQueries: number;
  totalRequests: number;
}

/**
 * Enhanced Cache Manager with regional support and performance optimization
 */
export class EnhancedCacheManager {
  private static metrics: PerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    avgResponseTime: 0,
    slowQueries: 0,
    totalRequests: 0,
  };

  /**
   * Create a cached function with regional support
   */
  static createCachedFunction<T extends (...args: any[]) => any>(
    fn: T,
    options: {
      keyPrefix: string;
      tags?: string[];
      ttl?: number;
      regional?: boolean;
      compression?: boolean;
    }
  ): T {
    const { keyPrefix, tags = [], ttl = CACHE_DURATIONS.MEDIUM, regional = false } = options;

    return (async (...args: Parameters<T>) => {
      const startTime = Date.now();
      this.metrics.totalRequests++;

      try {
        // Generate cache key with regional prefix if needed
        let cacheKey = keyPrefix;
        
        if (regional) {
          const region = await this.getCurrentRegion();
          const regionPrefix = REGIONAL_CACHE_PREFIXES[region as keyof typeof REGIONAL_CACHE_PREFIXES] || region;
          cacheKey = `${regionPrefix}:${keyPrefix}`;
        }

        // Add arguments to cache key
        if (args.length > 0) {
          const argsHash = this.hashArguments(args);
          cacheKey = `${cacheKey}:${argsHash}`;
        }

        // Create regional tags
        const finalTags = regional ? [...tags, CACHE_TAGS.REGIONAL, `region:${await this.getCurrentRegion()}`] : tags;

        // Use Next.js unstable_cache with our enhanced options
        const cachedFn = unstable_cache(
          async (...fnArgs: Parameters<T>) => {
            this.metrics.cacheMisses++;
            const result = await fn(...fnArgs);
            
            // Track slow queries
            const duration = Date.now() - startTime;
            if (duration > 1000) {
              this.metrics.slowQueries++;
              console.warn(`Slow cache operation: ${keyPrefix} took ${duration}ms`);
            }
            
            return result;
          },
          [cacheKey],
          {
            tags: finalTags,
            revalidate: ttl,
          }
        );

        const result = await cachedFn(...args);
        
        // Update metrics
        const duration = Date.now() - startTime;
        this.metrics.avgResponseTime = (this.metrics.avgResponseTime + duration) / 2;
        
        if (duration < 50) { // Assume cache hit if very fast
          this.metrics.cacheHits++;
        }

        return result;
      } catch (error) {
        console.error(`Cache error for ${keyPrefix}:`, error);
        // Fallback to direct function call
        return await fn(...args);
      }
    }) as T;
  }

  /**
   * Get current region from headers
   */
  private static async getCurrentRegion(): Promise<string> {
    try {
      const headersList = await headers();
      const hostname = headersList.get('host') || '';
      const domainConfig = getDomainConfig(hostname);
      return domainConfig.areaCode;
    } catch {
      return '209'; // Default fallback
    }
  }

  /**
   * Hash function arguments for cache key generation
   */
  private static hashArguments(args: any[]): string {
    try {
      const serialized = JSON.stringify(args, (key, value) => {
        // Handle special types that don't serialize well
        if (value instanceof Date) return value.toISOString();
        if (typeof value === 'function') return value.toString();
        return value;
      });
      
      // Simple hash function
      let hash = 0;
      for (let i = 0; i < serialized.length; i++) {
        const char = serialized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return Math.abs(hash).toString(36);
    } catch {
      // Fallback for non-serializable arguments
      return Date.now().toString(36);
    }
  }

  /**
   * Invalidate cache by tags
   */
  static async invalidateByTags(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        revalidateTag(tag);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate regional cache
   */
  static async invalidateRegionalCache(region: string): Promise<void> {
    await this.invalidateByTags([CACHE_TAGS.REGIONAL, `region:${region}`]);
  }

  /**
   * Invalidate all regional caches
   */
  static async invalidateAllRegionalCaches(): Promise<void> {
    const regions = Object.keys(REGIONAL_CACHE_PREFIXES);
    for (const region of regions) {
      await this.invalidateRegionalCache(region);
    }
  }

  /**
   * Get performance metrics
   */
  static getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  static resetMetrics(): void {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      avgResponseTime: 0,
      slowQueries: 0,
      totalRequests: 0,
    };
  }

  /**
   * Get cache hit ratio
   */
  static getCacheHitRatio(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? this.metrics.cacheHits / total : 0;
  }
}

/**
 * Decorator for caching class methods
 */
export function Cached(options: {
  keyPrefix: string;
  ttl?: number;
  tags?: string[];
  regional?: boolean;
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = EnhancedCacheManager.createCachedFunction(
      originalMethod,
      {
        keyPrefix: `${target.constructor.name}.${propertyKey}`,
        ...options,
      }
    );
    
    return descriptor;
  };
}

/**
 * Utility functions for common caching patterns
 */
export const CacheUtils = {
  /**
   * Cache a database query with automatic regional filtering
   */
  cacheQuery: <T>(
    queryFn: () => Promise<T>,
    keyPrefix: string,
    options: CacheOptions = {}
  ): Promise<T> => {
    const cachedFn = EnhancedCacheManager.createCachedFunction(
      queryFn,
      {
        keyPrefix,
        ttl: options.ttl || CACHE_DURATIONS.MEDIUM,
        tags: options.tags || [],
        regional: options.regional || false,
      }
    );
    
    return cachedFn();
  },

  /**
   * Cache API responses with compression
   */
  cacheApiResponse: <T>(
    apiFn: () => Promise<T>,
    keyPrefix: string,
    ttl: number = CACHE_DURATIONS.SHORT
  ): Promise<T> => {
    return CacheUtils.cacheQuery(
      apiFn,
      `api:${keyPrefix}`,
      { ttl, compression: true }
    );
  },

  /**
   * Cache search results with regional filtering
   */
  cacheSearchResults: <T>(
    searchFn: () => Promise<T>,
    query: string,
    filters: Record<string, any> = {}
  ): Promise<T> => {
    const filterHash = EnhancedCacheManager['hashArguments']([filters]);
    return CacheUtils.cacheQuery(
      searchFn,
      `search:${query}:${filterHash}`,
      {
        ttl: CACHE_DURATIONS.SHORT,
        tags: [CACHE_TAGS.SEARCH],
        regional: true,
      }
    );
  },
};

export default EnhancedCacheManager;
