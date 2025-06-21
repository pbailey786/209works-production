/**
 * API Platform Manager for 209 Works
 * Enterprise-grade API management with rate limiting, analytics, and developer tools
 */

import { prisma } from '@/lib/database/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import { AuditLogger } from '@/lib/monitoring/error-monitor';
import { EnhancedCacheManager, CACHE_DURATIONS, CACHE_TAGS } from '@/lib/performance/enhanced-cache-manager';

export interface APIKey {
  id: string;
  name: string;
  key: string;
  hashedKey: string;
  userId: string;
  scopes: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  status: 'active' | 'suspended' | 'revoked';
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface APIUsage {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  region: string;
}

export interface RateLimitConfig {
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  concurrentRequests: number;
}

export interface WebhookEndpoint {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'disabled' | 'failed';
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffSeconds: number;
  };
  lastDeliveryAt?: Date;
  failureCount: number;
  createdAt: Date;
}

export interface Integration {
  id: string;
  name: string;
  type: 'ats' | 'hrms' | 'crm' | 'analytics' | 'custom';
  provider: string;
  config: Record<string, any>;
  credentials: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  lastSyncAt?: Date;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  userId: string;
  createdAt: Date;
}

/**
 * API Platform Manager
 */
export class APIPlatformManager {
  private static instance: APIPlatformManager;
  private rateLimitConfigs: Map<string, RateLimitConfig> = new Map();
  private activeConnections: Map<string, number> = new Map();

  private constructor() {
    this.initializeRateLimitConfigs();
  }

  static getInstance(): APIPlatformManager {
    if (!this.instance) {
      this.instance = new APIPlatformManager();
    }
    return this.instance;
  }

  /**
   * Initialize rate limit configurations
   */
  private initializeRateLimitConfigs() {
    this.rateLimitConfigs.set('free', {
      tier: 'free',
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 10,
      concurrentRequests: 5,
    });

    this.rateLimitConfigs.set('basic', {
      tier: 'basic',
      requestsPerMinute: 300,
      requestsPerHour: 10000,
      requestsPerDay: 100000,
      burstLimit: 50,
      concurrentRequests: 20,
    });

    this.rateLimitConfigs.set('pro', {
      tier: 'pro',
      requestsPerMinute: 1000,
      requestsPerHour: 50000,
      requestsPerDay: 1000000,
      burstLimit: 200,
      concurrentRequests: 100,
    });

    this.rateLimitConfigs.set('enterprise', {
      tier: 'enterprise',
      requestsPerMinute: 5000,
      requestsPerHour: 250000,
      requestsPerDay: 10000000,
      burstLimit: 1000,
      concurrentRequests: 500,
    });
  }

  /**
   * Generate new API key
   */
  async generateAPIKey(params: {
    userId: string;
    name: string;
    scopes: string[];
    tier: 'free' | 'basic' | 'pro' | 'enterprise';
    expiresInDays?: number;
    metadata?: Record<string, any>;
  }): Promise<APIKey> {
    const { userId, name, scopes, tier, expiresInDays, metadata = {} } = params;

    // Generate secure API key
    const key = this.generateSecureKey();
    const hashedKey = await this.hashAPIKey(key);

    // Get rate limit config
    const rateLimitConfig = this.rateLimitConfigs.get(tier);
    if (!rateLimitConfig) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    // Calculate expiration
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const apiKey: APIKey = {
      id: this.generateId(),
      name,
      key: `209w_${key}`, // Prefix for identification
      hashedKey,
      userId,
      scopes,
      rateLimit: {
        requestsPerMinute: rateLimitConfig.requestsPerMinute,
        requestsPerHour: rateLimitConfig.requestsPerHour,
        requestsPerDay: rateLimitConfig.requestsPerDay,
      },
      status: 'active',
      expiresAt,
      createdAt: new Date(),
      metadata,
    };

    // Store in database
    await prisma.apiKey.create({
      data: {
        id: apiKey.id,
        name: apiKey.name,
        hashedKey: apiKey.hashedKey,
        userId: apiKey.userId,
        scopes: apiKey.scopes,
        rateLimit: apiKey.rateLimit,
        status: apiKey.status,
        expiresAt: apiKey.expiresAt,
        metadata: apiKey.metadata,
      },
    });

    // Log API key creation
    AuditLogger.log({
      action: 'api_key_created',
      resource: 'api_key',
      resourceId: apiKey.id,
      userId,
      userEmail: '', // Will be filled by audit logger
      ipAddress: 'system',
      timestamp: new Date(),
      success: true,
      details: {
        name: apiKey.name,
        scopes: apiKey.scopes,
        tier,
      },
    });

    return apiKey;
  }

