import { z } from 'zod';

// Alert frequency options
export const alertFrequencySchema = z.enum([
  'immediate', // Send immediately when matching jobs are found
  'daily', // Daily digest
  'weekly', // Weekly digest
  'monthly', // Monthly digest
]);

// Job alert criteria schema
export const alertCriteriaSchema = z.object({
  // Text search criteria
  keywords: z.array(z.string()).optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),

  // Location criteria
  location: z.string().optional(),
  remote: z.boolean().optional(),
  radius: z.number().min(1).max(100).optional(), // miles

  // Job specifics
  jobType: z
    .enum(['full_time', 'part_time', 'contract', 'temporary', 'internship'])
    .optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),

  // Salary criteria
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),

  // Skills and requirements
  skills: z.array(z.string()).optional(),
  excludeKeywords: z.array(z.string()).optional(), // Keywords to exclude

  // Industry and company filters
  industry: z.string().optional(),
  companySize: z
    .enum(['startup', 'small', 'medium', 'large', 'enterprise'])
    .optional(),
});

// Create alert schema
export const createAlertSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  criteria: alertCriteriaSchema,
  frequency: alertFrequencySchema,
  isActive: z.boolean().default(true),
  maxResults: z.number().min(1).max(50).default(10), // Max jobs per alert
});

// Update alert schema
export const updateAlertSchema = createAlertSchema.partial().extend({
  id: z.string().uuid(),
});

// Alert query parameters
export const alertQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  frequency: alertFrequencySchema.optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'lastSent']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Alert execution schema (for testing alerts)
export const testAlertSchema = z.object({
  alertId: z.string().uuid(),
  dryRun: z.boolean().default(true), // Don't actually send, just return matches
});

// Alert statistics schema
export const alertStatsSchema = z.object({
  alertId: z.string().uuid(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// Bulk alert operations
export const bulkAlertOperationSchema = z.object({
  alertIds: z.array(z.string().uuid()).min(1).max(50),
  operation: z.enum(['activate', 'deactivate', 'delete']),
});

// Alert notification preferences
export const alertNotificationSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  push: z.boolean().default(false),
  webhook: z.string().url().optional(), // Custom webhook for notifications
});

// Export types
export type AlertFrequency = z.infer<typeof alertFrequencySchema>;
export type AlertCriteria = z.infer<typeof alertCriteriaSchema>;
export type CreateAlert = z.infer<typeof createAlertSchema>;
export type UpdateAlert = z.infer<typeof updateAlertSchema>;
export type AlertQuery = z.infer<typeof alertQuerySchema>;
export type TestAlert = z.infer<typeof testAlertSchema>;
export type AlertStats = z.infer<typeof alertStatsSchema>;
export type BulkAlertOperation = z.infer<typeof bulkAlertOperationSchema>;
export type AlertNotification = z.infer<typeof alertNotificationSchema>;
