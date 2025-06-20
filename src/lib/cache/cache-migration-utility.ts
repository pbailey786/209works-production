import { getRedisClient, isRedisAvailable } from '@/components/ui/card';
import { getAtomicCacheManager } from './atomic-cache-manager';

  JobCacheService as OldJobCacheService,
  UserCacheService as OldUserCacheService,
  SearchCacheService as OldSearchCacheService,
} from './services';
  JobCacheService as NewJobCacheService,
  UserCacheService as NewUserCacheService,
  SearchCacheService as NewSearchCacheService,
import {
  import {
  CacheHealthMonitor,
} from './enhanced-cache-services';

/**
 * Cache Migration Utility
 *
 * Provides utilities to migrate from the old cache system to the new atomic cache system.
 * Handles data migration, validation, and rollback capabilities.
 */

// Migration status tracking
interface MigrationStatus {
  phase:
    | 'preparation'
    | 'migration'
    | 'validation'
    | 'cleanup'
    | 'completed'
    | 'failed';
  startTime: number;
  endTime?: number;
  progress: number;
  errors: string[];
  warnings: string[];
  stats: {
    totalKeys: number;
    migratedKeys: number;
    failedKeys: number;
    skippedKeys: number;
  };
}

// Migration configuration
interface MigrationConfig {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  validateData: boolean;
  preserveOldCache: boolean;
  dryRun: boolean;
  enableRollback: boolean;
}

// Default migration configuration
const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  batchSize: 100,
  maxRetries: 3,
  retryDelay: 1000,
  validateData: true,
  preserveOldCache: true,
  dryRun: false,
  enableRollback: true,
};

/**
 * Cache Migration Manager
 */
export class CacheMigrationManager {
  private config: MigrationConfig;
  private status: MigrationStatus;
  private redis: any = null;
  private atomicManager: any = null;
  private rollbackData: Map<string, any> = new Map();

  constructor(config: Partial<MigrationConfig> = {}) {
    this.config = { ...DEFAULT_MIGRATION_CONFIG, ...config };
    this.status = {
      phase: 'preparation',
      startTime: Date.now(),
      progress: 0,
      errors: [],
      warnings: [],
      stats: {
        totalKeys: 0,
        migratedKeys: 0,
        failedKeys: 0,
        skippedKeys: 0,
      },
    };
  }

  /**
   * Initialize migration manager
   */
  async initialize(): Promise<void> {
    try {
      if (await isRedisAvailable()) {
        this.redis = await getRedisClient();
        this.atomicManager = await getAtomicCacheManager();
        console.log('Cache migration manager initialized successfully');
      } else {
        throw new Error('Redis not available for migration');
      }
    } catch (error) {
      this.addError(`Failed to initialize migration manager: ${error}`);
      throw error;
    }
  }

  /**
   * Start the migration process
   */
  async migrate(): Promise<MigrationStatus> {
    try {
      this.status.phase = 'preparation';
      this.status.startTime = Date.now();

      console.log('Starting cache migration...');

      // Phase 1: Preparation
      await this.prepareMigration();

      // Phase 2: Migration
      this.status.phase = 'migration';
      await this.performMigration();

      // Phase 3: Validation
      this.status.phase = 'validation';
      await this.validateMigration();

      // Phase 4: Cleanup
      this.status.phase = 'cleanup';
      await this.cleanupMigration();

      // Complete
      this.status.phase = 'completed';
      this.status.endTime = Date.now();
      this.status.progress = 100;

      console.log('Cache migration completed successfully');
      return this.status;
    } catch (error) {
      this.status.phase = 'failed';
      this.status.endTime = Date.now();
      this.addError(`Migration failed: ${error}`);

      if (this.config.enableRollback) {
        await this.rollback();
      }

      throw error;
    }
  }

  /**
   * Prepare for migration
   */
  private async prepareMigration(): Promise<void> {
    try {
      // Get all cache keys
      const allKeys = await this.redis.keys('*');
      this.status.stats.totalKeys = allKeys.length;

      // Filter relevant cache keys
      const cacheKeys = allKeys.filter(
        (key: string) =>
          key.startsWith('jobs:') ||
          key.startsWith('users:') ||
          key.startsWith('search:') ||
          key.startsWith('tag:')
      );

      console.log(
        `Found ${cacheKeys.length} cache keys to migrate out of ${allKeys.length} total keys`
      );

      // Validate current cache state
      await this.validateCurrentCache(cacheKeys);

      // Prepare rollback data if enabled
      if (this.config.enableRollback) {
        await this.prepareRollbackData(cacheKeys);
      }

      this.status.progress = 10;
    } catch (error) {
      throw new Error(`Preparation failed: ${error}`);
    }
  }

