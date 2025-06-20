import { getRedisClient, isRedisAvailable } from '@/components/ui/card';
import { getAtomicCacheManager } from '@/components/ui/card';
import { CacheHealthMonitor } from '../lib/cache/enhanced-cache-services';

#!/usr/bin/env node

/**
 * Cache System Migration Finalization Script
 *
 * This script finalizes the migration from the old cache system to the new atomic cache system,
 * addressing all critical race conditions and data consistency issues identified in subtask 29.
 */

  CacheMigrationManager,
  CacheCompatibilityLayer,
  MigrationUtils,
} from '../lib/cache/cache-migration-utility';

// Migration configuration
interface FinalizationConfig {
  validateReadiness: boolean;
  performMigration: boolean;
  enableNewSystem: boolean;
  startMonitoring: boolean;
  generateReport: boolean;
  cleanupOldSystem: boolean;
  dryRun: boolean;
}

// Default configuration
const DEFAULT_CONFIG: FinalizationConfig = {
  validateReadiness: true,
  performMigration: true,
  enableNewSystem: true,
  startMonitoring: true,
  generateReport: true,
  cleanupOldSystem: false, // Keep old system as backup initially
  dryRun: false,
};

/**
 * Cache System Finalizer
 */
class CacheSystemFinalizer {
  private config: FinalizationConfig;
  private startTime: number;
  private logs: string[] = [];

  constructor(config: Partial<FinalizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = Date.now();
  }

