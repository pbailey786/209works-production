import { z } from 'zod';
import { searchFiltersSchema, paginatedQuerySchema } from '../cache/pagination';

// Enhanced search filters schema
export const enhancedSearchFiltersSchema = searchFiltersSchema.extend({
  // Geolocation search
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(100).optional(), // miles

  // Advanced filters
  skills: z.array(z.string()).optional(),
  experience: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  education: z
    .enum(['high-school', 'associates', 'bachelors', 'masters', 'phd'])
    .optional(),
  workAuthorization: z
    .enum(['citizen', 'permanent-resident', 'visa-required'])
    .optional(),

  // Search behavior options
  includeSnippets: z.enum(['true', 'false']).default('false'),
  highlightMatches: z.enum(['true', 'false']).default('false'),
  useRelevanceScoring: z.enum(['true', 'false']).default('true'),
  includeFacets: z.enum(['true', 'false']).default('false'),
});

// Enhanced search query schema (combines pagination + enhanced filters)
export const enhancedSearchQuerySchema = z.intersection(
  paginatedQuerySchema,
  enhancedSearchFiltersSchema
);

// User search schema (for employers to find candidates)
export const userSearchFiltersSchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  education: z
    .enum(['high-school', 'associates', 'bachelors', 'masters', 'phd'])
    .optional(),
  remote: z.enum(['true', 'false']).optional(),
  workAuthorization: z
    .enum(['citizen', 'permanent-resident', 'visa-required'])
    .optional(),
});

export const userSearchQuerySchema = z.intersection(
  paginatedQuerySchema,
  userSearchFiltersSchema
);

// Autocomplete/suggestions schema
export const autocompleteQuerySchema = z.object({
  q: z.string().min(1).max(50),
  type: z.enum(['jobs', 'companies', 'locations', 'skills']).default('jobs'),
  limit: z.coerce.number().min(1).max(20).default(10),
});

// Search analytics schema
export const searchAnalyticsSchema = z.object({
  query: z.string(),
  type: z.enum(['job', 'user']),
  filters: z.record(z.any()).optional(),
  resultCount: z.number().optional(),
  clickPosition: z.number().optional(),
  clickedItemId: z.string().optional(),
});

// Geolocation search schema
export const geolocationSearchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(100).default(25),
  query: z.string().optional(),
});

export type EnhancedSearchQuery = z.infer<typeof enhancedSearchQuerySchema>;
export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>;
export type AutocompleteQuery = z.infer<typeof autocompleteQuerySchema>;
export type SearchAnalytics = z.infer<typeof searchAnalyticsSchema>;
export type GeolocationSearch = z.infer<typeof geolocationSearchSchema>;
