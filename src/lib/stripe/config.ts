/**
 * Stripe Configuration
 * Centralized Stripe settings and price configurations
 */

export interface StripePriceConfig {
  id: string;
  name: string;
  description: string;
  amount: number; // in cents
  currency: string;
  credits: number;
  features: string[];
  popular?: boolean;
}

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  prices: {
    [key: string]: StripePriceConfig;
  };
}

// Stripe price IDs for different environments
export const STRIPE_PRICE_IDS = {
  development: {
    starter: 'price_dev_starter_2_credits',
    standard: 'price_dev_standard_5_credits',
    premium: 'price_dev_premium_10_credits',
    // Add-ons
    social_shoutout: 'price_dev_social_shoutout',
    placement_bump: 'price_dev_placement_bump',
    promotion_bundle: 'price_dev_promotion_bundle'
  },
  production: {
    starter: process.env.STRIPE_PRICE_STARTER || 'price_1234567890',
    standard: process.env.STRIPE_PRICE_STANDARD || 'price_1234567891',
    premium: process.env.STRIPE_PRICE_PREMIUM || 'price_1234567892',
    // Add-ons
    social_shoutout: process.env.STRIPE_PRICE_SOCIAL_SHOUTOUT || 'price_1234567893',
    placement_bump: process.env.STRIPE_PRICE_PLACEMENT_BUMP || 'price_1234567894',
    promotion_bundle: process.env.STRIPE_PRICE_PROMOTION_BUNDLE || 'price_1234567895'
  }
};

// Credit packages configuration
export const CREDIT_PACKAGES: Record<string, StripePriceConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter Package',
    description: 'Perfect for small businesses getting started',
    amount: 5000, // $50.00
    currency: 'usd',
    credits: 2,
    features: [
      '2 Job Posting Credits',
      '30-day listing duration',
      'Basic analytics',
      'Email support'
    ]
  },
  standard: {
    id: 'standard',
    name: 'Standard Package',
    description: 'Most popular choice for growing companies',
    amount: 9900, // $99.00
    currency: 'usd',
    credits: 5,
    features: [
      '5 Job Posting Credits',
      '30-day listing duration',
      'Advanced analytics',
      'Priority support',
      'Featured listing options'
    ],
    popular: true
  },
  premium: {
    id: 'premium',
    name: 'Premium Package',
    description: 'Best value for high-volume hiring',
    amount: 20000, // $200.00
    currency: 'usd',
    credits: 10,
    features: [
      '10 Job Posting Credits',
      '30-day listing duration',
      'Premium analytics',
      'Priority support',
      'Featured listings included',
      'Bulk upload tools',
      'Custom branding'
    ]
  }
};

// Add-on services configuration
export const ADDON_SERVICES: Record<string, StripePriceConfig> = {
  social_shoutout: {
    id: 'social_shoutout',
    name: 'Social Media Shoutout',
    description: 'Promote your job on our social media channels',
    amount: 4900, // $49.00
    currency: 'usd',
    credits: 0, // Add-ons don\'t provide credits
    features: [
      'LinkedIn promotion',
      'Twitter/X promotion',
      'Facebook promotion',
      'Increased visibility'
    ]
  },
  placement_bump: {
    id: 'placement_bump',
    name: 'On-Site Placement Bump',
    description: 'Boost your job to the top of search results',
    amount: 4900, // $49.00
    currency: 'usd',
    credits: 0,
    features: [
      'Top placement for 7 days',
      'Increased applications',
      'Priority in search results',
      'Enhanced visibility'
    ]
  },
  promotion_bundle: {
    id: 'promotion_bundle',
    name: 'Complete Promotion Bundle',
    description: 'Social media + placement bump combined',
    amount: 8500, // $85.00 (save $13.00)
    currency: 'usd',
    credits: 0,
    features: [
      'Social media promotion',
      'Top placement for 7 days',
      'Maximum visibility',
      'Best value promotion'
    ]
  }
};

/**
 * Get Stripe configuration based on environment
 */
export function getStripeConfig(): StripeConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    prices: isProduction ? STRIPE_PRICE_IDS.production : STRIPE_PRICE_IDS.development
  };
}

/**
 * Get Stripe price ID for a specific package
 */
export function getStripePriceId(packageId: string): string {
  const config = getStripeConfig();
  return config.prices[packageId] || '';
}

/**
 * Validate Stripe configuration
 */
export function validateStripeConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    errors.push('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  }
  
  if (!process.env.STRIPE_SECRET_KEY) {
    errors.push('Missing STRIPE_SECRET_KEY');
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    errors.push('Missing STRIPE_WEBHOOK_SECRET');
  }
  
  // Validate price IDs in production
  if (process.env.NODE_ENV === 'production') {
    const requiredPriceIds = [
      'STRIPE_PRICE_STARTER',
      'STRIPE_PRICE_STANDARD',
      'STRIPE_PRICE_PREMIUM'
    ];
    
    requiredPriceIds.forEach(priceId => {
      if (!process.env[priceId]) {
        errors.push(`Missing ${priceId} environment variable`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get all available packages
 */
export function getAllPackages(): StripePriceConfig[] {
  return Object.values(CREDIT_PACKAGES);
}

/**
 * Get all available add-ons
 */
export function getAllAddons(): StripePriceConfig[] {
  return Object.values(ADDON_SERVICES);
}

/**
 * Get package by ID
 */
export function getPackageById(packageId: string): StripePriceConfig | null {
  return CREDIT_PACKAGES[packageId] || null;
}

/**
 * Get add-on by ID
 */
export function getAddonById(addonId: string): StripePriceConfig | null {
  return ADDON_SERVICES[addonId] || null;
}

/**
 * Calculate total cost for multiple items
 */
export function calculateTotalCost(items: Array<{
  type: 'package' | 'addon';
  id: string;
  quantity?: number;
}>): {
  total: number;
  breakdown: Array<{
    name: string;
    amount: number;
    quantity: number;
    subtotal: number;
  }>;
} {
  const breakdown: Array<{
    name: string;
    amount: number;
    quantity: number;
    subtotal: number;
  }> = [];
  
  let total = 0;
  
  items.forEach(item => {
    const config = item.type === 'package' 
      ? getPackageById(item.id)
      : getAddonById(item.id);
    
    if (config) {
      const quantity = item.quantity || 1;
      const subtotal = config.amount * quantity;
      
      breakdown.push({
        name: config.name,
        amount: config.amount,
        quantity,
        subtotal
      });
      
      total += subtotal;
    }
  });
  
  return { total, breakdown };
}

/**
 * Format price for display
 */
export function formatPrice(amountInCents: number, currency: string = 'usd'): string {
  const amount = amountInCents / 100;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
}

/**
 * Get recommended package based on company size
 */
export function getRecommendedPackage(companySize: 'small' | 'medium' | 'large'): string {
  switch (companySize) {
    case 'small':
      return 'starter';
    case 'medium':
      return 'standard';
    case 'large':
      return 'premium';
    default:
      return 'standard';
  }
}

// Export the main configuration
export const STRIPE_CONFIG = getStripeConfig();
