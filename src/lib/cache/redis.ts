import Redis from 'ioredis';
import { getMockRedis } from '../redis-mock';

// Redis client singleton with proper locking
let redis: Redis | null = null;
let isConnecting = false;
let connectionPromise: Promise<Redis> | null = null;

// Redis configuration with connection pooling and limits
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  // Connection pooling configuration
  family: 4, // 4 (IPv4) or 6 (IPv6)
  connectTimeout: 10000, // 10 seconds
  commandTimeout: 5000, // 5 seconds
  // Connection pool limits
  maxLoadingTimeout: 5000,
  enableOfflineQueue: false,
  // Use Upstash Redis if available (for production)
  ...(process.env.UPSTASH_REDIS_REST_URL && {
    host: new URL(process.env.UPSTASH_REDIS_REST_URL).hostname,
    port: parseInt(new URL(process.env.UPSTASH_REDIS_REST_URL).port) || 6379,
    password: process.env.UPSTASH_REDIS_REST_TOKEN,
    tls: process.env.UPSTASH_REDIS_REST_URL.startsWith('rediss://')
      ? {}
      : undefined,
  }),
};

// Connection state tracking
let connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' =
  'disconnected';
let lastConnectionError: Error | null = null;

// Initialize Redis client with proper race condition handling
export async function getRedisClient(): Promise<Redis | any> {
  // Check if Redis is disabled or no URL provided
  if (process.env.REDIS_DISABLED === 'true' || !process.env.REDIS_URL) {
    return getMockRedis();
  }

  // If we already have a connected client, return it
  if (redis && connectionState === 'connected') {
    return redis;
  }

  // If we're already connecting, wait for that connection
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  // Start new connection
  isConnecting = true;
  connectionState = 'connecting';

  connectionPromise = new Promise<Redis>((resolve, reject) => {
    try {
      const client = new Redis(redisConfig);

      // Set up event handlers before connecting
      client.on('connect', () => {
        console.log('Redis connected successfully');
        connectionState = 'connected';
        lastConnectionError = null;
      });

      client.on('ready', () => {
        console.log('Redis client ready');
        connectionState = 'connected';
        isConnecting = false;
        redis = client;
        resolve(client);
      });

      client.on('error', error => {
        console.error('Redis connection error:', error);
        connectionState = 'error';
        lastConnectionError = error;
        isConnecting = false;

        // Clean up failed connection
        if (redis === client) {
          redis = null;
        }

        reject(error);
      });

      client.on('close', () => {
        console.log('Redis connection closed');
        connectionState = 'disconnected';
        if (redis === client) {
          redis = null;
        }
      });

      client.on('reconnecting', () => {
        console.log('Redis reconnecting...');
        connectionState = 'connecting';
      });

      // Attempt to connect
      client.connect().catch(error => {
        console.error('Failed to connect to Redis:', error);
        connectionState = 'error';
        lastConnectionError = error;
        isConnecting = false;
        reject(error);
      });
    } catch (error) {
      console.error('Error creating Redis client:', error);
      connectionState = 'error';
      lastConnectionError = error as Error;
      isConnecting = false;
      reject(error);
    }
  });

  return connectionPromise;
}

// Check if Redis is available with proper error handling
export async function isRedisAvailable(): Promise<boolean> {
  // Check if Redis is disabled
  if (process.env.REDIS_DISABLED === 'true') {
    return false;
  }

  try {
    // Check connection state first
    if (connectionState === 'error' && lastConnectionError) {
      return false;
    }

    const client = await getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.warn('Redis not available:', error);
    return false;
  }
}

// Get connection state for monitoring
export function getRedisConnectionState(): {
  state: typeof connectionState;
  lastError: Error | null;
  isConnecting: boolean;
} {
  return {
    state: connectionState,
    lastError: lastConnectionError,
    isConnecting,
  };
}

// Cache interface
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  compress?: boolean; // Compress large values
}

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
} as const;