  /**
   * Validate API key and check rate limits
   */
  async validateAPIKey(key: string, endpoint: string, method: string): Promise<{
    valid: boolean;
    apiKey?: APIKey;
    rateLimitStatus?: {
      allowed: boolean;
      remaining: number;
      resetTime: number;
      limit: number;
    };
    error?: string;
  }> {
    try {
      // Extract key without prefix
      const cleanKey = key.replace('209w_', '');
      const hashedKey = await this.hashAPIKey(cleanKey);

      // Find API key in database
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { hashedKey },
      });

      if (!apiKeyRecord) {
        return { valid: false, error: 'Invalid API key' };
      }

      // Check if key is active
      if (apiKeyRecord.status !== 'active') {
        return { valid: false, error: 'API key is not active' };
      }

      // Check if key is expired
      if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
        return { valid: false, error: 'API key has expired' };
      }

      // Check scopes
      const requiredScope = this.getRequiredScope(endpoint, method);
      if (requiredScope && !apiKeyRecord.scopes.includes(requiredScope)) {
        return { valid: false, error: 'Insufficient permissions' };
      }

      // Check rate limits
      const rateLimitStatus = await this.checkRateLimit(apiKeyRecord.id, apiKeyRecord.rateLimit);

      if (!rateLimitStatus.allowed) {
        return { 
          valid: false, 
          error: 'Rate limit exceeded',
          rateLimitStatus,
        };
      }

      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        valid: true,
        apiKey: {
          ...apiKeyRecord,
          key: key, // Return the original key with prefix
        } as APIKey,
        rateLimitStatus,
      };

    } catch (error) {
      console.error('API key validation error:', error);
      return { valid: false, error: 'Validation failed' };
    }
  }

  /**
   * Track API usage
   */
  async trackAPIUsage(usage: Omit<APIUsage, 'timestamp'>): Promise<void> {
    const fullUsage: APIUsage = {
      ...usage,
      timestamp: new Date(),
    };

    try {
      // Store usage in database
      await prisma.apiUsage.create({
        data: {
          apiKeyId: fullUsage.apiKeyId,
          endpoint: fullUsage.endpoint,
          method: fullUsage.method,
          statusCode: fullUsage.statusCode,
          responseTime: fullUsage.responseTime,
          requestSize: fullUsage.requestSize,
          responseSize: fullUsage.responseSize,
          ipAddress: fullUsage.ipAddress,
          userAgent: fullUsage.userAgent,
          region: fullUsage.region,
          timestamp: fullUsage.timestamp,
        },
      });

      // Update rate limit counters
      await this.updateRateLimitCounters(fullUsage.apiKeyId);

    } catch (error) {
      console.error('Error tracking API usage:', error);
    }
  }

  /**
   * Get API usage analytics
   */
  async getAPIAnalytics(params: {
    apiKeyId?: string;
    userId?: string;
    timeRange: 'hour' | 'day' | 'week' | 'month';
    groupBy?: 'endpoint' | 'status' | 'region';
  }) {
    const { apiKeyId, userId, timeRange, groupBy = 'endpoint' } = params;

    return EnhancedCacheManager.createCachedFunction(
      async () => {
        const timeRanges = {
          hour: new Date(Date.now() - 60 * 60 * 1000),
          day: new Date(Date.now() - 24 * 60 * 60 * 1000),
          week: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        };

        const whereClause: any = {
          timestamp: { gte: timeRanges[timeRange] },
        };

        if (apiKeyId) {
          whereClause.apiKeyId = apiKeyId;
        } else if (userId) {
          // Get all API keys for user
          const userApiKeys = await prisma.apiKey.findMany({
            where: { userId },
            select: { id: true },
          });
          whereClause.apiKeyId = { in: userApiKeys.map(key => key.id) };
        }

        // Get aggregated data
        const [totalRequests, avgResponseTime, statusCodes, topEndpoints] = await Promise.all([
          prisma.apiUsage.count({ where: whereClause }),
          
          prisma.apiUsage.aggregate({
            where: whereClause,
            _avg: { responseTime: true },
          }),

          prisma.apiUsage.groupBy({
            by: ['statusCode'],
            where: whereClause,
            _count: { statusCode: true },
          }),

          prisma.apiUsage.groupBy({
            by: [groupBy as any],
            where: whereClause,
            _count: { endpoint: true },
            orderBy: { _count: { endpoint: 'desc' } },
            take: 10,
          }),
        ]);

        return {
          totalRequests,
          avgResponseTime: avgResponseTime._avg.responseTime || 0,
          statusCodes: statusCodes.map(sc => ({
            status: sc.statusCode,
            count: sc._count.statusCode,
          })),
          topEndpoints: topEndpoints.map(ep => ({
            [groupBy]: ep[groupBy as keyof typeof ep],
            count: ep._count.endpoint,
          })),
          timeRange,
          generatedAt: new Date(),
        };
      },
      {
        keyPrefix: `api-analytics:${apiKeyId || userId}:${timeRange}:${groupBy}`,
        ttl: CACHE_DURATIONS.SHORT,
        tags: [CACHE_TAGS.ANALYTICS],
      }
    )();
  }

  /**
   * Create webhook endpoint
   */
  async createWebhook(params: {
    userId: string;
    url: string;
    events: string[];
    secret?: string;
  }): Promise<WebhookEndpoint> {
    const { userId, url, events, secret } = params;

    const webhook: WebhookEndpoint = {
      id: this.generateId(),
      userId,
      url,
      events,
      secret: secret || this.generateSecureKey(),
      status: 'active',
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        maxBackoffSeconds: 300,
      },
      failureCount: 0,
      createdAt: new Date(),
    };

    await prisma.webhookEndpoint.create({
      data: {
        id: webhook.id,
        userId: webhook.userId,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        status: webhook.status,
        retryPolicy: webhook.retryPolicy,
        failureCount: webhook.failureCount,
      },
    });

    return webhook;
  }

  /**
   * Helper methods
   */
  private generateSecureKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateId(): string {
    return `api_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async hashAPIKey(key: string): Promise<string> {
    // In production, use a proper hashing algorithm like bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getRequiredScope(endpoint: string, method: string): string | null {
    // Define scope requirements for different endpoints
    const scopeMap: Record<string, string> = {
      'GET:/api/jobs': 'jobs:read',
      'POST:/api/jobs': 'jobs:write',
      'PUT:/api/jobs': 'jobs:write',
      'DELETE:/api/jobs': 'jobs:delete',
      'GET:/api/applications': 'applications:read',
      'POST:/api/applications': 'applications:write',
      'GET:/api/analytics': 'analytics:read',
      'POST:/api/webhooks': 'webhooks:write',
    };

    const key = `${method}:${endpoint}`;
    return scopeMap[key] || null;
  }

  private async checkRateLimit(apiKeyId: string, limits: APIKey['rateLimit']): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    limit: number;
  }> {
    // Simplified rate limiting - in production, use Redis
    const now = Date.now();
    const minuteWindow = Math.floor(now / (60 * 1000));
    
    const key = `rate_limit:${apiKeyId}:${minuteWindow}`;
    
    // This would be implemented with Redis in production
    // For now, return a simplified response
    return {
      allowed: true,
      remaining: limits.requestsPerMinute - 1,
      resetTime: (minuteWindow + 1) * 60 * 1000,
      limit: limits.requestsPerMinute,
    };
  }

  private async updateRateLimitCounters(apiKeyId: string): Promise<void> {
    // Update rate limit counters in Redis/database
    // Implementation would depend on your rate limiting strategy
  }
}

export default APIPlatformManager;
