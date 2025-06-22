import { unstable_cache } from 'next/cache';

// Cache configuration
export const CACHE_TAGS = {
  JOBS: 'jobs',
  USER: 'user',
  ALERTS: 'alerts',
  ADS: 'ads',
  SEARCH: 'search',
} as const;

export const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// Generic cache wrapper for functions
export function createCachedFunction<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    keyPrefix: string;
    tags?: string[];
    revalidate?: number;
  }
): T {
  return unstable_cache(fn, [options.keyPrefix], {
    tags: options.tags,
    revalidate: options.revalidate || CACHE_DURATIONS.MEDIUM,
  }) as T;
}

// Cache key generators
export function generateCacheKey(
  prefix: string,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${prefix}:${sortedParams}`;
}

// Memory cache for client-side caching
class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  private maxSize = 100; // Maximum number of entries

  set(
    key: string,
    data: any,
    ttl: number = CACHE_DURATIONS.MEDIUM * 1000
  ): void {
    // Clean up expired entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

export const memoryCache = new MemoryCache();