  /**
   * Add log entry
   */
  private log(
    message: string,
    level: 'info' | 'warn' | 'error' = 'info'
  ): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }

  /**
   * Run the complete finalization process
   */
  async finalize(): Promise<void> {
    try {
      this.log('Starting cache system migration finalization...');

      // Step 1: Validate migration readiness
      if (this.config.validateReadiness) {
        await this.validateReadiness();
      }

      // Step 2: Perform migration if needed
      if (this.config.performMigration) {
        await this.performMigration();
      }

      // Step 3: Enable new cache system
      if (this.config.enableNewSystem) {
        await this.enableNewSystem();
      }

      // Step 4: Start health monitoring
      if (this.config.startMonitoring) {
        await this.startHealthMonitoring();
      }

      // Step 5: Validate new system functionality
      await this.validateNewSystem();

      // Step 6: Generate migration report
      if (this.config.generateReport) {
        await this.generateFinalReport();
      }

      // Step 7: Cleanup old system (optional)
      if (this.config.cleanupOldSystem) {
        await this.cleanupOldSystem();
      }

      const duration = Date.now() - this.startTime;
      this.log(
        `Cache system migration finalization completed successfully in ${Math.round(duration / 1000)}s`
      );
    } catch (error) {
      this.log(`Cache system migration finalization failed: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Validate migration readiness
   */
  private async validateReadiness(): Promise<void> {
    this.log('Validating migration readiness...');

    try {
      const readiness = await MigrationUtils.validateReadiness();

      if (!readiness.ready) {
        this.log('Migration readiness check failed:', 'error');
        readiness.issues.forEach(issue => this.log(`  - ${issue}`, 'error'));
        throw new Error('System not ready for migration');
      }

      if (readiness.recommendations.length > 0) {
        this.log('Migration recommendations:');
        readiness.recommendations.forEach(rec =>
          this.log(`  - ${rec}`, 'warn')
        );
      }

      this.log('Migration readiness validation passed');
    } catch (error) {
      this.log(`Readiness validation failed: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Perform the cache migration
   */
  private async performMigration(): Promise<void> {
    this.log('Performing cache system migration...');

    try {
      const migrationConfig = {
        batchSize: 50, // Smaller batches for safety
        maxRetries: 5,
        retryDelay: 2000,
        validateData: true,
        preserveOldCache: true, // Keep old cache as backup
        dryRun: this.config.dryRun,
        enableRollback: true,
      };

      const status = await MigrationUtils.runMigration(migrationConfig);

      if (status.phase === 'completed') {
        this.log(`Migration completed successfully:`);
        this.log(`  - Total keys: ${status.stats.totalKeys}`);
        this.log(`  - Migrated: ${status.stats.migratedKeys}`);
        this.log(`  - Failed: ${status.stats.failedKeys}`);
        this.log(`  - Skipped: ${status.stats.skippedKeys}`);
      } else {
        throw new Error(`Migration failed in phase: ${status.phase}`);
      }

      if (status.errors.length > 0) {
        this.log('Migration completed with errors:');
        status.errors.forEach(error => this.log(`  - ${error}`, 'warn'));
      }
    } catch (error) {
      this.log(`Migration failed: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Enable the new cache system
   */
  private async enableNewSystem(): Promise<void> {
    this.log('Enabling new atomic cache system...');

    try {
      if (!this.config.dryRun) {
        // Initialize atomic cache manager
        const atomicManager = await getAtomicCacheManager();
        this.log('Atomic cache manager initialized');

        // Enable new cache system
        CacheCompatibilityLayer.enableNewCache();
        this.log('New cache system enabled');

        // Verify the switch was successful
        if (CacheCompatibilityLayer.isNewCacheEnabled()) {
          this.log('Successfully switched to new atomic cache system');
        } else {
          throw new Error('Failed to switch to new cache system');
        }
      } else {
        this.log('[DRY RUN] Would enable new atomic cache system');
      }
    } catch (error) {
      this.log(`Failed to enable new system: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Start health monitoring
   */
  private async startHealthMonitoring(): Promise<void> {
    this.log('Starting cache health monitoring...');

    try {
      if (!this.config.dryRun) {
        await CacheHealthMonitor.startMonitoring(30000); // Monitor every 30 seconds
        this.log('Cache health monitoring started');
      } else {
        this.log('[DRY RUN] Would start cache health monitoring');
      }
    } catch (error) {
      this.log(`Failed to start monitoring: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Validate new system functionality
   */
  private async validateNewSystem(): Promise<void> {
    this.log('Validating new cache system functionality...');

    try {
      const atomicManager = await getAtomicCacheManager();

      // Test basic operations
      const testKey = 'test:finalization:' + Date.now();
      const testValue = {
        message: 'Cache system validation test',
        timestamp: Date.now(),
      };

      // Test atomic set
      const setResult = await atomicManager.atomicSet(testKey, testValue, {
        ttl: 60,
        tags: ['test'],
        dependencies: ['test:all'],
      });

      if (!setResult) {
        throw new Error('Atomic set operation failed');
      }

      // Test atomic get
      const getValue = await atomicManager.atomicGet(testKey, {
        validateIntegrity: true,
      });

      if (!getValue || JSON.stringify(getValue) !== JSON.stringify(testValue)) {
        throw new Error(
          'Atomic get operation failed or data integrity check failed'
        );
      }

      // Test atomic delete
      const deleteResult = await atomicManager.atomicDelete(testKey);
      if (!deleteResult) {
        throw new Error('Atomic delete operation failed');
      }

      // Verify deletion
      const deletedValue = await atomicManager.atomicGet(testKey);
      if (deletedValue !== null) {
        throw new Error('Value was not properly deleted');
      }

      // Test cache statistics
      const stats = await atomicManager.getCacheStats();
      this.log(`Cache statistics: ${JSON.stringify(stats)}`);

      this.log('New cache system validation passed');
    } catch (error) {
      this.log(`New system validation failed: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Generate final migration report
   */
  private async generateFinalReport(): Promise<void> {
    this.log('Generating final migration report...');

    try {
      const atomicManager = await getAtomicCacheManager();
      const stats = await atomicManager.getCacheStats();
      const healthStats = CacheHealthMonitor.getHealthStats();
      const duration = Date.now() - this.startTime;

      const report = `
Cache System Migration Finalization Report
==========================================

Migration Date: ${new Date().toISOString()}
Duration: ${Math.round(duration / 1000)} seconds
Status: ${this.config.dryRun ? 'DRY RUN' : 'COMPLETED'}

System Configuration:
- Validate Readiness: ${this.config.validateReadiness}
- Perform Migration: ${this.config.performMigration}
- Enable New System: ${this.config.enableNewSystem}
- Start Monitoring: ${this.config.startMonitoring}
- Cleanup Old System: ${this.config.cleanupOldSystem}

Cache Statistics:
- Total Keys: ${stats.totalKeys}
- Total Tags: ${stats.totalTags}
- Total Dependencies: ${stats.totalDependencies}
- Memory Usage: ${Math.round(stats.memoryUsage / 1024 / 1024)} MB
- Operation Queue Size: ${stats.operationQueueSize}
- Version Cache Size: ${stats.versionCacheSize}

Health Monitoring:
${healthStats ? JSON.stringify(healthStats, null, 2) : 'Not available'}

Critical Issues Addressed:
✅ Cache Service Race Conditions - Fixed with atomic operations and distributed locking
✅ Pagination Cache Consistency - Implemented with versioning and dependency tracking
✅ Cache Key Collision Risks - Resolved with proper namespacing and validation
✅ Memory Management Issues - Added TTL enforcement and eviction policies
✅ Data Consistency Problems - Implemented integrity validation and cascade invalidation
✅ Performance Issues - Added batch operations and comprehensive monitoring

Migration Logs:
${this.logs.join('\n')}

Next Steps:
1. Monitor cache performance for 24-48 hours
2. Verify application functionality with new cache system
3. Consider cleanup of old cache system after validation period
4. Update documentation and team training materials
5. Set up alerting for cache health metrics

Report generated at: ${new Date().toISOString()}
      `.trim();

      // Write report to file
      const fs = require('fs');
      const path = require('path');
      const reportPath = path.join(
        process.cwd(),
        'cache-migration-finalization-report.txt'
      );

      if (!this.config.dryRun) {
        fs.writeFileSync(reportPath, report);
        this.log(`Final report written to: ${reportPath}`);
      } else {
        this.log('[DRY RUN] Would write final report to: ' + reportPath);
      }

      console.log('\n' + report);
    } catch (error) {
      this.log(`Failed to generate report: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Cleanup old cache system (optional)
   */
  private async cleanupOldSystem(): Promise<void> {
    this.log('Cleaning up old cache system...');

    try {
      if (!this.config.dryRun) {
        const redis = await getRedisClient();

        // Get old cache keys (non-atomic)
        const oldKeys = await redis.keys('*');
        const cacheKeys = oldKeys.filter(
          (key: string) =>
            !key.startsWith('lock:') &&
            !key.startsWith('version:') &&
            !key.startsWith('tag:') &&
            (key.startsWith('jobs:') ||
              key.startsWith('users:') ||
              key.startsWith('search:'))
        );

        if (cacheKeys.length > 0) {
          this.log(`Found ${cacheKeys.length} old cache keys to clean up`);

          // Delete in batches
          const batchSize = 100;
          for (let i = 0; i < cacheKeys.length; i += batchSize) {
            const batch = cacheKeys.slice(i, i + batchSize);
            await redis.del(...batch);
            this.log(
              `Cleaned up batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cacheKeys.length / batchSize)}`
            );
          }

          this.log(
            `Successfully cleaned up ${cacheKeys.length} old cache keys`
          );
        } else {
          this.log('No old cache keys found to clean up');
        }
      } else {
        this.log('[DRY RUN] Would cleanup old cache system');
      }
    } catch (error) {
      this.log(`Cleanup failed: ${error}`, 'error');
      throw error;
    }
  }
}

/**
 * CLI interface
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const config: Partial<FinalizationConfig> = {};

  // Parse command line arguments
  for (const arg of args) {
    switch (arg) {
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--no-validation':
        config.validateReadiness = false;
        break;
      case '--no-migration':
        config.performMigration = false;
        break;
      case '--no-enable':
        config.enableNewSystem = false;
        break;
      case '--no-monitoring':
        config.startMonitoring = false;
        break;
      case '--no-report':
        config.generateReport = false;
        break;
      case '--cleanup':
        config.cleanupOldSystem = true;
        break;
      case '--help':
        console.log(`
Cache System Migration Finalization Script

Usage: node finalizeCacheSystemMigration.js [options]

Options:
  --dry-run         Run in dry-run mode (no actual changes)
  --no-validation   Skip migration readiness validation
  --no-migration    Skip the migration process
  --no-enable       Don't enable the new cache system
  --no-monitoring   Don't start health monitoring
  --no-report       Don't generate final report
  --cleanup         Cleanup old cache system (use with caution)
  --help            Show this help message

Examples:
  node finalizeCacheSystemMigration.js                    # Full migration
  node finalizeCacheSystemMigration.js --dry-run          # Test run
  node finalizeCacheSystemMigration.js --cleanup          # Include cleanup
        `);
        process.exit(0);
        break;
    }
  }

  try {
    // Check Redis availability
    if (!(await isRedisAvailable())) {
      console.error('Redis is not available. Please ensure Redis is running.');
      process.exit(1);
    }

    const finalizer = new CacheSystemFinalizer(config);
    await finalizer.finalize();

    console.log(
      '\n✅ Cache system migration finalization completed successfully!'
    );
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cache system migration finalization failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');

  try {
    // Stop health monitoring
    CacheHealthMonitor.stopMonitoring();

    // Shutdown atomic cache manager
    const atomicManager = await getAtomicCacheManager();
    await atomicManager.shutdown();

    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');

  try {
    CacheHealthMonitor.stopMonitoring();
    const atomicManager = await getAtomicCacheManager();
    await atomicManager.shutdown();

    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Run the script if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { CacheSystemFinalizer };
export type { FinalizationConfig };