  /**
   * Perform the actual migration
   */
  private async performMigration(): Promise<void> {
    try {
      const allKeys = await this.redis.keys('*');
      const cacheKeys = allKeys.filter(
        (key: string) =>
          key.startsWith('jobs:') ||
          key.startsWith('users:') ||
          key.startsWith('search:') ||
          key.startsWith('tag:')
      );

      // Process keys in batches
      for (let i = 0; i < cacheKeys.length; i += this.config.batchSize) {
        const batch = cacheKeys.slice(i, i + this.config.batchSize);
        await this.migrateBatch(batch);

        // Update progress
        this.status.progress = 10 + (i / cacheKeys.length) * 60;
        console.log(`Migration progress: ${Math.round(this.status.progress)}%`);
      }
    } catch (error) {
      throw new Error(`Migration failed: ${error}`);
    }
  }

  /**
   * Migrate a batch of cache keys
   */
  private async migrateBatch(keys: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Get all values in batch
    keys.forEach(key => pipeline.get(key));
    const results = await pipeline.exec();

    // Process each key-value pair
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const [error, value] = results[i];

      if (error) {
        this.addError(`Failed to get value for key ${key}: ${error}`);
        this.status.stats.failedKeys++;
        continue;
      }

      if (!value) {
        this.status.stats.skippedKeys++;
        continue;
      }

      try {
        await this.migrateKey(key, value);
        this.status.stats.migratedKeys++;
      } catch (migrateError) {
        this.addError(`Failed to migrate key ${key}: ${migrateError}`);
        this.status.stats.failedKeys++;
      }
    }
  }

  /**
   * Migrate a single cache key
   */
  private async migrateKey(key: string, value: string): Promise<void> {
    try {
      // Parse the old cache value
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (parseError) {
        // If it's not JSON, treat as string
        parsedValue = value;
      }

      // Determine migration strategy based on key pattern
      if (key.startsWith('jobs:')) {
        await this.migrateJobKey(key, parsedValue);
      } else if (key.startsWith('users:')) {
        await this.migrateUserKey(key, parsedValue);
      } else if (key.startsWith('search:')) {
        await this.migrateSearchKey(key, parsedValue);
      } else if (key.startsWith('tag:')) {
        await this.migrateTagKey(key, parsedValue);
      } else {
        this.addWarning(`Unknown key pattern: ${key}`);
        this.status.stats.skippedKeys++;
      }
    } catch (error) {
      throw new Error(`Failed to migrate key ${key}: ${error}`);
    }
  }

  /**
   * Migrate job-related cache key
   */
  private async migrateJobKey(key: string, value: any): Promise<void> {
    if (this.config.dryRun) {
      console.log(`[DRY RUN] Would migrate job key: ${key}`);
      return;
    }

    // Extract metadata and determine TTL
    const ttl = await this.redis.ttl(key);
    const tags = ['jobs'];

    // Add specific tags based on key pattern
    if (key.includes('employer')) {
      tags.push('jobs:employer');
    }
    if (key.includes('search')) {
      tags.push('jobs:search');
    }

    // Migrate using atomic cache manager
    await this.atomicManager.atomicSet(key, value, {
      ttl: ttl > 0 ? ttl : 3600, // Default to 1 hour if no TTL
      tags,
      dependencies: ['jobs:all'],
    });
  }

  /**
   * Migrate user-related cache key
   */
  private async migrateUserKey(key: string, value: any): Promise<void> {
    if (this.config.dryRun) {
      console.log(`[DRY RUN] Would migrate user key: ${key}`);
      return;
    }

    const ttl = await this.redis.ttl(key);
    const tags = ['users'];

    if (key.includes('profile')) {
      tags.push('users:profiles');
    }
    if (key.includes('applications')) {
      tags.push('users:applications');
    }

    await this.atomicManager.atomicSet(key, value, {
      ttl: ttl > 0 ? ttl : 7200, // Default to 2 hours
      tags,
      dependencies: ['users:all'],
    });
  }

  /**
   * Migrate search-related cache key
   */
  private async migrateSearchKey(key: string, value: any): Promise<void> {
    if (this.config.dryRun) {
      console.log(`[DRY RUN] Would migrate search key: ${key}`);
      return;
    }

    const ttl = await this.redis.ttl(key);
    const tags = ['search', 'search:jobs'];

    await this.atomicManager.atomicSet(key, value, {
      ttl: ttl > 0 ? ttl : 300, // Default to 5 minutes for search
      tags,
      dependencies: ['search:all'],
    });
  }

  /**
   * Migrate tag-related cache key
   */
  private async migrateTagKey(key: string, value: any): Promise<void> {
    if (this.config.dryRun) {
      console.log(`[DRY RUN] Would migrate tag key: ${key}`);
      return;
    }

    // Tags are handled differently in the new system
    // They're automatically managed by the atomic cache manager
    this.addWarning(`Tag key ${key} will be recreated by new cache system`);
    this.status.stats.skippedKeys++;
  }

  /**
   * Validate the migration
   */
  private async validateMigration(): Promise<void> {
    if (!this.config.validateData) {
      this.status.progress = 80;
      return;
    }

    try {
      console.log('Validating migration...');

      // Sample validation - check a few migrated keys
      const sampleKeys = await this.redis.keys('jobs:*');
      const sampleSize = Math.min(10, sampleKeys.length);

      for (let i = 0; i < sampleSize; i++) {
        const key = sampleKeys[i];

        // Get from old cache
        const oldValue = await this.redis.get(key);

        // Get from new cache
        const newValue = await this.atomicManager.atomicGet(key);

        if (!newValue) {
          this.addError(`Validation failed: Key ${key} not found in new cache`);
        } else if (this.config.validateData) {
          // Compare data integrity
          const oldParsed = JSON.parse(oldValue);
          if (JSON.stringify(oldParsed) !== JSON.stringify(newValue)) {
            this.addError(`Validation failed: Data mismatch for key ${key}`);
          }
        }
      }

      this.status.progress = 80;
      console.log('Migration validation completed');
    } catch (error) {
      throw new Error(`Validation failed: ${error}`);
    }
  }

  /**
   * Cleanup after migration
   */
  private async cleanupMigration(): Promise<void> {
    try {
      if (!this.config.preserveOldCache && !this.config.dryRun) {
        console.log('Cleaning up old cache entries...');

        // Remove old cache keys that have been migrated
        const oldKeys = await this.redis.keys('*');
        const cacheKeys = oldKeys.filter(
          (key: string) =>
            key.startsWith('jobs:') ||
            key.startsWith('users:') ||
            key.startsWith('search:')
        );

        if (cacheKeys.length > 0) {
          await this.redis.del(...cacheKeys);
          console.log(`Cleaned up ${cacheKeys.length} old cache keys`);
        }
      }

      // Start cache health monitoring
      await CacheHealthMonitor.startMonitoring();

      this.status.progress = 90;
    } catch (error) {
      this.addWarning(`Cleanup warning: ${error}`);
    }
  }

  /**
   * Validate current cache state
   */
  private async validateCurrentCache(keys: string[]): Promise<void> {
    let validKeys = 0;
    let invalidKeys = 0;

    for (const key of keys.slice(0, 100)) {
      // Sample first 100 keys
      try {
        const value = await this.redis.get(key);
        if (value) {
          JSON.parse(value); // Test if it's valid JSON
          validKeys++;
        } else {
          invalidKeys++;
        }
      } catch (error) {
        invalidKeys++;
      }
    }

    if (invalidKeys > validKeys * 0.1) {
      // More than 10% invalid
      this.addWarning(
        `High number of invalid cache entries: ${invalidKeys}/${validKeys + invalidKeys}`
      );
    }
  }

  /**
   * Prepare rollback data
   */
  private async prepareRollbackData(keys: string[]): Promise<void> {
    if (!this.config.enableRollback) return;

    console.log('Preparing rollback data...');

    // Store current state for rollback
    for (const key of keys.slice(0, 1000)) {
      // Limit rollback data
      try {
        const value = await this.redis.get(key);
        const ttl = await this.redis.ttl(key);

        if (value) {
          this.rollbackData.set(key, { value, ttl });
        }
      } catch (error) {
        this.addWarning(
          `Failed to prepare rollback data for key ${key}: ${error}`
        );
      }
    }

    console.log(`Prepared rollback data for ${this.rollbackData.size} keys`);
  }

  /**
   * Rollback migration
   */
  async rollback(): Promise<void> {
    if (!this.config.enableRollback || this.rollbackData.size === 0) {
      console.log('Rollback not available or not enabled');
      return;
    }

    try {
      console.log('Rolling back migration...');

      // Restore original cache entries
      const pipeline = this.redis.pipeline();

      for (const [key, data] of this.rollbackData) {
        if (data.ttl > 0) {
          pipeline.setex(key, data.ttl, data.value);
        } else {
          pipeline.set(key, data.value);
        }
      }

      await pipeline.exec();

      // Clear new cache entries
      const newKeys = await this.redis.keys('*');
      const atomicKeys = newKeys.filter(
        (key: string) => key.includes('version:') || key.includes('lock:')
      );

      if (atomicKeys.length > 0) {
        await this.redis.del(...atomicKeys);
      }

      console.log('Rollback completed successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  getStatus(): MigrationStatus {
    return { ...this.status };
  }

  /**
   * Add error to status
   */
  private addError(error: string): void {
    this.status.errors.push(error);
    console.error(`Migration Error: ${error}`);
  }

  /**
   * Add warning to status
   */
  private addWarning(warning: string): void {
    this.status.warnings.push(warning);
    console.warn(`Migration Warning: ${warning}`);
  }
}

/**
 * Cache Service Compatibility Layer
 *
 * Provides backward compatibility during migration period
 */
export class CacheCompatibilityLayer {
  private static useNewCache = false;
  private static migrationInProgress = false;

  /**
   * Enable new cache system
   */
  static enableNewCache(): void {
    this.useNewCache = true;
    console.log('Switched to new atomic cache system');
  }

  /**
   * Disable new cache system (fallback to old)
   */
  static disableNewCache(): void {
    this.useNewCache = false;
    console.log('Switched back to old cache system');
  }

  /**
   * Set migration in progress flag
   */
  static setMigrationInProgress(inProgress: boolean): void {
    this.migrationInProgress = inProgress;
  }

  /**
   * Get job cache service (compatible)
   */
  static getJobCacheService() {
    if (this.migrationInProgress) {
      // During migration, use old cache to avoid conflicts
      return OldJobCacheService;
    }

    return this.useNewCache ? NewJobCacheService : OldJobCacheService;
  }

  /**
   * Get user cache service (compatible)
   */
  static getUserCacheService() {
    if (this.migrationInProgress) {
      return OldUserCacheService;
    }

    return this.useNewCache ? NewUserCacheService : OldUserCacheService;
  }

  /**
   * Get search cache service (compatible)
   */
  static getSearchCacheService() {
    if (this.migrationInProgress) {
      return OldSearchCacheService;
    }

    return this.useNewCache ? NewSearchCacheService : OldSearchCacheService;
  }

  /**
   * Check if new cache is enabled
   */
  static isNewCacheEnabled(): boolean {
    return this.useNewCache && !this.migrationInProgress;
  }
}

/**
 * Migration CLI utility functions
 */
export const MigrationUtils = {
  /**
   * Run migration with default configuration
   */
  async runMigration(
    config: Partial<MigrationConfig> = {}
  ): Promise<MigrationStatus> {
    const manager = new CacheMigrationManager(config);
    await manager.initialize();
    return await manager.migrate();
  },

  /**
   * Run dry run migration
   */
  async runDryRun(): Promise<MigrationStatus> {
    return this.runMigration({ dryRun: true });
  },

  /**
   * Validate migration readiness
   */
  async validateReadiness(): Promise<{
    ready: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check Redis availability
      if (!(await isRedisAvailable())) {
        issues.push('Redis is not available');
      }

      // Check cache key count
      const redis = await getRedisClient();
      const allKeys = await redis.keys('*');
      const cacheKeys = allKeys.filter(
        (key: string) =>
          key.startsWith('jobs:') ||
          key.startsWith('users:') ||
          key.startsWith('search:')
      );

      if (cacheKeys.length > 10000) {
        recommendations.push(
          'Large number of cache keys detected. Consider running migration during low traffic period.'
        );
      }

      // Check memory usage
      const info = await redis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      if (memoryUsage > 500 * 1024 * 1024) {
        // 500MB
        recommendations.push(
          'High memory usage detected. Monitor memory during migration.'
        );
      }

      return {
        ready: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      issues.push(`Readiness check failed: ${error}`);
      return { ready: false, issues, recommendations };
    }
  },

  /**
   * Generate migration report
   */
  generateReport(status: MigrationStatus): string {
    const duration = status.endTime
      ? status.endTime - status.startTime
      : Date.now() - status.startTime;

    return `
Cache Migration Report
=====================

Status: ${status.phase}
Duration: ${Math.round(duration / 1000)}s
Progress: ${status.progress}%

Statistics:
- Total Keys: ${status.stats.totalKeys}
- Migrated: ${status.stats.migratedKeys}
- Failed: ${status.stats.failedKeys}
- Skipped: ${status.stats.skippedKeys}

Errors (${status.errors.length}):
${status.errors.map(error => `- ${error}`).join('\n')}

Warnings (${status.warnings.length}):
${status.warnings.map(warning => `- ${warning}`).join('\n')}
    `.trim();
  },
};
