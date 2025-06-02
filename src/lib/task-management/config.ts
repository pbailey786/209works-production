import fs from 'fs/promises';
import * as fsSync from 'fs';
import path from 'path';
import { TaskMasterConfig, TaskMasterConfigSchema } from './validation';

/**
 * Configuration Manager for Task Master System
 * Handles loading, validation, and management of configuration files
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: TaskMasterConfig | null = null;
  private configPath: string | null = null;
  private watchers: Map<string, fsSync.FSWatcher> = new Map();

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration from file with validation
   */
  async loadConfig(configPath: string): Promise<TaskMasterConfig> {
    try {
      this.configPath = path.resolve(configPath);
      
      // Check if config file exists
      await fs.access(this.configPath);
      
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      const configData = JSON.parse(configContent);
      
      // Validate configuration
      this.config = TaskMasterConfigSchema.parse(configData);
      
      // Apply defaults and migrations
      this.config = this.applyDefaults(this.config);
      this.config = await this.migrateConfig(this.config);
      
      return this.config;
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new Error(`Configuration file not found: ${configPath}`);
      }
      throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create default configuration file
   */
  async createDefaultConfig(configPath: string): Promise<TaskMasterConfig> {
    const defaultConfig: TaskMasterConfig = {
      models: {
        main: {
          provider: 'openai',
          modelId: 'gpt-4',
          maxTokens: 4000,
          temperature: 0.7
        },
        research: {
          provider: 'perplexity',
          modelId: 'llama-3.1-sonet-large-128k-online',
          maxTokens: 8000,
          temperature: 0.3
        },
        fallback: {
          provider: 'openai',
          modelId: 'gpt-3.5-turbo',
          maxTokens: 2000,
          temperature: 0.5
        }
      },
      global: {
        logLevel: 'info',
        debug: false,
        defaultSubtasks: 5,
        defaultPriority: 'medium',
        projectName: 'Task Master Project',
        userId: 'default-user',
        maxTasksPerFile: 100,
        enableBackups: true,
        backupRetentionDays: 30,
        enableIntegrityChecks: true,
        enablePerformanceOptimization: true
      }
    };

    // Validate the default config
    const validatedConfig = TaskMasterConfigSchema.parse(defaultConfig);
    
    // Save to file
    await this.saveConfig(configPath, validatedConfig);
    
    this.config = validatedConfig;
    this.configPath = path.resolve(configPath);
    
    return validatedConfig;
  }

  /**
   * Save configuration to file
   */
  async saveConfig(configPath: string, config: TaskMasterConfig): Promise<void> {
    try {
      // Validate before saving
      const validatedConfig = TaskMasterConfigSchema.parse(config);
      
      // Ensure directory exists
      const configDir = path.dirname(configPath);
      await fs.mkdir(configDir, { recursive: true });
      
      // Write to temporary file first, then rename (atomic operation)
      const tempPath = `${configPath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(validatedConfig, null, 2));
      await fs.rename(tempPath, configPath);
      
      this.config = validatedConfig;
      this.configPath = path.resolve(configPath);
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update specific configuration values
   */
  async updateConfig(updates: Partial<TaskMasterConfig>): Promise<TaskMasterConfig> {
    if (!this.config || !this.configPath) {
      throw new Error('No configuration loaded. Load or create a configuration first.');
    }

    // Deep merge updates with existing config
    const updatedConfig = this.deepMerge(this.config, updates);
    
    // Validate merged config
    const validatedConfig = TaskMasterConfigSchema.parse(updatedConfig);
    
    // Save updated config
    await this.saveConfig(this.configPath, validatedConfig);
    
    return validatedConfig;
  }

  /**
   * Get current configuration
   */
  getConfig(): TaskMasterConfig | null {
    return this.config;
  }

  /**
   * Validate configuration without loading
   */
  async validateConfigFile(configPath: string): Promise<{ 
    isValid: boolean; 
    errors: string[]; 
    warnings: string[] 
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if file exists
      await fs.access(configPath);
      
      // Read and parse
      const configContent = await fs.readFile(configPath, 'utf-8');
      const configData = JSON.parse(configContent);
      
      // Validate schema
      TaskMasterConfigSchema.parse(configData);
      
      // Additional validation checks
      const additionalChecks = this.performAdditionalValidation(configData);
      warnings.push(...additionalChecks.warnings);
      
      return { isValid: true, errors, warnings };
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      } else {
        errors.push('Unknown validation error');
      }
      
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Watch configuration file for changes
   */
  async watchConfig(callback: (config: TaskMasterConfig) => void): Promise<void> {
    if (!this.configPath) {
      throw new Error('No configuration path set. Load a configuration first.');
    }

    // Stop existing watcher if any
    await this.stopWatching();

    try {
      const watcher = fsSync.watch(this.configPath, async (eventType) => {
        if (eventType === 'change') {
          try {
            const updatedConfig = await this.loadConfig(this.configPath!);
            callback(updatedConfig);
          } catch (error) {
            console.error('Failed to reload configuration:', error);
          }
        }
      });

      this.watchers.set(this.configPath, watcher);
    } catch (error) {
      throw new Error(`Failed to watch configuration file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop watching configuration file
   */
  async stopWatching(): Promise<void> {
    for (const [path, watcher] of this.watchers) {
      watcher.close();
      this.watchers.delete(path);
    }
  }

  /**
   * Get configuration schema for documentation
   */
  getConfigSchema(): object {
    return TaskMasterConfigSchema._def;
  }

  /**
   * Export configuration as environment variables
   */
  exportAsEnvVars(): Record<string, string> {
    if (!this.config) {
      throw new Error('No configuration loaded');
    }

    const envVars: Record<string, string> = {};
    
    // Flatten configuration to environment variables
    envVars['TASKMASTER_MAIN_PROVIDER'] = this.config.models.main.provider;
    envVars['TASKMASTER_MAIN_MODEL'] = this.config.models.main.modelId;
    envVars['TASKMASTER_MAIN_MAX_TOKENS'] = this.config.models.main.maxTokens.toString();
    envVars['TASKMASTER_MAIN_TEMPERATURE'] = this.config.models.main.temperature.toString();
    
    envVars['TASKMASTER_RESEARCH_PROVIDER'] = this.config.models.research.provider;
    envVars['TASKMASTER_RESEARCH_MODEL'] = this.config.models.research.modelId;
    envVars['TASKMASTER_RESEARCH_MAX_TOKENS'] = this.config.models.research.maxTokens.toString();
    envVars['TASKMASTER_RESEARCH_TEMPERATURE'] = this.config.models.research.temperature.toString();
    
    envVars['TASKMASTER_FALLBACK_PROVIDER'] = this.config.models.fallback.provider;
    envVars['TASKMASTER_FALLBACK_MODEL'] = this.config.models.fallback.modelId;
    envVars['TASKMASTER_FALLBACK_MAX_TOKENS'] = this.config.models.fallback.maxTokens.toString();
    envVars['TASKMASTER_FALLBACK_TEMPERATURE'] = this.config.models.fallback.temperature.toString();
    
    envVars['TASKMASTER_LOG_LEVEL'] = this.config.global.logLevel;
    envVars['TASKMASTER_DEBUG'] = this.config.global.debug.toString();
    envVars['TASKMASTER_DEFAULT_SUBTASKS'] = this.config.global.defaultSubtasks.toString();
    envVars['TASKMASTER_DEFAULT_PRIORITY'] = this.config.global.defaultPriority;
    envVars['TASKMASTER_PROJECT_NAME'] = this.config.global.projectName;
    envVars['TASKMASTER_USER_ID'] = this.config.global.userId;
    envVars['TASKMASTER_MAX_TASKS_PER_FILE'] = this.config.global.maxTasksPerFile.toString();
    envVars['TASKMASTER_ENABLE_BACKUPS'] = this.config.global.enableBackups.toString();
    envVars['TASKMASTER_BACKUP_RETENTION_DAYS'] = this.config.global.backupRetentionDays.toString();
    envVars['TASKMASTER_ENABLE_INTEGRITY_CHECKS'] = this.config.global.enableIntegrityChecks.toString();
    envVars['TASKMASTER_ENABLE_PERFORMANCE_OPTIMIZATION'] = this.config.global.enablePerformanceOptimization.toString();
    
    if (this.config.global.ollamaBaseUrl) {
      envVars['TASKMASTER_OLLAMA_BASE_URL'] = this.config.global.ollamaBaseUrl;
    }
    
    return envVars;
  }

  /**
   * Import configuration from environment variables
   */
  importFromEnvVars(): Partial<TaskMasterConfig> {
    const config: Partial<TaskMasterConfig> = {
      models: {
        main: {},
        research: {},
        fallback: {}
      } as any,
      global: {} as any
    };

    // Import model configurations
    if (process.env.TASKMASTER_MAIN_PROVIDER) {
      config.models!.main.provider = process.env.TASKMASTER_MAIN_PROVIDER;
    }
    if (process.env.TASKMASTER_MAIN_MODEL) {
      config.models!.main.modelId = process.env.TASKMASTER_MAIN_MODEL;
    }
    if (process.env.TASKMASTER_MAIN_MAX_TOKENS) {
      config.models!.main.maxTokens = parseInt(process.env.TASKMASTER_MAIN_MAX_TOKENS);
    }
    if (process.env.TASKMASTER_MAIN_TEMPERATURE) {
      config.models!.main.temperature = parseFloat(process.env.TASKMASTER_MAIN_TEMPERATURE);
    }

    // Import global configurations
    if (process.env.TASKMASTER_LOG_LEVEL) {
      config.global!.logLevel = process.env.TASKMASTER_LOG_LEVEL as any;
    }
    if (process.env.TASKMASTER_DEBUG) {
      config.global!.debug = process.env.TASKMASTER_DEBUG === 'true';
    }
    if (process.env.TASKMASTER_DEFAULT_SUBTASKS) {
      config.global!.defaultSubtasks = parseInt(process.env.TASKMASTER_DEFAULT_SUBTASKS);
    }
    if (process.env.TASKMASTER_PROJECT_NAME) {
      config.global!.projectName = process.env.TASKMASTER_PROJECT_NAME;
    }
    if (process.env.TASKMASTER_USER_ID) {
      config.global!.userId = process.env.TASKMASTER_USER_ID;
    }

    return config;
  }

  /**
   * Apply default values to configuration
   */
  private applyDefaults(config: TaskMasterConfig): TaskMasterConfig {
    // Apply any missing default values
    return {
      ...config,
      global: {
        ...config.global,
        maxTasksPerFile: config.global.maxTasksPerFile ?? 100,
        enableBackups: config.global.enableBackups ?? true,
        backupRetentionDays: config.global.backupRetentionDays ?? 30,
        enableIntegrityChecks: config.global.enableIntegrityChecks ?? true,
        enablePerformanceOptimization: config.global.enablePerformanceOptimization ?? true,
      }
    };
  }

  /**
   * Migrate configuration to latest version
   */
  private async migrateConfig(config: TaskMasterConfig): Promise<TaskMasterConfig> {
    // Add any necessary migrations here
    // For now, just return the config as-is
    return config;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Perform additional validation checks
   */
  private performAdditionalValidation(config: any): { warnings: string[] } {
    const warnings: string[] = [];

    // Check for deprecated configurations
    if (config.deprecated) {
      warnings.push('Configuration contains deprecated fields that should be removed');
    }

    // Check model provider availability
    const providers = ['openai', 'anthropic', 'perplexity', 'ollama'];
    if (!providers.includes(config.models?.main?.provider)) {
      warnings.push(`Unknown main model provider: ${config.models?.main?.provider}`);
    }

    // Check token limits
    if (config.models?.main?.maxTokens > 32000) {
      warnings.push('Main model max tokens is very high, this may cause performance issues');
    }

    // Check project name
    if (!config.global?.projectName || config.global.projectName.trim() === '') {
      warnings.push('Project name is empty or missing');
    }

    return { warnings };
  }
}

/**
 * Configuration utilities
 */
export class ConfigUtils {
  /**
   * Generate configuration template
   */
  static generateTemplate(): string {
    const template = {
      models: {
        main: {
          provider: 'openai',
          modelId: 'gpt-4',
          maxTokens: 4000,
          temperature: 0.7
        },
        research: {
          provider: 'perplexity',
          modelId: 'llama-3.1-sonet-large-128k-online',
          maxTokens: 8000,
          temperature: 0.3
        },
        fallback: {
          provider: 'openai',
          modelId: 'gpt-3.5-turbo',
          maxTokens: 2000,
          temperature: 0.5
        }
      },
      global: {
        logLevel: 'info',
        debug: false,
        defaultSubtasks: 5,
        defaultPriority: 'medium',
        projectName: 'Your Project Name',
        userId: 'your-user-id',
        maxTasksPerFile: 100,
        enableBackups: true,
        backupRetentionDays: 30,
        enableIntegrityChecks: true,
        enablePerformanceOptimization: true,
        ollamaBaseUrl: 'http://localhost:11434'
      }
    };

    return JSON.stringify(template, null, 2);
  }

  /**
   * Validate model configuration
   */
  static validateModelConfig(provider: string, modelId: string): { 
    isValid: boolean; 
    warnings: string[] 
  } {
    const warnings: string[] = [];
    let isValid = true;

    // Provider-specific validation
    switch (provider.toLowerCase()) {
      case 'openai':
        if (!modelId.startsWith('gpt-')) {
          warnings.push('OpenAI model ID should start with "gpt-"');
        }
        break;
      case 'anthropic':
        if (!modelId.startsWith('claude-')) {
          warnings.push('Anthropic model ID should start with "claude-"');
        }
        break;
      case 'ollama':
        if (modelId.includes('/')) {
          warnings.push('Ollama model ID should not contain slashes');
        }
        break;
    }

    return { isValid, warnings };
  }

  /**
   * Get recommended configurations for different use cases
   */
  static getRecommendedConfigs(): Record<string, Partial<TaskMasterConfig>> {
    return {
      development: {
        global: {
          userId: 'dev-user',
          debug: true,
          projectName: 'Development Project',
          logLevel: 'debug',
          defaultSubtasks: 3,
          defaultPriority: 'medium',
          enablePerformanceOptimization: false,
          enableBackups: true,
          enableIntegrityChecks: true,
          maxTasksPerFile: 100,
          backupRetentionDays: 30,
        }
      },
      
      production: {
        global: {
          userId: 'prod-user',
          debug: false,
          projectName: 'Production Project',
          logLevel: 'warn',
          defaultSubtasks: 5,
          defaultPriority: 'high',
          enablePerformanceOptimization: true,
          enableBackups: true,
          enableIntegrityChecks: true,
          maxTasksPerFile: 100,
          backupRetentionDays: 30,
        }
      },
      
      testing: {
        global: {
          userId: 'test-user',
          debug: false,
          projectName: 'Test Project',
          logLevel: 'error',
          defaultSubtasks: 2,
          defaultPriority: 'low',
          enableBackups: false,
          enableIntegrityChecks: false,
          enablePerformanceOptimization: false,
          maxTasksPerFile: 50,
          backupRetentionDays: 7,
        }
      },
    };
  }
} 