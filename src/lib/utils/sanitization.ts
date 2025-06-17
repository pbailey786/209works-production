/**
 * Input sanitization utilities to prevent XSS and ensure data integrity
 */

// Basic HTML entity encoding to prevent XSS
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Sanitize text input by removing potentially dangerous characters
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';

  // Remove null bytes and control characters except newlines and tabs
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

// Sanitize URL input
export function sanitizeUrl(input: string): string {
  if (typeof input !== 'string') return '';

  const sanitized = sanitizeText(input);

  // Basic URL validation - must start with http:// or https://
  if (sanitized && !sanitized.match(/^https?:\/\//)) {
    return '';
  }

  return sanitized;
}

// Sanitize email input
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') return '';

  return sanitizeText(input).toLowerCase();
}

// Sanitize numeric input
export function sanitizeNumber(input: string | number): number | undefined {
  if (typeof input === 'number') {
    return isNaN(input) ? undefined : input;
  }

  if (typeof input !== 'string') return undefined;

  const sanitized = sanitizeText(input);
  const parsed = parseInt(sanitized, 10);

  return isNaN(parsed) ? undefined : parsed;
}

// Sanitize array of strings
export function sanitizeStringArray(input: string[]): string[] {
  if (!Array.isArray(input)) return [];

  return input.map(item => sanitizeText(item)).filter(item => item.length > 0);
}

// Comprehensive form data sanitization
export function sanitizeFormData(
  data: Record<string, any>
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
      continue;
    }

    switch (typeof value) {
      case 'string':
        // Special handling for specific field types
        if (key.toLowerCase().includes('email')) {
          sanitized[key] = sanitizeEmail(value);
        } else if (key.toLowerCase().includes('url')) {
          sanitized[key] = sanitizeUrl(value);
        } else {
          sanitized[key] = sanitizeText(value);
        }
        break;

      case 'number':
        sanitized[key] = sanitizeNumber(value);
        break;

      case 'boolean':
        sanitized[key] = Boolean(value);
        break;

      default:
        if (Array.isArray(value)) {
          sanitized[key] = sanitizeStringArray(value);
        } else {
          // For objects, recursively sanitize
          sanitized[key] = sanitizeFormData(value);
        }
        break;
    }
  }

  return sanitized;
}

// Length validation with sanitization
export function sanitizeWithLength(
  input: string,
  maxLength: number,
  minLength: number = 0
): string {
  const sanitized = sanitizeText(input);

  if (sanitized.length < minLength || sanitized.length > maxLength) {
    throw new Error(
      `Input must be between ${minLength} and ${maxLength} characters`
    );
  }

  return sanitized;
}

// SQL injection prevention for search queries
export function sanitizeSearchQuery(input: string): string {
  if (typeof input !== 'string') return '';

  // Remove potentially dangerous SQL characters
  return sanitizeText(input)
    .replace(/[';\\]/g, '') // Remove semicolons and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments start
    .replace(/\*\//g, '') // Remove SQL block comments end
    .substring(0, 500); // Limit length
}
