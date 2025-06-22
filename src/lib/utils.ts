import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Input validation utilities
class UtilsValidator {
  static isValidDate(date: any): boolean {
    if (!date) return false;
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime()) && isFinite(dateObj.getTime());
  }

  static isValidNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  static isValidString(value: any): value is string {
    return typeof value === 'string' && value.length > 0;
  }

  static sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';

    // Remove potentially dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = url.toLowerCase().trim();

    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        console.warn('Dangerous protocol detected in URL:', url);
        return '';
      }
    }

    return url.trim();
  }
}

// Safe date formatting with comprehensive validation
export function formatDate(date: Date | string | number): string {
  // Input validation
  if (date === null || date === undefined) {
    console.warn('formatDate received null/undefined input');
    return 'Invalid Date';
  }

  try {
    // Handle different input types safely
    let dateObj: Date;

    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // Validate string format before parsing
      if (date.trim() === '') {
        console.warn('formatDate received empty string');
        return 'Invalid Date';
      }
      dateObj = new Date(date);
    } else if (typeof date === 'number') {
      // Validate number is reasonable (not negative, not too large)
      if (
        !UtilsValidator.isValidNumber(date) ||
        date < 0 ||
        date > Date.now() + 365 * 24 * 60 * 60 * 1000
      ) {
        console.warn('formatDate received invalid number:', date);
        return 'Invalid Date';
      }
      dateObj = new Date(date);
    } else {
      console.warn('formatDate received unsupported type:', typeof date);
      return 'Invalid Date';
    }

    // Validate the resulting date object
    if (!UtilsValidator.isValidDate(dateObj)) {
      console.warn('formatDate created invalid Date object from input:', date);
      return 'Invalid Date';
    }

    // Additional validation for reasonable date ranges
    const year = dateObj.getFullYear();
    if (year < 1900 || year > 2100) {
      console.warn('formatDate: Date year out of reasonable range:', year);
      return 'Invalid Date';
    }

    // Safe formatting with error handling
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', date);
    return 'Invalid Date';
  }
}

// Safe URL construction with protocol validation
export function absoluteUrl(path: string): string {
  // Input validation
  if (!UtilsValidator.isValidString(path)) {
    console.warn('absoluteUrl received invalid path:', path);
    return '';
  }

  try {
    // Sanitize the path
    const sanitizedPath = UtilsValidator.sanitizeUrl(path);
    if (!sanitizedPath) {
      return '';
    }

    // Get base URL with validation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    // Validate base URL if provided
    if (baseUrl) {
      try {
        const url = new URL(baseUrl);
        // Ensure it's a safe protocol
        if (!['http:', 'https:'].includes(url.protocol)) {
          console.error(
            'Invalid protocol in NEXT_PUBLIC_APP_URL:',
            url.protocol
          );
          return sanitizedPath; // Return path only if base URL is invalid
        }
      } catch (urlError) {
        console.error('Invalid NEXT_PUBLIC_APP_URL format:', baseUrl);
        return sanitizedPath; // Return path only if base URL is malformed
      }
    }

    // Ensure path starts with /
    const normalizedPath = sanitizedPath.startsWith('/')
      ? sanitizedPath
      : `/${sanitizedPath}`;

    // Construct final URL
    const result = `${baseUrl}${normalizedPath}`;

    // Final validation of constructed URL
    if (baseUrl) {
      try {
        new URL(result); // This will throw if the final URL is invalid
      } catch (finalUrlError) {
        console.error('Constructed invalid URL:', result);
        return normalizedPath; // Return path only if final URL is invalid
      }
    }

    return result;
  } catch (error) {
    console.error('Error constructing absolute URL:', error, 'Path:', path);
    return path; // Return original path as fallback
  }
}

// Safe string truncation with null safety
export function truncate(str: string, length: number): string {
  // Input validation
  if (!UtilsValidator.isValidString(str)) {
    console.warn('truncate received invalid string:', str);
    return '';
  }

  if (!UtilsValidator.isValidNumber(length) || length < 0) {
    console.warn('truncate received invalid length:', length);
    return str; // Return original string if length is invalid
  }

  try {
    // Handle edge cases
    if (length === 0) return '';
    if (str.length <= length) return str;

    // Safe truncation with bounds checking
    const maxLength = Math.min(length, str.length);
    const truncated = str.substring(0, maxLength);

    return `${truncated}...`;
  } catch (error) {
    console.error(
      'Error truncating string:',
      error,
      'String:',
      str,
      'Length:',
      length
    );
    return str; // Return original string on error
  }
}