// Generate cache key with validation
export function generateCacheKey(
  prefix: string,
  ...parts: (string | number)[]
): string {
  if (!prefix || parts.some(part => part === null || part === undefined)) {
    throw new Error('Invalid cache key parameters');
  }
  return `${prefix}:${parts.join(':')}`;
}

// Serialize data for caching with error handling
function serialize(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Failed to serialize data for cache:', error);
    throw new Error('Cache serialization failed');
  }
}

// Deserialize cached data with error handling
function deserialize<T>(data: string | null): T | null {
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to deserialize cached data:', error);
    return null;
  }
}

// Set cache value with improved error handling
export async function setCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  try {
    if (!key || value === undefined) {
      throw new Error('Invalid cache key or value');
    }

    if (!(await isRedisAvailable())) {
      return false;
    }

    const client = await getRedisClient();
    const serialized = serialize(value);
    const { ttl = DEFAULT_TTL.medium, tags = [] } = options;

    // Validate TTL
    if (ttl <= 0 || ttl > DEFAULT_TTL.veryLong * 7) {
      // Max 1 week
      throw new Error('Invalid TTL value');
    }

    // Set the main cache entry
    await client.setex(key, ttl, serialized);

    // Set cache tags for invalidation with error handling
    if (tags.length > 0) {
      const tagKeys = tags.map(tag => `tag:${tag}`);
      const pipeline = client.pipeline();

      try {
        tagKeys.forEach(tagKey => {
          pipeline.sadd(tagKey, key);
          pipeline.expire(tagKey, ttl);
        });

        const results = await pipeline.exec();

        // Check for pipeline errors
        if (results) {
          for (const [error] of results) {
            if (error) {
              console.error('Pipeline command failed:', error);
            }
          }
        }
      } catch (pipelineError) {
        console.error('Pipeline execution failed:', pipelineError);
        // Don't fail the entire operation for tag errors
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to set cache:', error);
    return false;
  }
}

// Get cache value with improved error handling
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (!key) {
      throw new Error('Invalid cache key');
    }

    if (!(await isRedisAvailable())) {
      return null;
    }

    const client = await getRedisClient();
    const cached = await client.get(key);
    return deserialize<T>(cached);
  } catch (error) {
    console.error('Failed to get cache:', error);
    return null;
  }
}

// Delete cache key with validation
export async function deleteCache(key: string): Promise<boolean> {
  try {
    if (!key) {
      throw new Error('Invalid cache key');
    }

    if (!(await isRedisAvailable())) {
      return false;
    }

    const client = await getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Failed to delete cache:', error);
    return false;
  }
}

// Alias for backward compatibility
export const invalidateCache = deleteCache;

