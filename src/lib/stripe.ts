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

// Price IDs for different plans (these will need to be created in Stripe Dashboard)
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
