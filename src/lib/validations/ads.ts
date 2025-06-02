import { z } from 'zod';

// Ad types and formats
export const adTypeSchema = z.enum([
  'banner',          // Banner ads
  'sidebar',         // Sidebar ads
  'featured_job',    // Featured job listings
  'sponsored_search', // Sponsored search results
  'native',          // Native content ads
  'video',           // Video ads
  'popup',           // Popup ads (limited use)
]);

// Ad status
export const adStatusSchema = z.enum([
  'draft',     // Being created/edited
  'pending',   // Awaiting approval
  'active',    // Currently running
  'paused',    // Temporarily paused
  'expired',   // Campaign ended
  'rejected',  // Rejected during review
  'cancelled', // Cancelled by advertiser
]);

// Targeting criteria for ads
export const adTargetingSchema = z.object({
  // Geographic targeting
  countries: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  radius: z.number().min(1).max(100).optional(), // miles from location
  
  // Demographic targeting
  ageMin: z.number().min(18).max(100).optional(),
  ageMax: z.number().min(18).max(100).optional(),
  
  // Professional targeting
  jobTitles: z.array(z.string()).optional(),
  companies: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  experienceLevels: z.array(z.enum(['entry', 'mid', 'senior', 'executive'])).optional(),
  skills: z.array(z.string()).optional(),
  
  // User behavior targeting
  searchKeywords: z.array(z.string()).optional(),
  visitedPages: z.array(z.string()).optional(),
  deviceTypes: z.array(z.enum(['desktop', 'mobile', 'tablet'])).optional(),
  
  // Time-based targeting
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday
  hoursOfDay: z.array(z.number().min(0).max(23)).optional(),
  timezones: z.array(z.string()).optional(),
});

// Ad content and creative
export const adContentSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  ctaText: z.string().min(1).max(50).optional(), // Call-to-action text
  ctaUrl: z.string().url(),
  altText: z.string().max(200).optional(), // Alt text for images
  
  // Rich content for job ads
  companyLogo: z.string().url().optional(),
  salaryRange: z.string().optional(),
  location: z.string().optional(),
  jobType: z.string().optional(),
});

// Bidding and budget
export const adBiddingSchema = z.object({
  type: z.enum(['cpc', 'cpm', 'flat_rate']), // Cost-per-click, cost-per-mille, flat rate
  bidAmount: z.number().min(0.01), // Minimum bid amount
  dailyBudget: z.number().min(1).optional(),
  totalBudget: z.number().min(1).optional(),
  maxCpc: z.number().min(0.01).optional(), // Maximum cost-per-click
});

// Campaign scheduling
export const adScheduleSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().default('UTC'),
  isAlwaysOn: z.boolean().default(false), // Run indefinitely
});

// Create ad schema
export const createAdSchema = z.object({
  name: z.string().min(1).max(100),
  type: adTypeSchema,
  content: adContentSchema,
  targeting: adTargetingSchema.optional(),
  bidding: adBiddingSchema,
  schedule: adScheduleSchema,
  priority: z.number().min(1).max(10).default(5), // Ad priority (1 = lowest, 10 = highest)
  notes: z.string().max(1000).optional(),
});

// Update ad schema
export const updateAdSchema = createAdSchema.partial().extend({
  id: z.string().uuid(),
  status: adStatusSchema.optional(),
});

// Ad query parameters
export const adQuerySchema = z.object({
  advertiserId: z.string().uuid().optional(),
  status: adStatusSchema.optional(),
  type: adTypeSchema.optional(),
  isActive: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'startDate', 'clicks', 'impressions', 'ctr']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// Ad impression tracking
export const adImpressionSchema = z.object({
  adId: z.string().uuid(),
  userId: z.string().uuid().optional(), // Anonymous if not logged in
  sessionId: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  referrer: z.string().url().optional(),
  page: z.string().optional(),
  position: z.string().optional(), // Ad position on page
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
});

// Ad click tracking
export const adClickSchema = z.object({
  adId: z.string().uuid(),
  impressionId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  referrer: z.string().url().optional(),
  targetUrl: z.string().url(),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
});

// Ad conversion tracking
export const adConversionSchema = z.object({
  adId: z.string().uuid(),
  clickId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  type: z.enum(['job_view', 'job_apply', 'signup', 'purchase', 'custom']),
  value: z.number().min(0).optional(), // Conversion value in dollars
  customEvent: z.string().optional(), // For custom conversion types
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
});

// Ad analytics request
export const adAnalyticsSchema = z.object({
  adIds: z.array(z.string().uuid()).optional(),
  advertiserId: z.string().uuid().optional(),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  groupBy: z.enum(['day', 'week', 'month', 'ad', 'type']).default('day'),
  metrics: z.array(z.enum([
    'impressions', 'clicks', 'ctr', 'cost', 'cpc', 'cpm', 
    'conversions', 'conversion_rate', 'revenue', 'roas'
  ])).default(['impressions', 'clicks', 'ctr', 'cost']),
});

// Ad performance report
export const adPerformanceSchema = z.object({
  adId: z.string().uuid(),
  period: z.enum(['24h', '7d', '30d', '90d', 'custom']).default('7d'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  compareWith: z.enum(['previous_period', 'previous_year']).optional(),
});

// Bulk ad operations
export const bulkAdOperationSchema = z.object({
  adIds: z.array(z.string().uuid()).min(1).max(50),
  operation: z.enum(['activate', 'pause', 'delete', 'duplicate']),
  newStatus: adStatusSchema.optional(),
});

// Ad approval/review
export const adReviewSchema = z.object({
  adId: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  reviewerNotes: z.string().max(1000).optional(),
  rejectionReason: z.enum([
    'inappropriate_content',
    'misleading_claims',
    'poor_quality',
    'policy_violation',
    'technical_issues',
    'other'
  ]).optional(),
});

// Export types
export type AdType = z.infer<typeof adTypeSchema>;
export type AdStatus = z.infer<typeof adStatusSchema>;
export type AdTargeting = z.infer<typeof adTargetingSchema>;
export type AdContent = z.infer<typeof adContentSchema>;
export type AdBidding = z.infer<typeof adBiddingSchema>;
export type AdSchedule = z.infer<typeof adScheduleSchema>;
export type CreateAd = z.infer<typeof createAdSchema>;
export type UpdateAd = z.infer<typeof updateAdSchema>;
export type AdQuery = z.infer<typeof adQuerySchema>;
export type AdImpression = z.infer<typeof adImpressionSchema>;
export type AdClick = z.infer<typeof adClickSchema>;
export type AdConversion = z.infer<typeof adConversionSchema>;
export type AdAnalytics = z.infer<typeof adAnalyticsSchema>;
export type AdPerformance = z.infer<typeof adPerformanceSchema>;
export type BulkAdOperation = z.infer<typeof bulkAdOperationSchema>;
export type AdReview = z.infer<typeof adReviewSchema>; 