import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, STRIPE_WEBHOOK_EVENTS } from '@/lib/stripe';
import { prisma } from '@/lib/database/prisma';
import {
  PricingTier,
  BillingInterval,
  SubscriptionStatus,
} from '@prisma/client';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as PricingTier;
  const billingInterval = session.metadata?.billingInterval as BillingInterval;

  if (!userId || !tier || !billingInterval) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  try {
    // Update user with customer ID if not already set
    if (session.customer && typeof session.customer === 'string') {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: session.customer },
      });
    }

    // Create or update subscription record
    if (session.subscription && typeof session.subscription === 'string') {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        session.subscription
      );

      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        console.error('User not found:', userId);
        return;
      }

      await prisma.subscription.upsert({
        where: { userId },
        update: {
          stripeSubscriptionId: stripeSubscription.id,
          tier,
          billingCycle: billingInterval,
          status: stripeSubscription.status === 'trialing' ? 'trial' : 'active',
          startDate: new Date(
            (stripeSubscription as any).current_period_start * 1000
          ),
          endDate: new Date(
            (stripeSubscription as any).current_period_end * 1000
          ),
          price: stripeSubscription.items.data[0]?.price.unit_amount || 0,
        },
        create: {
          userId,
          email: user.email,
          stripeSubscriptionId: stripeSubscription.id,
          tier,
          billingCycle: billingInterval,
          status: stripeSubscription.status === 'trialing' ? 'trial' : 'active',
          startDate: new Date(
            (stripeSubscription as any).current_period_start * 1000
          ),
          endDate: new Date(
            (stripeSubscription as any).current_period_end * 1000
          ),
          price: stripeSubscription.items.data[0]?.price.unit_amount || 0,
        },
      });
    }

    console.log(`Checkout completed for user ${userId}, tier: ${tier}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata:', subscription.id);
    return;
  }

  try {
    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      console.error('User not found:', userId);
      return;
    }

    await prisma.subscription.upsert({
      where: { userId },
      update: {
        stripeSubscriptionId: subscription.id,
        status: subscription.status === 'trialing' ? 'trial' : 'active',
        startDate: new Date((subscription as any).current_period_start * 1000),
        endDate: new Date((subscription as any).current_period_end * 1000),
      },
      create: {
        userId,
        email: user.email,
        stripeSubscriptionId: subscription.id,
        tier: 'starter', // Default tier, should be updated from metadata
        billingCycle: 'monthly', // Default, should be updated from metadata
        status: subscription.status === 'trialing' ? 'trial' : 'active',
        startDate: new Date((subscription as any).current_period_start * 1000),
        endDate: new Date((subscription as any).current_period_end * 1000),
        price: subscription.items.data[0]?.price.unit_amount || 0,
      },
    });

    console.log(`Subscription created for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata:', subscription.id);
    return;
  }

  try {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: mapStripeStatusToSubscriptionStatus(subscription.status),
        startDate: new Date((subscription as any).current_period_start * 1000),
        endDate: new Date((subscription as any).current_period_end * 1000),
        price: subscription.items.data[0]?.price.unit_amount || 0,
      },
    });

    console.log(`Subscription updated for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'cancelled',
        endDate: new Date(),
      },
    });

    console.log(`Subscription cancelled: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (
    (invoice as any).subscription &&
    typeof (invoice as any).subscription === 'string'
  ) {
    try {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: (invoice as any).subscription },
        data: {
          status: 'active',
        },
      });

      console.log(
        `Invoice payment succeeded for subscription: ${(invoice as any).subscription}`
      );
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (
    (invoice as any).subscription &&
    typeof (invoice as any).subscription === 'string'
  ) {
    try {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: (invoice as any).subscription },
        data: {
          status: 'past_due',
        },
      });

      console.log(
        `Invoice payment failed for subscription: ${(invoice as any).subscription}`
      );
    } catch (error) {
      console.error('Error handling invoice payment failed:', error);
    }
  }
}

function mapStripeStatusToSubscriptionStatus(
  stripeStatus: string
): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trial';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    case 'unpaid':
      return 'past_due';
    default:
      return 'active';
  }
}
