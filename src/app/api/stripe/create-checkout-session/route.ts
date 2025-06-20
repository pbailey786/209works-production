import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { stripe, STRIPE_CONFIG, getStripePriceId, validateStripeConfig } from '@/lib/stripe';
import { prisma } from '@/lib/database/prisma';
import { PricingTier, BillingInterval } from '@prisma/client';
import type { Session } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session!.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      priceId,
      tier,
      billingInterval,
      successUrl,
      cancelUrl,
    }: {
      priceId: string;
      tier: PricingTier;
      billingInterval: BillingInterval;
      successUrl?: string;
      cancelUrl?: string;
    } = body;

    // Validate Stripe configuration first
    const configValidation = validateStripeConfig();
    if (!configValidation.isValid) {
      console.error('Stripe configuration errors:', configValidation.errors);
      return NextResponse.json(
        {
          error: 'Stripe configuration error',
          details: configValidation.errors
        },
        { status: 500 }
      );
    }

    // Resolve the plan ID to the actual Stripe price ID
    const actualPriceId = getStripePriceId(
      tier, 
      billingInterval === BillingInterval.yearly ? 'yearly' : 'monthly'
    );

    if (!actualPriceId) {
      return NextResponse.json(
        {
          error: `Stripe price not configured for tier: ${tier}`,
          tier,
          billingInterval,
          details: 'Check environment variables for Stripe price IDs'
        },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customer;
    const user = await prisma.user.findUnique({
      where: { email: session!.user?.email },
      select: { id: true, stripeCustomerId: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.stripeCustomerId) {
      // Retrieve existing customer
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: user.email!,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Create checkout session for monthly subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: STRIPE_CONFIG.payment_method_types as any,
      billing_address_collection: STRIPE_CONFIG.billing_address_collection,
      line_items: [
        {
          price: actualPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription', // Always subscription mode
      allow_promotion_codes: STRIPE_CONFIG.allow_promotion_codes,
      automatic_tax: STRIPE_CONFIG.automatic_tax,
      subscription_data: {
        metadata: {
          userId: user.id,
          tier,
          billingInterval: 'monthly', // Always monthly
        },
      },
      success_url:
        successUrl ||
        `${process.env.NEXTAUTH_URL}/employers/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/employers/pricing`,
      metadata: {
        userId: user.id,
        tier,
        billingInterval: 'monthly',
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