// Invalidate cache by tags with safe pipeline operations
export async function invalidateCacheByTags(tags: string[]): Promise<boolean> {
  try {
    if (!tags || tags.length === 0) {
      return true; // Nothing to invalidate
    }

    if (!(await isRedisAvailable())) {
      return false;
    }

    const client = await getRedisClient();

    // Process tags in batches to avoid overwhelming Redis
    const batchSize = 10;
    for (let i = 0; i < tags.length; i += batchSize) {
      const tagBatch = tags.slice(i, i + batchSize);

      try {
        const pipeline = client.pipeline();
        const keysToDelete: string[] = [];

        // First, collect all keys to delete
        for (const tag of tagBatch) {
          const tagKey = `tag:${tag}`;
          try {
            const keys = await client.smembers(tagKey);
            if (keys.length > 0) {
              keysToDelete.push(...keys);
              keysToDelete.push(tagKey);
            }
          } catch (memberError) {
            console.error(`Failed to get members for tag ${tag}:`, memberError);
            // Continue with other tags
          }
        }

        // Delete keys in batches
        if (keysToDelete.length > 0) {
          const deleteBatchSize = 100;
          for (let j = 0; j < keysToDelete.length; j += deleteBatchSize) {
            const deleteBatch = keysToDelete.slice(j, j + deleteBatchSize);
            pipeline.del(...deleteBatch);
          }

          const results = await pipeline.exec();

          // Check for errors in pipeline execution
          if (results) {
            for (const [error] of results) {
              if (error) {
                console.error('Pipeline delete command failed:', error);
              }
            }
          }
        }
      } catch (batchError) {
        console.error(`Failed to process tag batch:`, batchError);
        // Continue with next batch
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to invalidate cache by tags:', error);
    return false;
  }
}

// Get cache with fallback and improved error handling
export async function getCacheOrExecute<T>(
  key: string,
  fallback: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = await getCache<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute fallback and cache result
    const result = await fallback();

    // Only cache if result is not null/undefined
    if (result !== null && result !== undefined) {
      await setCache(key, result, options);
    }

    return result;
  } catch (error) {
    console.error('Error in getCacheOrExecute:', error);
    // If cache fails, still try to execute fallback
    return await fallback();
  }
}

// Batch cache operations with improved error handling
export async function setCacheBatch<T>(
  entries: Array<{ key: string; value: T; options?: CacheOptions }>
): Promise<boolean> {
  try {
    if (!entries || entries.length === 0) {
      return true;
    }

    if (!(await isRedisAvailable())) {
      return false;
    }

    const client = await getRedisClient();

    // Process entries in batches to avoid overwhelming Redis
    const batchSize = 50;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);

      try {
        const pipeline = client.pipeline();

        batch.forEach(({ key, value, options = {} }) => {
          if (!key || value === undefined) {
            console.warn('Skipping invalid cache entry:', { key, value });
            return;
          }

          try {
            const serialized = serialize(value);
            const { ttl = DEFAULT_TTL.medium } = options;

            if (ttl > 0 && ttl <= DEFAULT_TTL.veryLong * 7) {
              pipeline.setex(key, ttl, serialized);
            }
          } catch (serializeError) {
            console.error(
              `Failed to serialize entry for key ${key}:`,
              serializeError
            );
          }
        });

        const results = await pipeline.exec();

        // Check for pipeline errors
        if (results) {
          for (const [error] of results) {
            if (error) {
              console.error('Pipeline setex command failed:', error);
            }
          }
        }
      } catch (batchError) {
        console.error(`Failed to process cache batch:`, batchError);
        // Continue with next batch
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to set cache batch:', error);
    return false;
  }
}

// Close Redis connection with proper cleanup
export async function closeRedisConnection(): Promise<void> {
  try {
    if (redis) {
      connectionState = 'disconnected';
      await redis.quit();
      redis = null;
      connectionPromise = null;
      isConnecting = false;
      lastConnectionError = null;
      console.log('Redis connection closed successfully');
    }
  } catch (error) {
    console.error('Error closing Redis connection:', error);
    // Force cleanup even if quit fails
    redis = null;
    connectionPromise = null;
    isConnecting = false;
    connectionState = 'disconnected';
  }
}

// Health check function for monitoring
export async function getRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy' | 'degraded';
  connectionState: typeof connectionState;
  lastError: string | null;
  responseTime: number;
}> {
  const start = Date.now();

  try {
    if (connectionState === 'error') {
      return {
        status: 'unhealthy',
        connectionState,
        lastError: lastConnectionError?.message || 'Unknown error',
        responseTime: Date.now() - start,
      };
    }

    const client = await getRedisClient();
    await client.ping();

    return {
      status: 'healthy',
      connectionState,
      lastError: null,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connectionState,
      lastError: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start,
    };
  }
}

// Cleanup function for graceful shutdown
export async function gracefulShutdown(): Promise<void> {
  console.log('Starting Redis graceful shutdown...');
  await closeRedisConnection();
  console.log('Redis graceful shutdown completed');
}

// Process signal handlers for cleanup
if (typeof process !== 'undefined') {
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  process.on('beforeExit', gracefulShutdown);
}
