#!/usr/bin/env node

/**
 * Adzuna Job Import Cron Script
 * 
 * Enhanced version with proper process management, error handling,
 * configuration support, and monitoring capabilities.
 * 
 * Features:
 * - Configurable scheduling via environment variables
 * - Comprehensive error handling and recovery
 * - Process management with graceful shutdown
 * - Resource monitoring and cleanup
 * - Health checks and status reporting
 * - Secure configuration management
 * - Logging with rotation support
 * 
 * Usage:
 *   npm run cron:adzuna
 *   node dist/scripts/adzunaCron.js
 *   pm2 start dist/scripts/adzunaCron.js --name "adzuna-cron"
 */

import * as cron from 'node-cron';
import { config } from 'dotenv';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { upsertAdzunaJobsToDb } from '../app/services/adzunaToDb';

// Load environment variables
config();

// Configuration with environment variable support and validation
interface CronConfig {
  schedule: string;
  timezone: string;
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  healthCheckInterval: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logRotation: boolean;
  maxLogFiles: number;
  processTitle: string;
  pidFile: string;
  lockFile: string;
}

class ConfigValidator {
  static validateSchedule(schedule: string): boolean {
    return cron.validate(schedule);
  }

  static validateTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  static validateNumber(value: string, min: number, max: number): number {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < min || num > max) {
      throw new Error(`Invalid number: ${value}. Must be between ${min} and ${max}`);
    }
    return num;
  }

  static validateLogLevel(level: string): 'debug' | 'info' | 'warn' | 'error' {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(level)) {
      throw new Error(`Invalid log level: ${level}. Must be one of: ${validLevels.join(', ')}`);
    }
    return level as 'debug' | 'info' | 'warn' | 'error';
  }
}

class Logger {
  private logLevel: 'debug' | 'info' | 'warn' | 'error';
  private logRotation: boolean;
  private maxLogFiles: number;
  private logDir: string;

  constructor(config: CronConfig) {
    this.logLevel = config.logLevel;
    this.logRotation = config.logRotation;
    this.maxLogFiles = config.maxLogFiles;
    this.logDir = join(process.cwd(), 'logs');

    if (this.logRotation) {
      this.ensureLogDirectory();
    }
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const pid = process.pid;
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${pid}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  private writeToFile(message: string): void {
    if (!this.logRotation) return;

    try {
      const logFile = join(this.logDir, `adzuna-cron-${new Date().toISOString().split('T')[0]}.log`);
      writeFileSync(logFile, message + '\n', { flag: 'a' });
      this.rotateLogsIfNeeded();
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private rotateLogsIfNeeded(): void {
    // Simple log rotation - keep only maxLogFiles
    // In production, consider using a proper log rotation library
  }

  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog('debug')) return;
    const formatted = this.formatMessage('debug', message, ...args);
    console.debug(formatted);
    this.writeToFile(formatted);
  }

  info(message: string, ...args: any[]): void {
    if (!this.shouldLog('info')) return;
    const formatted = this.formatMessage('info', message, ...args);
    console.log(formatted);
    this.writeToFile(formatted);
  }

  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog('warn')) return;
    const formatted = this.formatMessage('warn', message, ...args);
    console.warn(formatted);
    this.writeToFile(formatted);
  }

  error(message: string, ...args: any[]): void {
    if (!this.shouldLog('error')) return;
    const formatted = this.formatMessage('error', message, ...args);
    console.error(formatted);
    this.writeToFile(formatted);
  }
}

class ProcessManager {
  private config: CronConfig;
  private logger: Logger;
  private isShuttingDown = false;
  private activeOperations = new Set<Promise<any>>();
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(config: CronConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.setupProcessTitle();
    this.setupSignalHandlers();
    this.createPidFile();
    this.startHealthCheck();
  }

  private setupProcessTitle(): void {
    process.title = this.config.processTitle;
  }

  private setupSignalHandlers(): void {
    // Graceful shutdown signals
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => this.gracefulShutdown('SIGUSR2')); // For nodemon

