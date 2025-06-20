/**
 * Third-Party Integrations for 209 Works
 * ATS, HRMS, CRM, and other system integrations
 */

import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import { AuditLogger } from '@/lib/monitoring/error-monitor';
import WebhookSystem from './webhook-system';

export interface IntegrationProvider {
  id: string;
  name: string;
  type: 'ats' | 'hrms' | 'crm' | 'analytics' | 'email' | 'calendar' | 'custom';
  description: string;
  logoUrl: string;
  authType: 'oauth2' | 'api_key' | 'basic' | 'custom';
  configSchema: Record<string, any>;
  supportedFeatures: string[];
  webhookSupport: boolean;
  status: 'active' | 'beta' | 'deprecated';
}

export interface IntegrationConnection {
  id: string;
  userId: string;
  providerId: string;
  name: string;
  config: Record<string, any>;
  credentials: Record<string, any>; // Encrypted
  status: 'active' | 'inactive' | 'error' | 'pending';
  lastSyncAt?: Date;
  lastErrorAt?: Date;
  lastError?: string;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

/**
 * Third-Party Integration Manager
 */
export class ThirdPartyIntegrationManager {
  private static instance: ThirdPartyIntegrationManager;
  private providers: Map<string, IntegrationProvider> = new Map();
  private webhookSystem: WebhookSystem;

  private constructor() {
    this.webhookSystem = WebhookSystem.getInstance();
    this.initializeProviders();
  }

  static getInstance(): ThirdPartyIntegrationManager {
    if (!this.instance) {
      this.instance = new ThirdPartyIntegrationManager();
    }
    return this.instance;
  }