// Enhanced GitHub API with comprehensive error handling
export async function getGitHubStars(): Promise<number | null> {
  try {
    // Validate environment and configuration
    const repoUrl =
      'https://api.github.com/repos/pjborowiecki/SAASY-LAND-Next-14-Starters-With-Authentication-And-Database-Implemented';

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000); // 10 second timeout

    try {
      const response = await fetch(repoUrl, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'NextJS-App', // GitHub API requires User-Agent
        },
        next: {
          revalidate: 60,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Enhanced response validation
      if (!response.ok) {
        console.warn(
          `GitHub API returned ${response.status}: ${response.statusText}`
        );

        // Handle specific error cases
        if (response.status === 404) {
          console.error('GitHub repository not found');
        } else if (response.status === 403) {
          console.error('GitHub API rate limit exceeded');
        } else if (response.status >= 500) {
          console.error('GitHub API server error');
        }

        return null;
      }

      // Validate content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('GitHub API returned non-JSON response');
        return null;
      }

      // Safe JSON parsing with validation
      let data: any;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse GitHub API JSON response:', jsonError);
        return null;
      }

      // Validate response structure
      if (!data || typeof data !== 'object') {
        console.error('GitHub API returned invalid data structure');
        return null;
      }

      // Validate stargazers_count field
      const starCount = data.stargazers_count;
      if (!UtilsValidator.isValidNumber(starCount) || starCount < 0) {
        console.error(
          'GitHub API returned invalid stargazers_count:',
          starCount
        );
        return null;
      }

      return starCount;
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Handle specific fetch errors
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          console.error('GitHub API request timed out');
        } else if (fetchError.message.includes('network')) {
          console.error(
            'Network error accessing GitHub API:',
            fetchError.message
          );
        } else {
          console.error(
            'Fetch error accessing GitHub API:',
            fetchError.message
          );
        }
      } else {
        console.error('Unknown fetch error:', fetchError);
      }

      return null;
    }
  } catch (error) {
    // Handle any other unexpected errors
    console.error('Unexpected error in getGitHubStars:', error);
    return null;
  }
}

// Additional utility functions for safe date operations

// Safe date arithmetic with validation
export function addDays(
  date: Date | string | number,
  days: number
): Date | null {
  if (
    !UtilsValidator.isValidDate(date) ||
    !UtilsValidator.isValidNumber(days)
  ) {
    console.warn('addDays received invalid inputs:', { date, days });
    return null;
  }

  try {
    const baseDate = new Date(date);
    if (!UtilsValidator.isValidDate(baseDate)) {
      return null;
    }

    const result = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    if (!UtilsValidator.isValidDate(result)) {
      console.warn('addDays produced invalid result date');
      return null;
    }

    return result;
  } catch (error) {
    console.error('Error in addDays:', error);
    return null;
  }
}

// Safe time difference calculation
export function getTimeDifferenceInHours(
  date1: Date | string | number,
  date2: Date | string | number
): number | null {
  if (
    !UtilsValidator.isValidDate(date1) ||
    !UtilsValidator.isValidDate(date2)
  ) {
    console.warn('getTimeDifferenceInHours received invalid dates:', {
      date1,
      date2,
    });
    return null;
  }

  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (!UtilsValidator.isValidDate(d1) || !UtilsValidator.isValidDate(d2)) {
      return null;
    }

    const timeDiff = Math.abs(d2.getTime() - d1.getTime());
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (!UtilsValidator.isValidNumber(hoursDiff)) {
      console.warn('getTimeDifferenceInHours produced invalid result');
      return null;
    }

    return hoursDiff;
  } catch (error) {
    console.error('Error calculating time difference:', error);
    return null;
  }
}

// Safe relative date formatting
export function formatRelativeDate(date: Date | string | number): string {
  if (!UtilsValidator.isValidDate(date)) {
    console.warn('formatRelativeDate received invalid date:', date);
    return 'Invalid Date';
  }

  try {
    const inputDate = new Date(date);
    const now = new Date();

    if (
      !UtilsValidator.isValidDate(inputDate) ||
      !UtilsValidator.isValidDate(now)
    ) {
      return 'Invalid Date';
    }

    const timeDiff = now.getTime() - inputDate.getTime();

    if (!UtilsValidator.isValidNumber(timeDiff)) {
      return 'Invalid Date';
    }

    // Handle future dates
    if (timeDiff < 0) {
      return 'In the future';
    }

    const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));

    if (hoursDiff < 1) {
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));
      return minutesDiff <= 1 ? 'Just now' : `${minutesDiff} minutes ago`;
    }

    if (hoursDiff < 24) {
      return hoursDiff === 1 ? '1 hour ago' : `${hoursDiff} hours ago`;
    }

    const daysDiff = Math.floor(hoursDiff / 24);
    if (daysDiff === 1) {
      return '1 day ago';
    }

    if (daysDiff < 30) {
      return `${daysDiff} days ago`;
    }

    const monthsDiff = Math.floor(daysDiff / 30);
    if (monthsDiff === 1) {
      return '1 month ago';
    }

    if (monthsDiff < 12) {
      return `${monthsDiff} months ago`;
    }

    const yearsDiff = Math.floor(monthsDiff / 12);
    return yearsDiff === 1 ? '1 year ago' : `${yearsDiff} years ago`;
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'Invalid Date';
  }
}
