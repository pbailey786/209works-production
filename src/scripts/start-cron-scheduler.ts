#!/usr/bin/env node

/**
 * Cron Scheduler Startup Script
 *
 * Enhanced version with proper process management, error handling,
 * configuration support, and monitoring capabilities.
 *
 * This script initializes and starts the cron scheduler for local development.
 * In production, cron jobs are handled by Vercel Cron.
 *
 * Features:
 * - Proper process management without memory leaks
 * - Comprehensive error handling and recovery
 * - Configuration validation and environment support
 * - Health monitoring and status reporting
 * - Graceful shutdown handling
 * - Resource cleanup and management
 *
 * Usage:
 *   npm run cron:start
 *   npm run cron:stop
 *   npm run cron:status
 *   npm run cron:test
 */

import { cronScheduler } from '../lib/services/cron-scheduler';
import { config } from 'dotenv';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

// Configuration interface
interface SchedulerConfig {
  pidFile: string;
  lockFile: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  healthCheckInterval: number;
  shutdownTimeout: number;
  testTimeout: number;
  baseUrl: string;
  cronSecret: string;
}

class ConfigManager {
  static load(): SchedulerConfig {
    return {
      pidFile:
        process.env.CRON_SCHEDULER_PID_FILE ||
        join(process.cwd(), 'cron-scheduler.pid'),
      lockFile:
        process.env.CRON_SCHEDULER_LOCK_FILE ||
        join(process.cwd(), 'cron-scheduler.lock'),
      logLevel: this.validateLogLevel(
        process.env.CRON_SCHEDULER_LOG_LEVEL || 'info'
      ),
      healthCheckInterval: this.validateNumber(
        process.env.CRON_SCHEDULER_HEALTH_INTERVAL || '60000',
        30000,
        300000
      ),
      shutdownTimeout: this.validateNumber(
        process.env.CRON_SCHEDULER_SHUTDOWN_TIMEOUT || '30000',
        5000,
        60000
      ),
      testTimeout: this.validateNumber(
        process.env.CRON_SCHEDULER_TEST_TIMEOUT || '10000',
        5000,
        30000
      ),
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      cronSecret: process.env.CRON_SECRET || 'test',
    };
  }

  private static validateLogLevel(
    level: string
  ): 'debug' | 'info' | 'warn' | 'error' {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(level)) {
      console.warn(`Invalid log level: ${level}. Using 'info' as default.`);
      return 'info';
    }
    return level as 'debug' | 'info' | 'warn' | 'error';
  }

  private static validateNumber(
    value: string,
    min: number,
    max: number
  ): number {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < min || num > max) {
      console.warn(
        `Invalid number: ${value}. Using default within range ${min}-${max}.`
      );
      return Math.max(min, Math.min(max, 60000)); // Default to middle value
    }
    return num;
  }
}

class Logger {
  private logLevel: 'debug' | 'info' | 'warn' | 'error';