  /**
   * Initialize supported integration providers
   */
  private initializeProviders() {
    const providers: IntegrationProvider[] = [
      {
        id: 'greenhouse',
        name: 'Greenhouse',
        type: 'ats',
        description: 'Leading applicant tracking system for hiring teams',
        logoUrl: '/integrations/greenhouse.png',
        authType: 'api_key',
        configSchema: {
          type: 'object',
          properties: {
            apiKey: { type: 'string', description: 'Greenhouse API Key' },
            boardToken: { type: 'string', description: 'Job Board Token' },
            webhookSecret: { type: 'string', description: 'Webhook Secret' },
          },
          required: ['apiKey'],
        },
        supportedFeatures: ['job_sync', 'application_sync', 'candidate_sync', 'webhooks'],
        webhookSupport: true,
        status: 'active',
      },
      {
        id: 'workday',
        name: 'Workday',
        type: 'hrms',
        description: 'Enterprise human capital management platform',
        logoUrl: '/integrations/workday.png',
        authType: 'oauth2',
        configSchema: {
          type: 'object',
          properties: {
            tenantUrl: { type: 'string', description: 'Workday Tenant URL' },
            clientId: { type: 'string', description: 'OAuth Client ID' },
            clientSecret: { type: 'string', description: 'OAuth Client Secret' },
          },
          required: ['tenantUrl', 'clientId', 'clientSecret'],
        },
        supportedFeatures: ['employee_sync', 'job_sync', 'org_chart'],
        webhookSupport: false,
        status: 'active',
      },
      {
        id: 'lever',
        name: 'Lever',
        type: 'ats',
        description: 'Modern recruiting platform for growing companies',
        logoUrl: '/integrations/lever.png',
        authType: 'oauth2',
        configSchema: {
          type: 'object',
          properties: {
            clientId: { type: 'string', description: 'OAuth Client ID' },
            clientSecret: { type: 'string', description: 'OAuth Client Secret' },
            webhookSecret: { type: 'string', description: 'Webhook Secret' },
          },
          required: ['clientId', 'clientSecret'],
        },
        supportedFeatures: ['job_sync', 'application_sync', 'interview_sync', 'webhooks'],
        webhookSupport: true,
        status: 'active',
      },
      {
        id: 'salesforce',
        name: 'Salesforce',
        type: 'crm',
        description: 'World\'s leading customer relationship management platform',
        logoUrl: '/integrations/salesforce.png',
        authType: 'oauth2',
        configSchema: {
          type: 'object',
          properties: {
            instanceUrl: { type: 'string', description: 'Salesforce Instance URL' },
            clientId: { type: 'string', description: 'Connected App Client ID' },
            clientSecret: { type: 'string', description: 'Connected App Client Secret' },
          },
          required: ['instanceUrl', 'clientId', 'clientSecret'],
        },
        supportedFeatures: ['contact_sync', 'lead_sync', 'opportunity_sync'],
        webhookSupport: true,
        status: 'active',
      },
      {
        id: 'bamboohr',
        name: 'BambooHR',
        type: 'hrms',
        description: 'HR software for small and medium businesses',
        logoUrl: '/integrations/bamboohr.png',
        authType: 'api_key',
        configSchema: {
          type: 'object',
          properties: {
            apiKey: { type: 'string', description: 'BambooHR API Key' },
            subdomain: { type: 'string', description: 'Company Subdomain' },
          },
          required: ['apiKey', 'subdomain'],
        },
        supportedFeatures: ['employee_sync', 'time_off_sync', 'performance_sync'],
        webhookSupport: false,
        status: 'active',
      },
      {
        id: 'google_calendar',
        name: 'Google Calendar',
        type: 'calendar',
        description: 'Schedule interviews and manage hiring calendar',
        logoUrl: '/integrations/google-calendar.png',
        authType: 'oauth2',
        configSchema: {
          type: 'object',
          properties: {
            clientId: { type: 'string', description: 'Google OAuth Client ID' },
            clientSecret: { type: 'string', description: 'Google OAuth Client Secret' },
            calendarId: { type: 'string', description: 'Calendar ID for interviews' },
          },
          required: ['clientId', 'clientSecret'],
        },
        supportedFeatures: ['interview_scheduling', 'calendar_sync', 'availability_check'],
        webhookSupport: true,
        status: 'active',
      },
      {
        id: 'slack',
        name: 'Slack',
        type: 'communication',
        description: 'Team communication and hiring notifications',
        logoUrl: '/integrations/slack.png',
        authType: 'oauth2',
        configSchema: {
          type: 'object',
          properties: {
            botToken: { type: 'string', description: 'Slack Bot Token' },
            signingSecret: { type: 'string', description: 'Slack Signing Secret' },
            channelId: { type: 'string', description: 'Default notification channel' },
          },
          required: ['botToken', 'signingSecret'],
        },
        supportedFeatures: ['notifications', 'candidate_sharing', 'team_updates'],
        webhookSupport: true,
        status: 'active',
      },
    ];

    providers.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  /**
   * Get all available integration providers
   */
  getProviders(type?: string): IntegrationProvider[] {
    const allProviders = Array.from(this.providers.values());
    return type ? allProviders.filter(p => p.type === type) : allProviders;
  }

  /**
   * Get specific provider
   */
  getProvider(providerId: string): IntegrationProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Create new integration connection
   */
  async createConnection(params: {
    userId: string;
    providerId: string;
    name: string;
    config: Record<string, any>;
    credentials: Record<string, any>;
    features: string[];
    syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  }): Promise<IntegrationConnection> {
    const { userId, providerId, name, config, credentials, features, syncFrequency = 'daily' } = params;

    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    // Validate configuration
    this.validateConfig(config, provider.configSchema);

    // Encrypt credentials
    const encryptedCredentials = await this.encryptCredentials(credentials);

    const connection: IntegrationConnection = {
      id: this.generateConnectionId(),
      userId,
      providerId,
      name,
      config,
      credentials: encryptedCredentials,
      status: 'pending',
      syncFrequency,
      features,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in database
    await prisma.integration.create({
      data: {
        id: connection.id,
        userId: connection.userId,
        providerId: connection.providerId,
        name: connection.name,
        config: connection.config,
        credentials: connection.credentials,
        status: connection.status,
        syncFrequency: connection.syncFrequency,
        features: connection.features,
      },
    });

    // Test connection
    const testResult = await this.testConnection(connection);
    
    // Update status based on test result
    const finalStatus = testResult.success ? 'active' : 'error';
    await prisma.integration.update({
      where: { id: connection.id },
      data: { 
        status: finalStatus,
        lastErrorAt: testResult.success ? undefined : new Date(),
        lastError: testResult.success ? undefined : testResult.error,
      },
    });

    // Log integration creation
    AuditLogger.log({
      action: 'integration_created',
      resource: 'integration',
      resourceId: connection.id,
      userId,
      userEmail: '',
      ipAddress: 'system',
      timestamp: new Date(),
      success: testResult.success,
      details: {
        providerId,
        providerName: provider.name,
        features,
        testResult,
      },
    });

    return { ...connection, status: finalStatus };
  }

  /**
   * Test integration connection
   */
  async testConnection(connection: IntegrationConnection): Promise<{
    success: boolean;
    error?: string;
    details?: Record<string, any>;
  }> {
    try {
      const provider = this.getProvider(connection.providerId);
      if (!provider) {
        return { success: false, error: 'Provider not found' };
      }

      // Decrypt credentials
      const credentials = await this.decryptCredentials(connection.credentials);

      // Test connection based on provider type
      switch (connection.providerId) {
        case 'greenhouse':
          return await this.testGreenhouseConnection(credentials, connection.config);
        
        case 'lever':
          return await this.testLeverConnection(credentials, connection.config);
        
        case 'workday':
          return await this.testWorkdayConnection(credentials, connection.config);
        
        case 'salesforce':
          return await this.testSalesforceConnection(credentials, connection.config);
        
        default:
          return { success: true, details: { message: 'Test not implemented for this provider' } };
      }

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Sync data from integration
   */
  async syncData(connectionId: string, feature: string): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      const connection = await prisma.integration.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new Error('Integration connection not found');
      }

      if (connection.status !== 'active') {
        throw new Error('Integration connection is not active');
      }

      // Decrypt credentials
      const credentials = await this.decryptCredentials(connection.credentials);

      // Perform sync based on provider and feature
      const syncResult = await this.performSync(connection, credentials, feature);

      // Update last sync timestamp
      await prisma.integration.update({
        where: { id: connectionId },
        data: { lastSyncAt: new Date() },
      });

      // Log sync result
      AuditLogger.log({
        action: 'integration_sync',
        resource: 'integration',
        resourceId: connectionId,
        userId: connection.userId,
        userEmail: '',
        ipAddress: 'system',
        timestamp: new Date(),
        success: syncResult.success,
        details: {
          feature,
          recordsProcessed: syncResult.recordsProcessed,
          duration: syncResult.duration,
        },
      });

      return syncResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update error status
      await prisma.integration.update({
        where: { id: connectionId },
        data: {
          lastErrorAt: new Date(),
          lastError: errorMessage,
        },
      });

      return {
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        errors: [errorMessage],
        duration,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Helper methods for specific providers
   */
  private async testGreenhouseConnection(credentials: any, config: any) {
    // Test Greenhouse API connection
    const response = await fetch('https://harvest-api.greenhouse.io/v1/users', {
      headers: {
        'Authorization': `Basic ${Buffer.from(credentials.apiKey + ':').toString('base64')}`,
      },
    });

    if (response.ok) {
      return { success: true, details: { message: 'Connection successful' } };
    } else {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  }

  private async testLeverConnection(credentials: any, config: any) {
    // Test Lever API connection
    // Implementation would depend on Lever's API
    return { success: true, details: { message: 'Lever connection test not implemented' } };
  }

  private async testWorkdayConnection(credentials: any, config: any) {
    // Test Workday API connection
    // Implementation would depend on Workday's API
    return { success: true, details: { message: 'Workday connection test not implemented' } };
  }

  private async testSalesforceConnection(credentials: any, config: any) {
    // Test Salesforce API connection
    // Implementation would depend on Salesforce's API
    return { success: true, details: { message: 'Salesforce connection test not implemented' } };
  }

  private async performSync(connection: any, credentials: any, feature: string): Promise<SyncResult> {
    // Implementation would depend on the specific provider and feature
    // This is a placeholder that would be expanded for each integration
    
    return {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [],
      duration: 100,
      timestamp: new Date(),
    };
  }

  /**
   * Utility methods
   */
  private validateConfig(config: Record<string, any>, schema: Record<string, any>): void {
    // Basic validation - in production, use a proper JSON schema validator
    const required = schema.required || [];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }
  }

  private async encryptCredentials(credentials: Record<string, any>): Promise<Record<string, any>> {
    const encrypted: Record<string, any> = {};
    for (const [key, value] of Object.entries(credentials)) {
      if (typeof value === 'string') {
        encrypted[key] = await encrypt(value);
      } else {
        encrypted[key] = value;
      }
    }
    return encrypted;
  }

  private async decryptCredentials(encryptedCredentials: Record<string, any>): Promise<Record<string, any>> {
    const decrypted: Record<string, any> = {};
    for (const [key, value] of Object.entries(encryptedCredentials)) {
      if (typeof value === 'string' && value.includes(':')) {
        decrypted[key] = await decrypt(value);
      } else {
        decrypted[key] = value;
      }
    }
    return decrypted;
  }

  private generateConnectionId(): string {
    return `int_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

export default ThirdPartyIntegrationManager;
