import { z } from 'zod';

// Re-export z for compatibility
export { z };


export const VALIDATION_LIMITS = {
  // String limits
  MAX_STRING_LENGTH: 10000,
  MAX_SHORT_STRING_LENGTH: 255,
  MAX_MEDIUM_STRING_LENGTH: 1000,
  MAX_LONG_STRING_LENGTH: 5000,
  MIN_STRING_LENGTH: 1,

  // Text content limits
  MAX_MESSAGE_LENGTH: 4000,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_TITLE_LENGTH: 200,
  MAX_NAME_LENGTH: 100,

  // Array limits
  MAX_ARRAY_LENGTH: 100,
  MAX_TAGS_COUNT: 20,
  MAX_CATEGORIES_COUNT: 10,

  // Numeric limits
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
  MAX_PAGE_NUMBER: 10000,

  // ID limits
  MAX_ID_LENGTH: 100,
  MIN_ID_LENGTH: 1,
} as const;

// Input sanitization functions
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  // Remove null bytes and control characters except newlines and tabs
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

export function sanitizeHtml(input: string): string {
  const sanitized = sanitizeString(input);

  // Basic HTML entity encoding for dangerous characters
  return sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeSearchQuery(input: string): string {
  const sanitized = sanitizeString(input);

  // Remove potentially dangerous regex characters for search
  return sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Enhanced validation schemas
export const enhancedStringSchema = (
  minLength: number = VALIDATION_LIMITS.MIN_STRING_LENGTH,
  maxLength: number = VALIDATION_LIMITS.MAX_STRING_LENGTH
) =>
  z
    .string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be no more than ${maxLength} characters`)
    .transform(sanitizeString);

export const enhancedIdSchema = z
  .string()
  .min(VALIDATION_LIMITS.MIN_ID_LENGTH)
  .max(VALIDATION_LIMITS.MAX_ID_LENGTH)
  .regex(/^[a-zA-Z0-9_-]+$/, 'ID contains invalid characters')
  .transform(sanitizeString);

export const enhancedEmailSchema = z
  .string()
  .email('Invalid email format')
  .max(VALIDATION_LIMITS.MAX_SHORT_STRING_LENGTH)
  .transform(email => sanitizeString(email).toLowerCase());

export const enhancedUrlSchema = z
  .string()
  .url('Invalid URL format')
  .max(VALIDATION_LIMITS.MAX_MEDIUM_STRING_LENGTH)
  .transform(sanitizeString);

export const enhancedSearchQuerySchema = z
  .string()
  .max(VALIDATION_LIMITS.MAX_MEDIUM_STRING_LENGTH)
  .transform(sanitizeSearchQuery);

export const enhancedTextContentSchema = z
  .string()
  .max(VALIDATION_LIMITS.MAX_MESSAGE_LENGTH)
  .transform(sanitizeHtml);

export const enhancedArraySchema = <T>(
  itemSchema: z.ZodSchema<T>,
  maxLength: number = VALIDATION_LIMITS.MAX_ARRAY_LENGTH
) =>
  z
    .array(itemSchema)
    .max(maxLength, `Array cannot have more than ${maxLength} items`);

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(
      VALIDATION_LIMITS.MAX_PAGE_NUMBER,
      `Page cannot exceed ${VALIDATION_LIMITS.MAX_PAGE_NUMBER}`
    )
    .default(1),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(
      VALIDATION_LIMITS.MIN_PAGE_SIZE,
      `Limit must be at least ${VALIDATION_LIMITS.MIN_PAGE_SIZE}`
    )
    .max(
      VALIDATION_LIMITS.MAX_PAGE_SIZE,
      `Limit cannot exceed ${VALIDATION_LIMITS.MAX_PAGE_SIZE}`
    )
    .default(20),
  cursor: z.string().optional(),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

// Message validation for chat/AI APIs
export const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system'], {
    errorMap: () => ({ message: 'Role must be user, assistant, or system' }),
  }),
  content: enhancedStringSchema(
    VALIDATION_LIMITS.MIN_STRING_LENGTH,
    VALIDATION_LIMITS.MAX_MESSAGE_LENGTH
  ),
  timestamp: z.date().optional(),
});

export const conversationSchema = z.object({
  messages: enhancedArraySchema(messageSchema, 50).min(
    1,
    'At least one message is required'
  ),
  context: z.record(z.any()).optional(),
});

// File validation
export const fileValidationSchema = z.object({
  filename: enhancedStringSchema(
    1,
    VALIDATION_LIMITS.MAX_SHORT_STRING_LENGTH
  ).refine(
    val => /^[a-zA-Z0-9._-]+$/.test(val),
    'Filename contains invalid characters'
  ),
  size: z
    .number()
    .int('File size must be an integer')
    .min(1, 'File cannot be empty')
    .max(10 * 1024 * 1024, 'File cannot exceed 10MB'), // 10MB limit
  type: z
    .string()
    .regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9.-]+$/, 'Invalid MIME type format'),
});

// Search filters validation
export const searchFiltersSchema = z
  .object({
    query: enhancedSearchQuerySchema.optional(),
    category: enhancedStringSchema(
      1,
      VALIDATION_LIMITS.MAX_SHORT_STRING_LENGTH
    ).optional(),
    location: enhancedStringSchema(
      1,
      VALIDATION_LIMITS.MAX_SHORT_STRING_LENGTH
    ).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    sortBy: z
      .enum(['relevance', 'date', 'title', 'company'])
      .default('relevance'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine(
    data => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo,
    {
      message: 'dateFrom must be before or equal to dateTo',
      path: ['dateFrom'],
    }
  );

// Rate limiting validation
export const rateLimitConfigSchema = z.object({
  maxRequests: z
    .number()
    .int('Max requests must be an integer')
    .min(1, 'Max requests must be at least 1')
    .max(10000, 'Max requests cannot exceed 10000'),
  windowMs: z
    .number()
    .int('Window must be an integer')
    .min(1000, 'Window must be at least 1 second')
    .max(3600000, 'Window cannot exceed 1 hour'),
  identifier: enhancedStringSchema(
    1,
    VALIDATION_LIMITS.MAX_SHORT_STRING_LENGTH
  ).optional(),
});

// Content validation helpers
export function validateContentLength(
  content: string,
  maxLength: number,
  fieldName: string = 'Content'
): void {
  if (content.length > maxLength) {
    throw new Error(
      `${fieldName} exceeds maximum length of ${maxLength} characters`
    );
  }
}

export function validateArrayLength<T>(
  array: T[],
  maxLength: number,
  fieldName: string = 'Array'
): void {
  if (array.length > maxLength) {
    throw new Error(
      `${fieldName} exceeds maximum length of ${maxLength} items`
    );
  }
}

export function validateTotalContentLength(
  contents: string[],
  maxTotalLength: number,
  fieldName: string = 'Total content'
): void {
  const totalLength = contents.reduce(
    (sum, content) => sum + content.length,
    0
  );
  if (totalLength > maxTotalLength) {
    throw new Error(
      `${fieldName} exceeds maximum total length of ${maxTotalLength} characters`
    );
  }
}

// Security validation helpers
export function validateNoScriptTags(content: string): void {
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
    throw new Error('Script tags are not allowed');
  }
}

export function validateNoSqlInjection(content: string): void {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(--|\/\*|\*\/|;)/g,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(content)) {
      throw new Error('Content contains potentially dangerous SQL patterns');
    }
  }
}

export function validateNoPathTraversal(path: string): void {
  if (path.includes('..') || path.includes('~') || /[<>:"|?*]/.test(path)) {
    throw new Error('Path contains invalid characters or traversal patterns');
  }
}

// Comprehensive input validator
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options?: {
    sanitize?: boolean;
    checkSql?: boolean;
    checkScript?: boolean;
    checkPath?: boolean;
  }
): T {
  const {
    sanitize = true,
    checkSql = true,
    checkScript = true,
    checkPath = false,
  } = options || {};

  // Parse with Zod schema
  const parsed = schema.parse(data);

  // Additional security checks for string content
  if (typeof parsed === 'object' && parsed !== null) {
    const checkStringValue = (value: any, key?: string) => {
      if (typeof value === 'string') {
        if (checkScript) validateNoScriptTags(value);
        if (checkSql) validateNoSqlInjection(value);
        if (
          checkPath &&
          (key?.toLowerCase().includes('path') ||
            key?.toLowerCase().includes('file'))
        ) {
          validateNoPathTraversal(value);
        }
      } else if (Array.isArray(value)) {
        value.forEach((item, index) =>
          checkStringValue(item, `${key}[${index}]`)
        );
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([k, v]) => checkStringValue(v, k));
      }
    };

    Object.entries(parsed).forEach(([key, value]) =>
      checkStringValue(value, key)
    );
  }

  return parsed;
}

// Export commonly used schemas
export const commonSchemas = {
  id: enhancedIdSchema,
  email: enhancedEmailSchema,
  url: enhancedUrlSchema,
  searchQuery: enhancedSearchQuerySchema,
  textContent: enhancedTextContentSchema,
  pagination: paginationSchema,
  message: messageSchema,
  conversation: conversationSchema,
  file: fileValidationSchema,
  searchFilters: searchFiltersSchema,
  rateLimitConfig: rateLimitConfigSchema,
} as const;