  constructor(config: SchedulerConfig) {
    this.logLevel = config.logLevel;
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(
    level: string,
    message: string,
    ...args: any[]
  ): string {
    const timestamp = new Date().toISOString();
    const pid = process.pid;
    const formattedArgs =
      args.length > 0
        ? ' ' +
          args
            .map(arg =>
              typeof arg === 'object'
                ? JSON.stringify(arg, null, 2)
                : String(arg)
            )
            .join(' ')
        : '';

    return `[${timestamp}] [${pid}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog('debug')) return;
    console.debug(this.formatMessage('debug', message, ...args));
  }

  info(message: string, ...args: any[]): void {
    if (!this.shouldLog('info')) return;
    console.log(this.formatMessage('info', message, ...args));
  }

  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message, ...args));
  }

  error(message: string, ...args: any[]): void {
    if (!this.shouldLog('error')) return;
    console.error(this.formatMessage('error', message, ...args));
  }
}

class ProcessManager {
  private config: SchedulerConfig;
  private logger: Logger;
  private isShuttingDown = false;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(config: SchedulerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    // Graceful shutdown signals
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => this.gracefulShutdown('SIGUSR2')); // For nodemon

    // Error handling
    process.on('uncaughtException', error => {
      this.logger.error('Uncaught Exception:', error);
      this.emergencyShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.emergencyShutdown('unhandledRejection');
    });

    // Memory warnings
    process.on('warning', warning => {
      this.logger.warn('Process warning:', warning);
    });
  }

  createPidFile(): void {
    try {
      writeFileSync(this.config.pidFile, process.pid.toString());
      this.logger.debug(`PID file created: ${this.config.pidFile}`);
    } catch (error) {
      this.logger.error('Failed to create PID file:', error);
      throw error;
    }
  }

  checkLock(): boolean {
    if (existsSync(this.config.lockFile)) {
      try {
        const lockPid = readFileSync(this.config.lockFile, 'utf8').trim();
        this.logger.warn(`Lock file exists with PID: ${lockPid}`);

        // Check if process is still running
        try {
          process.kill(parseInt(lockPid), 0); // Signal 0 checks if process exists
          this.logger.error('Another scheduler instance is already running');
          return false;
        } catch {
          // Process doesn't exist, remove stale lock file
          this.logger.info('Removing stale lock file');
          this.removeLock();
        }
      } catch (error) {
        this.logger.warn('Error reading lock file:', error);
      }
    }

    try {
      writeFileSync(this.config.lockFile, process.pid.toString());
      return true;
    } catch (error) {
      this.logger.error('Failed to create lock file:', error);
      return false;
    }
  }

  removeLock(): void {
    try {
      if (existsSync(this.config.lockFile)) {
        require('fs').unlinkSync(this.config.lockFile);
        this.logger.debug('Lock file removed');
      }
    } catch (error) {
      this.logger.error('Failed to remove lock file:', error);
    }
  }

  startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    this.logger.debug(
      `Health check started with interval: ${this.config.healthCheckInterval}ms`
    );
  }

  private performHealthCheck(): void {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    this.logger.debug('Health check:', {
      uptime: `${Math.floor(uptime / 60)} minutes`,
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      },
    });

    // Memory threshold check (200MB for scheduler)
    if (memUsage.rss > 200 * 1024 * 1024) {
      this.logger.warn('High memory usage detected:', {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      });
    }
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('Shutdown already in progress, forcing exit...');
      process.exit(1);
    }

    this.isShuttingDown = true;
    this.logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Stop health check
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.logger.debug('Health check stopped');
    }

    // Stop cron scheduler
    try {
      cronScheduler.stop();
      this.logger.info('Cron scheduler stopped');
    } catch (error) {
      this.logger.error('Error stopping cron scheduler:', error);
    }

    // Cleanup
    this.cleanup();

    this.logger.info('Graceful shutdown completed');
    process.exit(0);
  }

  private emergencyShutdown(reason: string): void {
    this.logger.error(`Emergency shutdown due to: ${reason}`);
    this.cleanup();
    process.exit(1);
  }

  private cleanup(): void {
    try {
      // Remove PID file
      if (existsSync(this.config.pidFile)) {
        require('fs').unlinkSync(this.config.pidFile);
        this.logger.debug('PID file removed');
      }

      // Remove lock file
      this.removeLock();
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }
}

class CronEndpointTester {
  private config: SchedulerConfig;
  private logger: Logger;

  constructor(config: SchedulerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  async testAllEndpoints(): Promise<void> {
    const endpoints = [
      '/api/cron/send-email-alerts',
      '/api/cron/send-weekly-digests',
      '/api/cron/cleanup-expired-tokens',
      '/api/cron/update-job-rankings',
    ];

    this.logger.info('🌐 Testing cron endpoints...');

    const results: { endpoint: string; success: boolean; message: string }[] =
      [];

    for (const endpoint of endpoints) {
      const result = await this.testEndpoint(endpoint);
      results.push(result);
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const total = results.length;

    this.logger.info(
      `🧪 Endpoint testing completed: ${successful}/${total} successful`
    );

    if (successful < total) {
      this.logger.warn('Some endpoints failed testing');
      process.exit(1);
    }
  }

  private async testEndpoint(
    endpoint: string
  ): Promise<{ endpoint: string; success: boolean; message: string }> {
    try {
      this.logger.debug(`📡 Testing ${endpoint}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.testTimeout
      );

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.cronSecret}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const message = data.message || 'Success';
        this.logger.info(`  ✅ ${endpoint}: ${message}`);
        return { endpoint, success: true, message };
      } else {
        const message = `${response.status} ${response.statusText}`;
        this.logger.error(`  ❌ ${endpoint}: ${message}`);
        return { endpoint, success: false, message };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`  ❌ ${endpoint}: ${message}`);
      return { endpoint, success: false, message };
    }
  }
}

class CronSchedulerManager {
  private config: SchedulerConfig;
  private logger: Logger;
  private processManager: ProcessManager;
  private tester: CronEndpointTester;

