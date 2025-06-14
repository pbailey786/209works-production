import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Server-side Stripe instance (lazy-loaded to avoid build-time connection)
let stripeInstance: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
      typescript: true,
    });
  }
  return stripeInstance;
}

// Export for backward compatibility
export const stripe = {
  get checkout() {
    return getStripeInstance().checkout;
  },
  get customers() {
    return getStripeInstance().customers;
  },
  get subscriptions() {
    return getStripeInstance().subscriptions;
  },
  get invoices() {
    return getStripeInstance().invoices;
  },
  get paymentIntents() {
    return getStripeInstance().paymentIntents;
  },
  get webhooks() {
    return getStripeInstance().webhooks;
  },
  get billingPortal() {
    return getStripeInstance().billingPortal;
  },
  get prices() {
    return getStripeInstance().prices;
  },
  get products() {
    return getStripeInstance().products;
  }
};

// Client-side Stripe instance
let stripePromise: Promise<StripeClient | null>;

export const getStripe = (): Promise<StripeClient | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Stripe configuration for monthly recurring subscriptions
export const STRIPE_CONFIG = {
  currency: 'usd',
  payment_method_types: ['card'],
  mode: 'subscription' as const, // All packages are monthly recurring subscriptions
  billing_address_collection: 'required' as const,
  customer_creation: 'always' as const,
  automatic_tax: {
    enabled: true,
  },
  allow_promotion_codes: true,
  subscription_data: {
    trial_period_days: 0, // No trial period for simplicity
  },
};

// Type definitions for subscription tiers
export interface TierFeatures {
  credits: number; // Unified credit system
  duration: number;
  aiOptimization: boolean;
  analytics: string;
  support: string;
  // Legacy fields for backward compatibility
  jobPosts?: number;
  featuredPosts?: number;
}

export interface SubscriptionTier {
  name: string;
  monthlyPrice: number;
  stripePriceId: string | undefined;
  features: TierFeatures;
  description: string;
  popular?: boolean;
}

// Monthly Subscription Tiers Configuration (All recurring subscriptions)
export const SUBSCRIPTION_TIERS_CONFIG: Record<string, SubscriptionTier> = {
  starter: {
    name: 'Starter',
    monthlyPrice: 89,
    stripePriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    features: {
      credits: 3, // Updated to use unified credit system
      duration: 30, // days
      aiOptimization: false,
      analytics: 'basic',
      support: 'email',
    },
    description: 'Perfect for small businesses',
  },
  standard: {
    name: 'Standard',
    monthlyPrice: 199,
    stripePriceId: process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID,
    features: {
      credits: 5, // Updated to use unified credit system
      duration: 30,
      aiOptimization: true,
      analytics: 'advanced',
      support: 'priority',
    },
    description: 'For growing businesses',
    popular: true,
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 349,
    stripePriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    features: {
      credits: 12, // Updated to use unified credit system (10 + 2 featured = 12 total)
      duration: 60,
      aiOptimization: true,
      analytics: 'premium',
      support: 'phone',
    },
    description: 'For high-volume hiring',
  },
};

// Legacy job posting configuration (for backward compatibility)
export const JOB_POSTING_CONFIG = {
  addons: {
    featuredPost: {
      name: 'Featured Post',
      price: 0, // Price hidden from UI per unified credit system
      stripePriceId: process.env.STRIPE_PRICE_FEATURED || 'price_dynamic_featured',
      description: 'Highlight your job at the top of search results',
    },
    socialGraphic: {
      name: 'Social Post Graphic',
      price: 0, // Price hidden from UI per unified credit system
      stripePriceId: process.env.STRIPE_PRICE_GRAPHIC || 'price_dynamic_graphic',
      description: 'Custom social media graphic for your job post',
    },
    featureAndSocialBundle: {
      name: 'Feature and Social Bundle',
      price: 0, // Price hidden from UI per unified credit system
      stripePriceId: process.env.STRIPE_PRICE_BOOST_PACK || 'price_dynamic_boost_pack',
      description: 'Featured post + social graphic for maximum exposure',
      includes: ['featuredPost', 'socialGraphic'],
    },
  },
  // Individual credit purchases for reposting and additional jobs
  creditPacks: {
    singleCredit: {
      name: '1 Universal Credit',
      price: 0, // Price hidden from UI per unified credit system
      stripePriceId: process.env.STRIPE_PRICE_CREDIT_1 || 'price_dynamic_credit_1',
      credits: 1,
      description: 'Perfect for any feature: job posts, featured listings, social graphics',
    },
    fiveCredits: {
      name: '5 Universal Credits',
      price: 0, // Price hidden from UI per unified credit system
      stripePriceId: process.env.STRIPE_PRICE_CREDIT_5 || 'price_dynamic_credit_5',
      credits: 5,
      description: 'Best value for multiple features and job postings',
      savings: 0, // Savings calculation hidden from UI
    },
    // New credit pack options for modal
    small: {
      name: 'Small Pack',
      price: 0, // Price hidden from UI per unified credit system
      stripePriceId: process.env.STRIPE_PRICE_CREDIT_3 || 'price_dynamic_credit_3',
      credits: 3,
      description: 'Perfect for a few job posts',
    },
    medium: {
      name: 'Medium Pack',
      price: 0, // Price hidden from UI per unified credit system
      stripePriceId: process.env.STRIPE_PRICE_CREDIT_5 || 'price_dynamic_credit_5',
      credits: 5,
      description: 'Great for regular posting',
    },
    large: {
      name: 'Large Pack',
      price: 0, // Price hidden from UI per unified credit system
      stripePriceId: process.env.STRIPE_PRICE_CREDIT_12 || 'price_dynamic_credit_12',
      credits: 12,
      description: 'Best value for high-volume hiring',
    },
  },
};

// Subscription price IDs for job posting plans
export const STRIPE_PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
  },
  standard: {
    monthly: process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_STANDARD_YEARLY_PRICE_ID,
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
  // Legacy mappings for backward compatibility
  professional: {
    monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID,
  },
  enterprise: {
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
  },
  premium: {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
  },
};

// Webhook configuration
export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.created',
  'customer.updated',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
] as const;

export type StripeWebhookEvent = (typeof STRIPE_WEBHOOK_EVENTS)[number];
