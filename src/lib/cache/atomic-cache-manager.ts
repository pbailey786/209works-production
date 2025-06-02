import Redis from 'ioredis';
import { getRedisClient, isRedisAvailable } from './redis';

/**
 * Atomic Cache Manager
 * 
 * Provides atomic operations, versioning, and consistency guarantees for cache operations.
 * Fixes critical race conditions and data consistency issues in the caching system.
 */

// Cache operation types
export type CacheOperation = 'set' | 'get' | 'delete' | 'invalidate';

// Cache lock configuration
export interface CacheLockConfig {
  ttl: number; // Lock TTL in milliseconds
  retryDelay: number; // Delay between retry attempts
  maxRetries: number; // Maximum retry attempts
}

// Cache version metadata
export interface CacheVersionMetadata {
  version: number;
  timestamp: number;
  checksum: string;
  dependencies: string[];
}

// Cache consistency configuration
export interface CacheConsistencyConfig {
  enableVersioning: boolean;
  enableChecksums: boolean;
  enableDependencyTracking: boolean;
  maxVersionHistory: number;
  consistencyLevel: 'eventual' | 'strong' | 'weak';
}

// Default configurations
const DEFAULT_LOCK_CONFIG: CacheLockConfig = {
  ttl: 5000, // 5 seconds
  retryDelay: 100, // 100ms
  maxRetries: 50, // 5 seconds total wait time
};

const DEFAULT_CONSISTENCY_CONFIG: CacheConsistencyConfig = {
  enableVersioning: true,
  enableChecksums: true,
  enableDependencyTracking: true,
  maxVersionHistory: 10,
  consistencyLevel: 'strong',
};

/**
 * Atomic Cache Manager Class
 * 
 * Provides thread-safe cache operations with versioning and consistency guarantees
 */
export class AtomicCacheManager {
  private redis: Redis | null = null;
  private lockConfig: CacheLockConfig;
  private consistencyConfig: CacheConsistencyConfig;
  private operationQueue: Map<string, Promise<any>> = new Map();
  private versionCache: Map<string, number> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();

  constructor(
    lockConfig: Partial<CacheLockConfig> = {},
    consistencyConfig: Partial<CacheConsistencyConfig> = {}
  ) {
    this.lockConfig = { ...DEFAULT_LOCK_CONFIG, ...lockConfig };
    this.consistencyConfig = { ...DEFAULT_CONSISTENCY_CONFIG, ...consistencyConfig };
  }

  /**
   * Initialize the cache manager
   */
  async initialize(): Promise<void> {
    try {
      if (await isRedisAvailable()) {
        this.redis = await getRedisClient();
        console.log('AtomicCacheManager initialized successfully');
      } else {
        console.warn('Redis not available, AtomicCacheManager running in fallback mode');
      }
    } catch (error) {
      console.error('Failed to initialize AtomicCacheManager:', error);
      throw error;
    }
  }

  /**
   * Acquire a distributed lock for atomic operations
   */
  private async acquireLock(
    lockKey: string,
    config: Partial<CacheLockConfig> = {}
  ): Promise<string | null> {
    if (!this.redis) return null;

    const { ttl, retryDelay, maxRetries } = { ...this.lockConfig, ...config };
    const lockValue = `${Date.now()}-${Math.random()}`;
    const lockFullKey = `lock:${lockKey}`;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.redis.set(lockFullKey, lockValue, 'PX', ttl, 'NX');
        if (result === 'OK') {
          return lockValue;
        }

        // Check if lock is expired
        const currentLock = await this.redis.get(lockFullKey);
        if (!currentLock) {
          continue; // Lock was released, try again
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } catch (error) {
        console.error(`Lock acquisition attempt ${attempt + 1} failed:`, error);
        if (attempt === maxRetries - 1) {
          throw error;
        }
      }
    }