  constructor() {
    this.config = ConfigManager.load();
    this.logger = new Logger(this.config);
    this.processManager = new ProcessManager(this.config, this.logger);
    this.tester = new CronEndpointTester(this.config, this.logger);
  }

  async start(): Promise<void> {
    this.logger.info('🚀 Starting cron scheduler...');

    // Check for existing instance
    if (!this.processManager.checkLock()) {
      this.logger.error(
        'Failed to acquire lock, another instance may be running'
      );
      process.exit(1);
    }

    // Create PID file
    this.processManager.createPidFile();

    try {
      // Initialize cron scheduler
      cronScheduler.initialize();
      this.logger.info('✅ Cron scheduler initialized successfully');

      // Start health monitoring
      this.processManager.startHealthCheck();

      this.logger.info('✅ Cron scheduler is running. Press Ctrl+C to stop.');

      // Keep the process alive without setInterval memory leak
      // Use a promise that never resolves instead of setInterval
      await new Promise<void>(() => {
        // This promise will never resolve, keeping the process alive
        // until it's terminated by a signal
      });
    } catch (error) {
      this.logger.error('Failed to initialize cron scheduler:', error);
      this.processManager.removeLock();
      process.exit(1);
    }
  }

  stop(): void {
    this.logger.info('⏹️  Stopping cron scheduler...');

    try {
      cronScheduler.stop();
      this.logger.info('✅ Cron scheduler stopped.');
    } catch (error) {
      this.logger.error('Error stopping cron scheduler:', error);
    }

    this.processManager.removeLock();
    process.exit(0);
  }

  status(): void {
    this.logger.info('📊 Cron scheduler status:');

    try {
      const status = cronScheduler.getStatus();

      if (status.length === 0) {
        this.logger.warn('❌ No cron jobs are currently scheduled.');
      } else {
        this.logger.info('📋 Scheduled tasks:');
        status.forEach(({ name, running }) => {
          const icon = running ? '✅' : '❌';
          this.logger.info(
            `  ${icon} ${name}: ${running ? 'Running' : 'Stopped'}`
          );
        });
      }
    } catch (error) {
      this.logger.error('Error getting scheduler status:', error);
      process.exit(1);
    }
  }

  async test(): Promise<void> {
    this.logger.info('🧪 Testing cron job endpoints...');
    await this.tester.testAllEndpoints();
  }

  showHelp(): void {
    this.logger.info('❓ Usage:');
    this.logger.info('  npm run cron:start  - Start the cron scheduler');
    this.logger.info('  npm run cron:stop   - Stop the cron scheduler');
    this.logger.info('  npm run cron:status - Check scheduler status');
    this.logger.info('  npm run cron:test   - Test cron endpoints');
    this.logger.info('');
    this.logger.info('📋 Available cron jobs:');
    this.logger.info(
      '  • immediate-alerts   - Process immediate job alerts (every 5 minutes)'
    );
    this.logger.info(
      '  • daily-alerts       - Process daily job alerts (9:00 AM daily)'
    );
    this.logger.info(
      '  • weekly-digests     - Send weekly digests (9:00 AM Monday)'
    );
    this.logger.info(
      '  • token-cleanup      - Clean expired tokens (2:00 AM daily)'
    );
    this.logger.info(
      '  • job-rankings       - Update job rankings (every 6 hours)'
    );
    this.logger.info(
      '  • db-maintenance     - Database maintenance (3:00 AM daily)'
    );
    this.logger.info('');
    this.logger.info('🔧 Environment Variables:');
    this.logger.info(
      '  CRON_SCHEDULER_LOG_LEVEL     - Log level (debug, info, warn, error)'
    );
    this.logger.info(
      '  CRON_SCHEDULER_HEALTH_INTERVAL - Health check interval in ms'
    );
    this.logger.info('  CRON_SCHEDULER_PID_FILE      - PID file location');
    this.logger.info('  CRON_SCHEDULER_LOCK_FILE     - Lock file location');
    this.logger.info('  NEXT_PUBLIC_BASE_URL         - Base URL for testing');
    this.logger.info(
      '  CRON_SECRET                  - Secret for cron endpoint authentication'
    );
  }
}

// Main execution
async function main(): Promise<void> {
  const command = process.argv[2];
  const manager = new CronSchedulerManager();

  console.log('📅 209jobs Cron Scheduler Management');
  console.log('=====================================');

  try {
    switch (command) {
      case 'start':
        await manager.start();
        break;

      case 'stop':
        manager.stop();
        break;

      case 'status':
        manager.status();
        break;

      case 'test':
        await manager.test();
        break;

      default:
        manager.showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
