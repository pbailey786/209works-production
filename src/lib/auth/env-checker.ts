/**
 * Environment variable checker for NextAuth configuration
 */

interface EnvCheckResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: Record<string, any>;
}

export function checkAuthEnvironment(): EnvCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required environment variables
  const requiredVars = {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  // Optional but recommended variables
  const optionalVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  };

  // Check required variables
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
    } else {
      // Additional validation
      if (key === 'NEXTAUTH_SECRET' && value.length < 32) {
        errors.push('NEXTAUTH_SECRET should be at least 32 characters long');
      }
      
      if (key === 'NEXTAUTH_URL') {
        try {
          new URL(value);
        } catch {
          errors.push('NEXTAUTH_URL is not a valid URL');
        }
      }
    }
  });

  // Check optional variables
  Object.entries(optionalVars).forEach(([key, value]) => {
    if (!value) {
      warnings.push(`Optional environment variable not set: ${key}`);
    }
  });

  // Additional checks
  if (process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.includes('localhost')) {
    errors.push('NEXTAUTH_URL should not contain localhost in production');
  }

  const config = {
    nodeEnv: process.env.NODE_ENV,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    secretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    hasDatabase: !!process.env.DATABASE_URL,
    hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config,
  };
}

export function logEnvironmentStatus(): void {
  const result = checkAuthEnvironment();
  
  console.log('🔍 NextAuth Environment Check:');
  console.log('  - Valid:', result.isValid);
  console.log('  - Config:', result.config);
  
  if (result.errors.length > 0) {
    console.error('❌ Environment Errors:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️ Environment Warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}

export function generateSecureSecret(): string {
  // Generate a secure random secret for NEXTAUTH_SECRET
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}