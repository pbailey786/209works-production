/**
 * Email utility functions for case-insensitive operations
 */

/**
 * Normalizes an email address to lowercase for consistent storage and comparison
 * @param email - The email address to normalize
 * @returns The normalized (lowercase) email address
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Checks if two email addresses are the same (case-insensitive)
 * @param email1 - First email address
 * @param email2 - Second email address
 * @returns True if emails are the same (ignoring case)
 */
export function emailsMatch(email1: string, email2: string): boolean {
  return normalizeEmail(email1) === normalizeEmail(email2);
}

/**
 * Validates and normalizes an email address
 * @param email - The email address to validate and normalize
 * @returns Object with validation result and normalized email
 */
export function validateAndNormalizeEmail(email: string): {
  isValid: boolean;
  normalizedEmail: string;
  errors: string[];
} {
  const errors: string[] = [];
  const normalizedEmail = normalizeEmail(email);

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    errors.push('Invalid email format');
  }

  // Length validation
  if (normalizedEmail.length < 5) {
    errors.push('Email too short');
  }
  if (normalizedEmail.length > 254) {
    errors.push('Email too long');
  }

  return {
    isValid: errors.length === 0,
    normalizedEmail,
    errors,
  };
}

/**
 * Database-safe email lookup that handles case-insensitive searches
 * @param email - The email to search for
 * @returns Normalized email for database queries
 */
export function getEmailForDatabaseQuery(email: string): string {
  return normalizeEmail(email);
}
