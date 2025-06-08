/**
 * Environment variable validation utilities
 * Helps ensure all required environment variables are properly configured
 */

export interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
}

export interface EnvConfig {
  openai: {
    hasKey: boolean;
    keyLength: number;
    isValidFormat: boolean;
  };
  database: {
    hasUrl: boolean;
    isValidFormat: boolean;
  };
  auth: {
    hasSecret: boolean;
    hasUrl: boolean;
  };
  email: {
    hasResendKey: boolean;
    hasEmailFrom: boolean;
  };
}

/**
 * Validate all critical environment variables
 */
export function validateEnvironmentVariables(): EnvValidationResult {
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];

  // Check OpenAI API Key
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    missing.push('OPENAI_API_KEY');
  } else if (openaiKey.length < 20 || (!openaiKey.startsWith('sk-') && !openaiKey.startsWith('sk-proj-'))) {
    invalid.push('OPENAI_API_KEY (invalid format)');
  }

  // Check Database URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    missing.push('DATABASE_URL');
  } else if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    invalid.push('DATABASE_URL (should start with postgresql:// or postgres://)');
  }

  // Check NextAuth configuration
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (!nextAuthSecret) {
    missing.push('NEXTAUTH_SECRET');
  } else if (nextAuthSecret.length < 32) {
    invalid.push('NEXTAUTH_SECRET (should be at least 32 characters)');
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (!nextAuthUrl) {
    missing.push('NEXTAUTH_URL');
  }

  // Check Email configuration
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    warnings.push('RESEND_API_KEY (email features will not work)');
  } else if (!resendKey.startsWith('re_')) {
    invalid.push('RESEND_API_KEY (should start with re_)');
  }

  const emailFrom = process.env.EMAIL_FROM;
  if (!emailFrom) {
    warnings.push('EMAIL_FROM (email features will not work)');
  }

  return {
    isValid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
  };
}

/**
 * Get detailed environment configuration
 */
export function getEnvironmentConfig(): EnvConfig {
  const openaiKey = process.env.OPENAI_API_KEY;
  const databaseUrl = process.env.DATABASE_URL;
  
  return {
    openai: {
      hasKey: !!openaiKey,
      keyLength: openaiKey?.length || 0,
      isValidFormat: openaiKey ? (openaiKey.startsWith('sk-') || openaiKey.startsWith('sk-proj-')) : false,
    },
    database: {
      hasUrl: !!databaseUrl,
      isValidFormat: databaseUrl ? (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) : false,
    },
    auth: {
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      hasUrl: !!process.env.NEXTAUTH_URL,
    },
    email: {
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasEmailFrom: !!process.env.EMAIL_FROM,
    },
  };
}

/**
 * Log environment validation results
 */
export function logEnvironmentStatus(): void {
  const validation = validateEnvironmentVariables();
  const config = getEnvironmentConfig();

  console.log('🔍 Environment Validation Results:');
  console.log('  Node Environment:', process.env.NODE_ENV);
  console.log('  Validation Status:', validation.isValid ? '✅ Valid' : '❌ Issues Found');

  if (validation.missing.length > 0) {
    console.log('  Missing Variables:', validation.missing);
  }

  if (validation.invalid.length > 0) {
    console.log('  Invalid Variables:', validation.invalid);
  }

  if (validation.warnings.length > 0) {
    console.log('  Warnings:', validation.warnings);
  }

  console.log('  Configuration Summary:');
  console.log('    OpenAI:', config.openai.hasKey ? '✅' : '❌', `(${config.openai.keyLength} chars)`);
  console.log('    Database:', config.database.hasUrl ? '✅' : '❌');
  console.log('    Auth:', config.auth.hasSecret && config.auth.hasUrl ? '✅' : '❌');
  console.log('    Email:', config.email.hasResendKey && config.email.hasEmailFrom ? '✅' : '⚠️');
}

/**
 * Check if resume parsing is available
 */
export function isResumeParsingAvailable(): boolean {
  const config = getEnvironmentConfig();
  return config.openai.hasKey && config.openai.isValidFormat;
}

/**
 * Check if email features are available
 */
export function isEmailAvailable(): boolean {
  const config = getEnvironmentConfig();
  return config.email.hasResendKey && config.email.hasEmailFrom;
}

/**
 * Check if authentication is properly configured
 */
export function isAuthConfigured(): boolean {
  const config = getEnvironmentConfig();
  return config.auth.hasSecret && config.auth.hasUrl && config.database.hasUrl;
}
