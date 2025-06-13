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

// Monthly Subscription Tiers Configuration (All recurring subscriptions)
export const SUBSCRIPTION_TIERS_CONFIG = {
  starter: {
    name: 'Starter',
    monthlyPrice: 89,
    stripePriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    features: {
      jobPosts: 3,
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
      jobPosts: 5,
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
      jobPosts: 10,
      duration: 60,
      aiOptimization: true,
      analytics: 'premium',
      support: 'phone',
      featuredPosts: 2,
    },
    description: 'For high-volume hiring',
  },
    pro: {
      name: 'Pro Tier',
      price: 349,
      stripePriceId: process.env.STRIPE_PRICE_PRO || 'price_dynamic_pro',
      features: {
        jobPosts: 12,
        duration: 60, // days - standardized to 60 days
        aiOptimization: true,
        analytics: 'premium',
        support: 'phone',
        featuredPosts: 2,
      },
    },
  },
  addons: {
    featuredPost: {
      name: 'Featured Post',
      price: 49,
      stripePriceId: process.env.STRIPE_PRICE_FEATURED || 'price_dynamic_featured',
      description: 'Highlight your job at the top of search results',
    },
    socialGraphic: {
      name: 'Social Post Graphic',
      price: 49,
      stripePriceId: process.env.STRIPE_PRICE_GRAPHIC || 'price_dynamic_graphic',
      description: 'Custom social media graphic for your job post',
    },
    featureAndSocialBundle: {
      name: 'Feature and Social Bundle',
      price: 85,
      stripePriceId: process.env.STRIPE_PRICE_BOOST_PACK || 'price_dynamic_boost_pack',
      description: 'Featured post + social graphic (save $13)',
      includes: ['featuredPost', 'socialGraphic'],
    },
  },
  // Individual credit purchases for reposting and additional jobs
  creditPacks: {
    singleCredit: {
      name: '1 Job Posting Credit',
      price: 59,
      stripePriceId: process.env.STRIPE_PRICE_CREDIT_1 || 'price_dynamic_credit_1',
      credits: 1,
      description: 'Perfect for reposting or one additional job',
    },
    fiveCredits: {
      name: '5 Job Posting Credits',
      price: 249, // $49.80 per credit (16% discount)
      stripePriceId: process.env.STRIPE_PRICE_CREDIT_5 || 'price_dynamic_credit_5',
      credits: 5,
      description: 'Best value for multiple job postings',
      savings: 46, // $295 - $249
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
