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

// Stripe configuration
export const STRIPE_CONFIG = {
  currency: 'usd',
  payment_method_types: ['card'],
  mode: 'subscription' as const,
  billing_address_collection: 'required' as const,
  customer_creation: 'always' as const,
  automatic_tax: {
    enabled: true,
  },
  allow_promotion_codes: true,
  subscription_data: {
    trial_period_days: 14, // 14-day free trial
  },
};

// Job Posting Tiers and Add-ons Configuration (One-time payments)
export const JOB_POSTING_CONFIG = {
  tiers: {
    starter: {
      name: 'Starter Tier',
      price: 99,
      stripePriceId: process.env.STRIPE_PRICE_STARTER,
      features: {
        jobPosts: 2,
        duration: 30, // days
        aiOptimization: false,
        analytics: 'basic',
        support: 'email',
      },
    },
    standard: {
      name: 'Standard Tier',
      price: 199,
      stripePriceId: process.env.STRIPE_PRICE_STANDARD,
      features: {
        jobPosts: 5,
        duration: 30,
        aiOptimization: true,
        analytics: 'advanced',
        support: 'priority',
      },
    },
    pro: {
      name: 'Pro Tier',
      price: 350,
      stripePriceId: process.env.STRIPE_PRICE_PRO,
      features: {
        jobPosts: 10,
        duration: 60,
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
      stripePriceId: process.env.STRIPE_PRICE_FEATURED,
      description: 'Highlight your job at the top of search results',
    },
    socialGraphic: {
      name: 'Social Post Graphic',
      price: 49,
      stripePriceId: process.env.STRIPE_PRICE_GRAPHIC,
      description: 'Custom social media graphic for your job post',
    },
    featureAndSocialBundle: {
      name: 'Feature and Social Bundle',
      price: 85,
      stripePriceId: process.env.STRIPE_PRICE_BOOST_PACK,
      description: 'Featured post + social graphic (save $13)',
      includes: ['featuredPost', 'socialGraphic'],
    },
  },
  // Individual credit purchases for reposting and additional jobs
  creditPacks: {
    singleCredit: {
      name: '1 Job Credit',
      price: 59,
      stripePriceId: process.env.STRIPE_PRICE_CREDIT_1,
      credits: 1,
      description: 'Perfect for reposting or one additional job',
    },
    fiveCredits: {
      name: '5 Job Credits',
      price: 249, // $49.80 per credit (16% discount)
      stripePriceId: process.env.STRIPE_PRICE_CREDIT_5,
      credits: 5,
      description: 'Best value for multiple job postings',
      savings: 46, // $295 - $249
    },
  },
};

// Legacy subscription price IDs (keeping for backward compatibility)
export const STRIPE_PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
  },
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
