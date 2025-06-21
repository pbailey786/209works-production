import { z } from 'zod';
import path from "path";


export const PAGINATION_CONFIG = {
  defaultLimit: 20,
  maxLimit: 100,
  minLimit: 1,
} as const;

// Cursor-based pagination parameters
export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .min(PAGINATION_CONFIG.minLimit)
    .max(PAGINATION_CONFIG.maxLimit)
    .default(PAGINATION_CONFIG.defaultLimit),
  direction: z.enum(['forward', 'backward']).default('forward'),
});

// Offset-based pagination parameters
export const offsetPaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce
    .number()
    .min(PAGINATION_CONFIG.minLimit)
    .max(PAGINATION_CONFIG.maxLimit)
    .default(PAGINATION_CONFIG.defaultLimit),
});

// Sort parameters
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Combined pagination and sort schema
export const paginatedQuerySchema = z.intersection(
  z.union([cursorPaginationSchema, offsetPaginationSchema]),
  sortSchema
);

// Type definitions
export type CursorPaginationParams = z.infer<typeof cursorPaginationSchema>;
export type OffsetPaginationParams = z.infer<typeof offsetPaginationSchema>;
export type SortParams = z.infer<typeof sortSchema>;
export type PaginatedQueryParams = z.infer<typeof paginatedQuerySchema>;

// Pagination metadata interfaces
export interface CursorPaginationMeta {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextCursor?: string;
  prevCursor?: string;
  totalCount?: number;
}

export interface OffsetPaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

// Generic paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: CursorPaginationMeta | OffsetPaginationMeta;
  metadata: {
    queryTime: number;
    cached: boolean;
    sortBy?: string;
    sortOrder?: string;
  };
}

// Cursor encoding/decoding utilities
export function encodeCursor(data: any): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function decodeCursor<T = any>(cursor: string): T | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode cursor:', error);
    return null;
  }
}

// Generate cursor from database record
export function generateCursorFromRecord(
  record: any,
  sortField: string = 'createdAt'
): string {
  const cursorData = {
    [sortField]: record[sortField],
    id: record.id,
  };
  return encodeCursor(cursorData);
}

// Build Prisma cursor condition
export function buildCursorCondition(
  cursor: string,
  sortField: string = 'createdAt',
  direction: 'forward' | 'backward' = 'forward',
  sortOrder: 'asc' | 'desc' = 'desc'
): any {
  const cursorData = decodeCursor(cursor);
  if (!cursorData) return {};

  const operator =
    direction === 'forward'
      ? sortOrder === 'asc'
        ? 'gt'
        : 'lt'
      : sortOrder === 'asc'
        ? 'lt'
        : 'gt';

  return {
    OR: [
      {
        [sortField]: {
          [operator]: cursorData[sortField],
        },
      },
      {
        [sortField]: cursorData[sortField],
        id: {
          [operator]: cursorData.id,
        },
      },
    ],
  };
}

// Build Prisma sort condition
export function buildSortCondition(
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): any {
  return [
    {
      [sortBy]: sortOrder,
    },
    {
      id: sortOrder, // Secondary sort for consistency
    },
  ];
}

// Calculate offset pagination
export function calculateOffsetPagination(
  page: number,
  limit: number,
  totalCount: number
): { skip: number; take: number; meta: OffsetPaginationMeta } {
  const skip = (page - 1) * limit;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    skip,
    take: limit,
    meta: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit,
    },
  };
}

// Create paginated response
export function createPaginatedResponse<T>(
  data: T[],
  pagination: CursorPaginationMeta | OffsetPaginationMeta,
  metadata: {
    queryTime: number;
    cached: boolean;
    sortBy?: string;
    sortOrder?: string;
  }
): PaginatedResponse<T> {
  return {
    data,
    pagination,
    metadata,
  };
}

// Generate cache key for paginated queries
export function generatePaginationCacheKey(
  baseKey: string,
  params: {
    cursor?: string;
    page?: number;
    limit: number;
    sortBy?: string;
    sortOrder?: string;
    filters?: Record<string, any>;
  }
): string {
  const { cursor, page, limit, sortBy, sortOrder, filters } = params;

  const keyParts = [baseKey];

  if (cursor) {
    keyParts.push(`cursor:${cursor}`);
  } else if (page) {
    keyParts.push(`page:${page}`);
  }

  keyParts.push(`limit:${limit}`);

  if (sortBy) {
    keyParts.push(`sort:${sortBy}:${sortOrder}`);
  }

  if (filters && Object.keys(filters).length > 0) {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .path.join(',');
    keyParts.push(`filters:${filterString}`);
  }

  return keyParts.path.join(':');
}

// Validate pagination parameters
export function validatePaginationParams(params: any): {
  isValid: boolean;
  errors: string[];
  pagination: CursorPaginationParams | OffsetPaginationParams;
} {
  const errors: string[] = [];

  // Check if it's cursor or offset pagination
  const hasCursor = 'cursor' in params;
  const hasPage = 'page' in params;

  if (hasCursor && hasPage) {
    errors.push('Cannot use both cursor and page parameters');
  }

  try {
    let pagination: CursorPaginationParams | OffsetPaginationParams;

    if (hasCursor || (!hasCursor && !hasPage)) {
      // Default to cursor pagination
      pagination = cursorPaginationSchema.parse(params);
    } else {
      // Use offset pagination
      pagination = offsetPaginationSchema.parse(params);
    }

    return {
      isValid: errors.length === 0,
      errors,
      pagination,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => e.message));
    } else {
      errors.push('Invalid pagination parameters');
    }

    return {
      isValid: false,
      errors,
      pagination: cursorPaginationSchema.parse({}),
    };
  }
}

// Helper to determine pagination type
export function isPaginationType<T>(
  pagination: T,
  type: 'cursor' | 'offset'
): pagination is T {
  if (type === 'cursor') {
    return 'nextCursor' in (pagination as any);
  } else {
    return 'currentPage' in (pagination as any);
  }
}

// Search filters schema (commonly used with pagination)
export const searchFiltersSchema = z.object({
  q: z.string().optional(), // Search query
  location: z.string().optional(),
  jobType: z.string().optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  company: z.string().optional(),
  remote: z.enum(['true', 'false']).optional(),
  datePosted: z.enum(['24h', '7d', '30d']).optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

// Combined search and pagination schema
export const searchQuerySchema = z.intersection(
  paginatedQuerySchema,
  searchFiltersSchema
);

export type SearchQueryParams = z.infer<typeof searchQuerySchema>;