    throw new Error(`Failed to acquire lock for ${lockKey} after ${maxRetries} attempts`);
  }

  /**
   * Release a distributed lock
   */
  private async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    if (!this.redis || !lockValue) return false;

    const lockFullKey = `lock:${lockKey}`;
    
    // Use Lua script for atomic lock release
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      const result = await this.redis.eval(luaScript, 1, lockFullKey, lockValue);
      return result === 1;
    } catch (error) {
      console.error('Failed to release lock:', error);
      return false;
    }
  }

  /**
   * Execute operation with distributed locking
   */
  private async withLock<T>(
    lockKey: string,
    operation: () => Promise<T>,
    config: Partial<CacheLockConfig> = {}
  ): Promise<T> {
    // Check if operation is already in progress
    const existingOperation = this.operationQueue.get(lockKey);
    if (existingOperation) {
      return existingOperation;
    }

    const operationPromise = this.executeWithLock(lockKey, operation, config);
    this.operationQueue.set(lockKey, operationPromise);

    try {
      const result = await operationPromise;
      return result;
    } finally {
      this.operationQueue.delete(lockKey);
    }
  }

  /**
   * Internal method to execute operation with lock
   */
  private async executeWithLock<T>(
    lockKey: string,
    operation: () => Promise<T>,
    config: Partial<CacheLockConfig>
  ): Promise<T> {
    let lockValue: string | null = null;

    try {
      lockValue = await this.acquireLock(lockKey, config);
      return await operation();
    } finally {
      if (lockValue) {
        await this.releaseLock(lockKey, lockValue);
      }
    }
  }

  /**
   * Generate cache version metadata
   */
  private generateVersionMetadata(
    data: any,
    dependencies: string[] = []
  ): CacheVersionMetadata {
    const currentVersion = this.versionCache.get('global') || 0;
    const newVersion = currentVersion + 1;
    this.versionCache.set('global', newVersion);

    return {
      version: newVersion,
      timestamp: Date.now(),
      checksum: this.generateChecksum(data),
      dependencies,
    };
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(data: any): string {
    const crypto = require('crypto');
    const serialized = JSON.stringify(data);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Validate cache data integrity
   */
  private validateDataIntegrity(data: any, metadata: CacheVersionMetadata): boolean {
    if (!this.consistencyConfig.enableChecksums) return true;

    const currentChecksum = this.generateChecksum(data);
    return currentChecksum === metadata.checksum;
  }

  /**
   * Track cache dependencies
   */
  private trackDependencies(cacheKey: string, dependencies: string[]): void {
    if (!this.consistencyConfig.enableDependencyTracking) return;

    for (const dependency of dependencies) {
      if (!this.dependencyGraph.has(dependency)) {
        this.dependencyGraph.set(dependency, new Set());
      }
      this.dependencyGraph.get(dependency)!.add(cacheKey);
    }
  }

  /**
   * Get dependent cache keys
   */
  private getDependentKeys(cacheKey: string): string[] {
    const dependents = this.dependencyGraph.get(cacheKey);
    return dependents ? Array.from(dependents) : [];
  }

  /**
   * Atomic cache set operation with versioning
   */
  async atomicSet<T>(
    key: string,
    value: T,
    options: {
      ttl?: number;
      tags?: string[];
      dependencies?: string[];
      version?: number;
    } = {}
  ): Promise<boolean> {
    const lockKey = `set:${key}`;
    
    return this.withLock(lockKey, async () => {
      if (!this.redis) return false;

      try {
        const { ttl = 3600, tags = [], dependencies = [] } = options;
        
        // Generate version metadata
        const metadata = this.generateVersionMetadata(value, dependencies);
        
        // Track dependencies
        this.trackDependencies(key, dependencies);
        
        // Prepare cache entry
        const cacheEntry = {
          data: value,
          metadata,
          tags,
        };

        const serialized = JSON.stringify(cacheEntry);
        
        // Use pipeline for atomic operations
        const pipeline = this.redis.pipeline();
        
        // Set main cache entry
        pipeline.setex(key, ttl, serialized);
        
        // Set version tracking
        if (this.consistencyConfig.enableVersioning) {
          pipeline.setex(`version:${key}`, ttl, metadata.version.toString());
        }
        
        // Set tag associations
        for (const tag of tags) {
          pipeline.sadd(`tag:${tag}`, key);
          pipeline.expire(`tag:${tag}`, ttl);
        }
        
        // Execute pipeline atomically
        const results = await pipeline.exec();
        
        // Check for errors
        if (results) {
          for (const [error] of results) {
            if (error) {
              console.error('Pipeline command failed in atomicSet:', error);
              return false;
            }
          }
        }
        
        return true;
      } catch (error) {
        console.error('Failed to execute atomic set:', error);
        return false;
      }
    });
  }

  /**
   * Atomic cache get operation with integrity validation
   */
  async atomicGet<T>(
    key: string,
    options: {
      validateIntegrity?: boolean;
      expectedVersion?: number;
    } = {}
  ): Promise<T | null> {
    const lockKey = `get:${key}`;
    
    return this.withLock(lockKey, async () => {
      if (!this.redis) return null;

      try {
        const { validateIntegrity = true, expectedVersion } = options;
        
        const cached = await this.redis.get(key);
        if (!cached) return null;

        const cacheEntry = JSON.parse(cached);
        const { data, metadata } = cacheEntry;

        // Version validation
        if (expectedVersion && metadata.version !== expectedVersion) {
          console.warn(`Version mismatch for key ${key}: expected ${expectedVersion}, got ${metadata.version}`);
          return null;
        }

        // Integrity validation
        if (validateIntegrity && !this.validateDataIntegrity(data, metadata)) {
          console.error(`Data integrity check failed for key ${key}`);
          await this.atomicDelete(key); // Remove corrupted data
          return null;
        }

        return data;
      } catch (error) {
        console.error('Failed to execute atomic get:', error);
        return null;
      }
    });
  }

  /**
   * Atomic cache delete operation
   */
  async atomicDelete(key: string): Promise<boolean> {
    const lockKey = `delete:${key}`;
    
    return this.withLock(lockKey, async () => {
      if (!this.redis) return false;

      try {
        const pipeline = this.redis.pipeline();
        
        // Get cache entry to find tags
        const cached = await this.redis.get(key);
        if (cached) {
          try {
            const cacheEntry = JSON.parse(cached);
            const { tags = [] } = cacheEntry;
            
            // Remove from tag associations
            for (const tag of tags) {
              pipeline.srem(`tag:${tag}`, key);
            }
          } catch (parseError) {
            console.warn('Failed to parse cache entry for tag cleanup:', parseError);
          }
        }
        
        // Delete main cache entry and version
        pipeline.del(key);
        pipeline.del(`version:${key}`);
        
        // Execute pipeline
        const results = await pipeline.exec();
        
        // Check for errors
        if (results) {
          for (const [error] of results) {
            if (error) {
              console.error('Pipeline command failed in atomicDelete:', error);
            }
          }
        }
        
        // Clean up dependencies
        this.dependencyGraph.delete(key);
        
        return true;
      } catch (error) {
        console.error('Failed to execute atomic delete:', error);
        return false;
      }
    });
  }

  /**
   * Atomic cache invalidation by tags with dependency cascade
   */
  async atomicInvalidateByTags(
    tags: string[],
    options: {
      cascadeDependencies?: boolean;
      batchSize?: number;
    } = {}
  ): Promise<boolean> {
    if (!tags || tags.length === 0) return true;
    
    const lockKey = `invalidate:${tags.join(':')}`;
    
    return this.withLock(lockKey, async () => {
      if (!this.redis) return false;

      try {
        const { cascadeDependencies = true, batchSize = 100 } = options;
        const keysToDelete = new Set<string>();
        
        // Collect all keys associated with tags
        for (const tag of tags) {
          const tagKey = `tag:${tag}`;
          const keys = await this.redis.smembers(tagKey);
          keys.forEach(key => keysToDelete.add(key));
          keysToDelete.add(tagKey);
        }
        
        // Cascade to dependent keys if enabled
        if (cascadeDependencies) {
          const dependentKeys = new Set<string>();
          for (const key of keysToDelete) {
            const deps = this.getDependentKeys(key);
            deps.forEach(dep => dependentKeys.add(dep));
          }
          dependentKeys.forEach(key => keysToDelete.add(key));
        }
        
        // Delete keys in batches
        const keyArray = Array.from(keysToDelete);
        for (let i = 0; i < keyArray.length; i += batchSize) {
          const batch = keyArray.slice(i, i + batchSize);
          
          const pipeline = this.redis.pipeline();
          batch.forEach(key => {
            pipeline.del(key);
            pipeline.del(`version:${key}`);
          });
          
          const results = await pipeline.exec();
          
          // Check for errors
          if (results) {
            for (const [error] of results) {
              if (error) {
                console.error('Pipeline command failed in atomicInvalidateByTags:', error);
              }
            }
          }
        }
        
        // Clean up dependency tracking
        keyArray.forEach(key => this.dependencyGraph.delete(key));
        
        return true;
      } catch (error) {
        console.error('Failed to execute atomic invalidation:', error);
        return false;
      }
    });
  }

  /**
   * Batch atomic operations
   */
  async atomicBatch(
    operations: Array<{
      type: 'set' | 'get' | 'delete';
      key: string;
      value?: any;
      options?: any;
    }>
  ): Promise<Array<any>> {
    const lockKey = `batch:${operations.map(op => op.key).join(':')}`;
    
    return this.withLock(lockKey, async () => {
      const results: any[] = [];
      
      for (const operation of operations) {
        try {
          switch (operation.type) {
            case 'set':
              const setResult = await this.atomicSet(operation.key, operation.value, operation.options);
              results.push(setResult);
              break;
            case 'get':
              const getResult = await this.atomicGet(operation.key, operation.options);
              results.push(getResult);
              break;
            case 'delete':
              const deleteResult = await this.atomicDelete(operation.key);
              results.push(deleteResult);
              break;
            default:
              results.push(new Error(`Unknown operation type: ${operation.type}`));
          }
        } catch (error) {
          results.push(error);
        }
      }
      
      return results;
    });
  }

  /**
   * Get cache statistics and health information
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    totalTags: number;
    totalDependencies: number;
    memoryUsage: number;
    operationQueueSize: number;
    versionCacheSize: number;
  }> {
    if (!this.redis) {
      return {
        totalKeys: 0,
        totalTags: 0,
        totalDependencies: 0,
        memoryUsage: 0,
        operationQueueSize: this.operationQueue.size,
        versionCacheSize: this.versionCache.size,
      };
    }

    try {
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      const totalKeys = await this.redis.dbsize();
      const tagKeys = await this.redis.keys('tag:*');
      const totalTags = tagKeys.length;

      return {
        totalKeys,
        totalTags,
        totalDependencies: this.dependencyGraph.size,
        memoryUsage,
        operationQueueSize: this.operationQueue.size,
        versionCacheSize: this.versionCache.size,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalKeys: 0,
        totalTags: 0,
        totalDependencies: 0,
        memoryUsage: 0,
        operationQueueSize: this.operationQueue.size,
        versionCacheSize: this.versionCache.size,
      };
    }
  }

  /**
   * Cleanup expired locks and orphaned data
   */
  async cleanup(): Promise<void> {
    if (!this.redis) return;

    try {
      // Clean up expired locks
      const lockKeys = await this.redis.keys('lock:*');
      if (lockKeys.length > 0) {
        const pipeline = this.redis.pipeline();
        lockKeys.forEach(key => pipeline.del(key));
        await pipeline.exec();
      }

      // Clean up version cache
      if (this.versionCache.size > 1000) {
        this.versionCache.clear();
      }

      // Clean up dependency graph
      if (this.dependencyGraph.size > 1000) {
        this.dependencyGraph.clear();
      }

      console.log('AtomicCacheManager cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup AtomicCacheManager:', error);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      // Wait for pending operations
      const pendingOperations = Array.from(this.operationQueue.values());
      if (pendingOperations.length > 0) {
        console.log(`Waiting for ${pendingOperations.length} pending cache operations...`);
        await Promise.allSettled(pendingOperations);
      }

      // Cleanup
      await this.cleanup();

      // Clear internal state
      this.operationQueue.clear();
      this.versionCache.clear();
      this.dependencyGraph.clear();

      console.log('AtomicCacheManager shutdown completed');
    } catch (error) {
      console.error('Error during AtomicCacheManager shutdown:', error);
    }
  }
}

// Singleton instance
let atomicCacheManager: AtomicCacheManager | null = null;

/**
 * Get singleton instance of AtomicCacheManager
 */
export async function getAtomicCacheManager(): Promise<AtomicCacheManager> {
  if (!atomicCacheManager) {
    atomicCacheManager = new AtomicCacheManager();
    await atomicCacheManager.initialize();
  }
  return atomicCacheManager;
}

/**
 * Utility functions for common atomic cache operations
 */
export const AtomicCacheUtils = {
  /**
   * Atomic cache-or-execute pattern
   */
  async getOrExecute<T>(
    key: string,
    fallback: () => Promise<T>,
    options: {
      ttl?: number;
      tags?: string[];
      dependencies?: string[];
      validateIntegrity?: boolean;
    } = {}
  ): Promise<T> {
    const manager = await getAtomicCacheManager();
    
    // Try to get from cache first
    const cached = await manager.atomicGet<T>(key, {
      validateIntegrity: options.validateIntegrity,
    });
    
    if (cached !== null) {
      return cached;
    }
    
    // Execute fallback and cache result
    const result = await fallback();
    
    if (result !== null && result !== undefined) {
      await manager.atomicSet(key, result, {
        ttl: options.ttl,
        tags: options.tags,
        dependencies: options.dependencies,
      });
    }
    
    return result;
  },

  /**
   * Atomic cache warming
   */
  async warmCache<T>(
    keys: Array<{
      key: string;
      fallback: () => Promise<T>;
      options?: {
        ttl?: number;
        tags?: string[];
        dependencies?: string[];
      };
    }>
  ): Promise<void> {
    const manager = await getAtomicCacheManager();
    
    const operations = keys.map(({ key, fallback, options = {} }) => ({
      type: 'set' as const,
      key,
      value: fallback(),
      options,
    }));
    
    await manager.atomicBatch(operations);
  },

  /**
   * Atomic cache invalidation with dependency cascade
   */
  async invalidateWithDependencies(
    keys: string[],
    tags: string[] = []
  ): Promise<void> {
    const manager = await getAtomicCacheManager();
    
    // Delete specific keys
    for (const key of keys) {
      await manager.atomicDelete(key);
    }
    
    // Invalidate by tags with dependency cascade
    if (tags.length > 0) {
      await manager.atomicInvalidateByTags(tags, {
        cascadeDependencies: true,
      });
    }
  },
}; 