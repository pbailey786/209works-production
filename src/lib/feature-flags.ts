/**
 * Feature Flag System for 209 Jobs
 * 
 * This system allows us to enable/disable features during development
 * and gradually roll out functionality without breaking the core app.
 */

export const FEATURES = {
  // ============================================================================
  // CORE FEATURES (Always Enabled - Essential for basic functionality)
  // ============================================================================
  BASIC_JOB_SEARCH: true,
  BASIC_JOB_POSTING: true,
  USER_AUTH: true,
  CONTACT_FORM: true,
  
  // ============================================================================
  // ADVANCED FEATURES (Controlled by Environment Variables)
  // ============================================================================
  
  // Admin & Management
  ADMIN_DASHBOARD: process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true',
  ADMIN_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true',
  ADMIN_MODERATION: process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true',
  ADMIN_REPORTS: process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true',
  
  // AI & Advanced Search
  AI_CHAT: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
  AI_JOB_MATCHING: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
  SEMANTIC_SEARCH: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
  
  // Analytics & Tracking
  ANALYTICS_DASHBOARD: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  JOB_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  USER_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  
  // Complex User Features
  COMPLEX_ONBOARDING: process.env.NEXT_PUBLIC_ENABLE_ONBOARDING === 'true',
  USER_PROFILES: process.env.NEXT_PUBLIC_ENABLE_PROFILES === 'true',
  USER_DASHBOARD: process.env.NEXT_PUBLIC_ENABLE_PROFILES === 'true',
  SAVED_JOBS: process.env.NEXT_PUBLIC_ENABLE_PROFILES === 'true',
  JOB_APPLICATIONS: process.env.NEXT_PUBLIC_ENABLE_PROFILES === 'true',
  
  // Employer Features
  EMPLOYER_DASHBOARD: process.env.NEXT_PUBLIC_ENABLE_EMPLOYER_DASH === 'true',
  EMPLOYER_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_EMPLOYER_DASH === 'true',
  BULK_JOB_UPLOAD: process.env.NEXT_PUBLIC_ENABLE_EMPLOYER_DASH === 'true',
  EMPLOYER_CRM: process.env.NEXT_PUBLIC_ENABLE_EMPLOYER_DASH === 'true',
  
  // Payment & Credits
  PAYMENT_SYSTEM: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true',
  CREDIT_SYSTEM: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true',
  SUBSCRIPTIONS: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true',
  
  // Social & Marketing
  SOCIAL_MEDIA: process.env.NEXT_PUBLIC_ENABLE_SOCIAL === 'true',
  EMAIL_CAMPAIGNS: process.env.NEXT_PUBLIC_ENABLE_SOCIAL === 'true',
  INSTAGRAM_INTEGRATION: process.env.NEXT_PUBLIC_ENABLE_SOCIAL === 'true',
  
  // Regional Features
  MULTI_REGION: process.env.NEXT_PUBLIC_ENABLE_REGIONS === 'true',
  REGIONAL_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_REGIONS === 'true',
  
  // Authentication System - Phase 4A
  CLERK_AUTH: process.env.NEXT_PUBLIC_ENABLE_CLERK_AUTH === 'true',
  
  // Profile Enhancement Features - Phase 5A+
  PROFILE_GAMIFICATION: process.env.NEXT_PUBLIC_ENABLE_PROFILE_GAMIFICATION === 'true',
  AI_SKILL_SUGGESTIONS: process.env.NEXT_PUBLIC_ENABLE_AI_SKILL_SUGGESTIONS === 'true',
  LOCAL_INSIGHTS: process.env.NEXT_PUBLIC_ENABLE_LOCAL_INSIGHTS === 'true',
  CAREER_STORYTELLING: process.env.NEXT_PUBLIC_ENABLE_CAREER_STORYTELLING === 'true',
  CAREER_PREDICTOR: process.env.NEXT_PUBLIC_ENABLE_CAREER_PREDICTOR === 'true',
  
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] === true;
}

/**
 * Get all enabled features (useful for debugging)
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => enabled)
    .map(([feature, _]) => feature);
}

/**
 * Get all disabled features (useful for debugging)
 */
export function getDisabledFeatures(): string[] {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => !enabled)
    .map(([feature, _]) => feature);
}

/**
 * Feature flag hook for React components
 */
export function useFeature(feature: keyof typeof FEATURES): boolean {
  return isFeatureEnabled(feature);
}

/**
 * Higher-order component to conditionally render based on feature flags
 * Note: This will be moved to a separate .tsx file for React components
 */

// Development helpers
if (process.env.NODE_ENV === 'development') {
  // Log feature status in development
  console.log('🚀 Feature Flags Status:');
  console.log('✅ Enabled:', getEnabledFeatures().join(', '));
  console.log('❌ Disabled:', getDisabledFeatures().join(', '));
}