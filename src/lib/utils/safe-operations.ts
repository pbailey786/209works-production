/**
 * Safe Date and String Operations Utilities
 * Provides type-safe, null-safe operations for dates and strings
 */

// Date validation and parsing
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

export function parseDate(
  input: string | number | Date | null | undefined
): Date | null {
  if (!input) return null;

  try {
    const date = new Date(input);
    return isValidDate(date) ? date : null;
  } catch {
    return null;
  }
}

export function safeDateFormat(
  input: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {},
  locale: string = 'en-US'
): string {
  const date = parseDate(input);
  if (!date) return '';

  try {
    return date.toLocaleDateString(locale, options);
  } catch {
    return '';
  }
}

export function safeTimeFormat(
  input: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' },
  locale: string = 'en-US'
): string {
  const date = parseDate(input);
  if (!date) return '';

  try {
    return date.toLocaleTimeString(locale, options);
  } catch {
    return '';
  }
}

export function safeDateTimeFormat(
  input: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  locale: string = 'en-US'
): string {
  const date = parseDate(input);
  if (!date) return '';

  try {
    return date.toLocaleDateString(locale, options);
  } catch {
    return '';
  }
}

export function safeISOString(
  input: string | number | Date | null | undefined
): string {
  const date = parseDate(input);
  if (!date) return '';

  try {
    return date.toISOString();
  } catch {
    return '';
  }
}

export function getRelativeTime(
  input: string | number | Date | null | undefined,
  baseDate: Date = new Date()
): string {
  const date = parseDate(input);
  if (!date || !isValidDate(baseDate)) return '';

  try {
    const diffMs = baseDate.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 30) {
      return safeDateFormat(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  } catch {
    return '';
  }
}

// String validation and manipulation
export function isValidString(input: any): input is string {
  return typeof input === 'string';
}

export function safeString(input: any, fallback: string = ''): string {
  if (isValidString(input)) return input;
  if (input === null || input === undefined) return fallback;

  try {
    return String(input);
  } catch {
    return fallback;
  }
}

export function safeTrim(input: any, fallback: string = ''): string {
  const str = safeString(input, fallback);
  try {
    return str.trim();
  } catch {
    return fallback;
  }
}

export function safeSubstring(
  input: any,
  start: number,
  end?: number,
  fallback: string = ''
): string {
  const str = safeString(input, fallback);
  if (!str) return fallback;

  try {
    return str.substring(Math.max(0, start), end);
  } catch {
    return fallback;
  }
}

export function safeSlice(
  input: any,
  start: number,
  end?: number,
  fallback: string = ''
): string {
  const str = safeString(input, fallback);
  if (!str) return fallback;

  try {
    return str.slice(start, end);
  } catch {
    return fallback;
  }
}

export function safeSplit(
  input: any,
  separator: string | RegExp,
  limit?: number,
  fallback: string[] = []
): string[] {
  const str = safeString(input);
  if (!str) return fallback;

  try {
    return str.split(separator, limit);
  } catch {
    return fallback;
  }
}

export function safeIndexOf(
  input: any,
  searchValue: string,
  fromIndex?: number,
  fallback: number = -1
): number {
  const str = safeString(input);
  if (!str) return fallback;

  try {
    return str.indexOf(searchValue, fromIndex);
  } catch {
    return fallback;
  }
}

export function safeCharAt(
  input: any,
  index: number,
  fallback: string = ''
): string {
  const str = safeString(input);
  if (!str || index < 0 || index >= str.length) return fallback;

  try {
    return str.charAt(index);
  } catch {
    return fallback;
  }
}

export function safeToUpperCase(input: any, fallback: string = ''): string {
  const str = safeString(input, fallback);
  try {
    return str.toUpperCase();
  } catch {
    return fallback;
  }
}

export function safeToLowerCase(input: any, fallback: string = ''): string {
  const str = safeString(input, fallback);
  try {
    return str.toLowerCase();
  } catch {
    return fallback;
  }
}

export function capitalizeFirst(input: any, fallback: string = ''): string {
  const str = safeTrim(input, fallback);
  if (!str) return fallback;

  try {
    return safeToUpperCase(safeCharAt(str, 0)) + safeSlice(str, 1);
  } catch {
    return fallback;
  }
}

export function capitalizeWords(input: any, fallback: string = ''): string {
  const str = safeTrim(input, fallback);
  if (!str) return fallback;

  try {
    return safeSplit(str, ' ')
      .map(word => capitalizeFirst(word))
      .path.join(' ');
  } catch {
    return fallback;
  }
}

// Array operations
export function safeArraySlice<T>(
  input: T[] | null | undefined,
  start: number,
  end?: number,
  fallback: T[] = []
): T[] {
  if (!Array.isArray(input)) return fallback;

  try {
    return input.slice(start, end);
  } catch {
    return fallback;
  }
}

export function safeArrayJoin<T>(
  input: T[] | null | undefined,
  separator: string = ',',
  fallback: string = ''
): string {
  if (!Array.isArray(input)) return fallback;

  try {
    return input.path.join(separator);
  } catch {
    return fallback;
  }
}

// Number operations
export function safeNumber(input: any, fallback: number = 0): number {
  if (typeof input === 'number' && !isNaN(input)) return input;

  try {
    const parsed = Number(input);
    return isNaN(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function safeToString(input: any, fallback: string = ''): string {
  if (input === null || input === undefined) return fallback;

  try {
    return input.toString();
  } catch {
    return fallback;
  }
}

// URL and encoding operations
export function safeEncodeURIComponent(
  input: any,
  fallback: string = ''
): string {
  const str = safeString(input, fallback);
  if (!str) return fallback;

  try {
    return encodeURIComponent(str);
  } catch {
    return fallback;
  }
}

export function safeDecodeURIComponent(
  input: any,
  fallback: string = ''
): string {
  const str = safeString(input, fallback);
  if (!str) return fallback;

  try {
    return decodeURIComponent(str);
  } catch {
    return fallback;
  }
}

// Validation helpers
export function isNonEmptyString(input: any): input is string {
  return isValidString(input) && input.trim().length > 0;
}

export function isValidEmail(input: any): boolean {
  if (!isNonEmptyString(input)) return false;

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  } catch {
    return false;
  }
}

export function isValidURL(input: any): boolean {
  if (!isNonEmptyString(input)) return false;

  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}