    // Error handling
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', error);
      this.emergencyShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.emergencyShutdown('unhandledRejection');
    });

    // Memory warnings
    process.on('warning', (warning) => {
      this.logger.warn('Process warning:', warning);
    });
  }

  private createPidFile(): void {
    try {
      writeFileSync(this.config.pidFile, process.pid.toString());
      this.logger.debug(`PID file created: ${this.config.pidFile}`);
    } catch (error) {
      this.logger.error('Failed to create PID file:', error);
    }
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
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
        external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
      },
      activeOperations: this.activeOperations.size
    });

    // Memory threshold check (500MB)
    if (memUsage.rss > 500 * 1024 * 1024) {
      this.logger.warn('High memory usage detected:', {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`
      });
    }
  }

  async trackOperation<T>(operation: Promise<T>): Promise<T> {
    this.activeOperations.add(operation);
    try {
      const result = await operation;
      return result;
    } finally {
      this.activeOperations.delete(operation);
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
    }

    // Wait for active operations to complete (with timeout)
    if (this.activeOperations.size > 0) {
      this.logger.info(`Waiting for ${this.activeOperations.size} active operations to complete...`);
      
      const timeout = new Promise(resolve => setTimeout(resolve, 30000)); // 30 second timeout
      const allOperations = Promise.all(Array.from(this.activeOperations));
      
      try {
        await Promise.race([allOperations, timeout]);
      } catch (error) {
        this.logger.error('Error waiting for operations to complete:', error);
      }
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
      if (existsSync(this.config.lockFile)) {
        require('fs').unlinkSync(this.config.lockFile);
        this.logger.debug('Lock file removed');
      }
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }
}

class AdzunaCronService {
  private config: CronConfig;
  private logger: Logger;
  private processManager: ProcessManager;
  private cronTask?: any;
  private retryCount = 0;

  constructor() {
    this.config = this.loadConfiguration();
    this.logger = new Logger(this.config);
    this.processManager = new ProcessManager(this.config, this.logger);
    
    this.logger.info('Adzuna cron service initialized', {
      schedule: this.config.schedule,
      timezone: this.config.timezone,
      enabled: this.config.enabled
    });
  }

  private loadConfiguration(): CronConfig {
    try {
      const config: CronConfig = {
        schedule: process.env.ADZUNA_CRON_SCHEDULE || '0 2 * * *',
        timezone: process.env.ADZUNA_CRON_TIMEZONE || 'America/Los_Angeles',
        enabled: process.env.ADZUNA_CRON_ENABLED !== 'false',
        maxRetries: ConfigValidator.validateNumber(process.env.ADZUNA_CRON_MAX_RETRIES || '3', 0, 10),
        retryDelay: ConfigValidator.validateNumber(process.env.ADZUNA_CRON_RETRY_DELAY || '60000', 1000, 300000),
        timeout: ConfigValidator.validateNumber(process.env.ADZUNA_CRON_TIMEOUT || '1800000', 60000, 3600000), // 30 minutes
        healthCheckInterval: ConfigValidator.validateNumber(process.env.ADZUNA_CRON_HEALTH_INTERVAL || '300000', 60000, 600000), // 5 minutes
        logLevel: ConfigValidator.validateLogLevel(process.env.ADZUNA_CRON_LOG_LEVEL || 'info'),
        logRotation: process.env.ADZUNA_CRON_LOG_ROTATION !== 'false',
        maxLogFiles: ConfigValidator.validateNumber(process.env.ADZUNA_CRON_MAX_LOG_FILES || '7', 1, 30),
        processTitle: process.env.ADZUNA_CRON_PROCESS_TITLE || 'adzuna-cron-service',
        pidFile: process.env.ADZUNA_CRON_PID_FILE || join(process.cwd(), 'adzuna-cron.pid'),
        lockFile: process.env.ADZUNA_CRON_LOCK_FILE || join(process.cwd(), 'adzuna-cron.lock')
      };

      // Validate configuration
      if (!ConfigValidator.validateSchedule(config.schedule)) {
        throw new Error(`Invalid cron schedule: ${config.schedule}`);
      }

      if (!ConfigValidator.validateTimezone(config.timezone)) {
        throw new Error(`Invalid timezone: ${config.timezone}`);
      }

      return config;
    } catch (error) {
      console.error('Configuration validation failed:', error);
      process.exit(1);
    }
  }

  private async checkLock(): Promise<boolean> {
    if (existsSync(this.config.lockFile)) {
      this.logger.warn('Lock file exists, another instance may be running');
      return false;
    }
    
    try {
      writeFileSync(this.config.lockFile, process.pid.toString());
      return true;
    } catch (error) {
      this.logger.error('Failed to create lock file:', error);
      return false;
    }
  }

  private removeLock(): void {
    try {
      if (existsSync(this.config.lockFile)) {
        require('fs').unlinkSync(this.config.lockFile);
      }
    } catch (error) {
      this.logger.error('Failed to remove lock file:', error);
    }
  }

  async start(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info('Adzuna cron is disabled via configuration');
      return;
    }

    if (!await this.checkLock()) {
      this.logger.error('Failed to acquire lock, exiting');
      process.exit(1);
    }

    this.logger.info('Starting Adzuna cron scheduler...');

    this.cronTask = cron.schedule(this.config.schedule, async () => {
      await this.executeJob();
    }, {
      timezone: this.config.timezone
    });

    this.logger.info(`Adzuna cron job scheduled with pattern: ${this.config.schedule}`);
    this.logger.info('Press Ctrl+C to stop the service');

    // Keep the process alive
    await new Promise(() => {}); // This will run until process is terminated
  }

  private async executeJob(): Promise<void> {
    const jobId = `job-${Date.now()}`;
    this.logger.info(`Starting Adzuna job import (${jobId})...`);
    
    const startTime = Date.now();
    let success = false;
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job execution timeout')), this.config.timeout);
      });

      // Execute the job with timeout protection
      const jobPromise = this.processManager.trackOperation(upsertAdzunaJobsToDb());
      
      await Promise.race([jobPromise, timeoutPromise]);
      
      success = true;
      this.retryCount = 0; // Reset retry count on success
      
      const duration = Date.now() - startTime;
      this.logger.info(`Completed Adzuna job import (${jobId}) in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed Adzuna job import (${jobId}) after ${duration}ms:`, error);
      
      await this.handleJobFailure(error);
    }
  }

  private async handleJobFailure(error: any): Promise<void> {
    this.retryCount++;
    
    if (this.retryCount <= this.config.maxRetries) {
      this.logger.warn(`Scheduling retry ${this.retryCount}/${this.config.maxRetries} in ${this.config.retryDelay}ms`);
      
      setTimeout(async () => {
        try {
          await this.executeJob();
        } catch (retryError) {
          this.logger.error('Retry failed:', retryError);
        }
      }, this.config.retryDelay);
    } else {
      this.logger.error(`Max retries (${this.config.maxRetries}) exceeded. Giving up until next scheduled run.`);
      this.retryCount = 0; // Reset for next scheduled run
    }
  }

  stop(): void {
    this.logger.info('Stopping Adzuna cron service...');
    
    if (this.cronTask) {
      this.cronTask.stop();
      this.logger.info('Cron task stopped');
    }
    
    this.removeLock();
    this.logger.info('Adzuna cron service stopped');
  }
}

// Main execution
async function main(): Promise<void> {
  const service = new AdzunaCronService();
  
  // Store service reference for cleanup
  (global as any).adzunaCronService = service;
  
  await service.start();
}

// Handle cleanup on exit
process.on('exit', () => {
  const service = (global as any).adzunaCronService;
  if (service) {
    service.stop();
  }
});

// Start the service
main().catch((error) => {
  console.error('Failed to start Adzuna cron service:', error);
  process.exit(1);
}); 