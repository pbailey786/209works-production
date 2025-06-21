import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { stripe } from '@/lib/stripe';
import { STRIPE_PRICE_IDS } from '@/lib/stripe/config';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import type { PricingTier, BillingInterval } from '@prisma/client';

const changeSubscriptionSchema = z.object({
  newTier: z.enum(['basic', 'essential', 'professional', 'enterprise', 'premium', 'starter']),
  billingInterval: z.enum(['monthly', 'yearly']).optional().default('monthly'),
  proration: z.boolean().optional().default(true),
});

// POST /api/stripe/subscription/change - Upgrade or downgrade subscription
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newTier, billingInterval, proration } = changeSubscriptionSchema.parse(body);

    // Get user with current subscription
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email },
      include: {
        subscriptions: true,
      },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json(
        { error: 'User not found or not an employer' },
        { status: 404 }
      );
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 400 }
      );
    }

    const currentSubscription = user.subscriptions;
    if (!currentSubscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Get the new price ID
    const priceIdsMapping: any = STRIPE_PRICE_IDS;
    const newPriceId = priceIdsMapping[newTier]?.[billingInterval];
    if (!newPriceId) {
      return NextResponse.json(
        { error: 'Invalid subscription tier or billing interval' },
        { status: 400 }
      );
    }

    // Get current Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripeSubscriptionId
    );

    const currentPriceId = stripeSubscription.items.data[0]?.price.id;
    
    // Check if this is actually a change
    if (currentPriceId === newPriceId) {
      return NextResponse.json(
        { error: 'You are already on this plan' },
        { status: 400 }
      );
    }

    // Determine if this is an upgrade or downgrade
    const isUpgrade = isSubscriptionUpgrade(currentSubscription.tier, newTier);
    const isDowngrade = isSubscriptionDowngrade(currentSubscription.tier, newTier);

    try {
      // Update the Stripe subscription
      const updatedSubscription = await stripe.subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: proration ? 'create_prorations' : 'none',
          // billing_cycle_anchor_unchanged: !isUpgrade, // For downgrades, keep current billing cycle
          metadata: {
            userId: user.id,
            tier: newTier,
            previousTier: currentSubscription.tier,
            changeType: isUpgrade ? 'upgrade' : 'downgrade',
          },
        }
      );

      // Calculate proration amount if applicable
      let prorationAmount = 0;
      if (proration && isUpgrade) {
        // For upgrades, calculate immediate proration
        const subscription = await stripe.subscriptions.retrieve(
          currentSubscription.stripeSubscriptionId,
          { expand: ['latest_invoice'] }
        );
        const latestInvoice = subscription.latest_invoice as any;
        if (latestInvoice) {
          prorationAmount = latestInvoice.amount_due || 0;
        }
      }

      // Update local subscription record
      await prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: {
          tier: newTier as any,
          billingCycle: billingInterval as BillingInterval,
          price: updatedSubscription.items.data[0]?.price.unit_amount || 0,
          updatedAt: new Date(),
          // For downgrades, the tier change will be effective at the end of billing period
          // This will be handled by the webhook when the subscription actually updates
        },
      });

      // For upgrades, allocate new credits immediately
      if (isUpgrade) {
        await allocateSubscriptionCredits(user.id, newTier);
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'subscription_change',
          details: JSON.stringify({
            from: currentSubscription.tier,
            to: newTier,
            billingInterval,
            changeType: isUpgrade ? 'upgrade' : 'downgrade',
            prorationAmount,
            stripeSubscriptionId: currentSubscription.stripeSubscriptionId,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        subscription: {
          tier: newTier,
          billingInterval,
          changeType: isUpgrade ? 'upgrade' : 'downgrade',
          effectiveDate: isUpgrade ? new Date() : new Date((updatedSubscription as any).current_period_end * 1000),
          prorationAmount: prorationAmount / 100, // Convert to dollars
        },
        message: isUpgrade 
          ? 'Subscription upgraded successfully! Your new credits are available immediately.'
          : 'Subscription change scheduled! Your new plan will take effect at the end of your current billing period.',
      });

    } catch (stripeError: any) {
      console.error('Stripe subscription update error:', stripeError);
      
      return NextResponse.json(
        { 
          error: 'Failed to update subscription',
          details: stripeError?.message || 'Unknown Stripe error',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Subscription change error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to change subscription' },
      { status: 500 }
    );
  }
}

// GET /api/stripe/subscription/change - Get change preview
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRecord = await prisma.user.findUnique({
      where: { clerkId: userId! },
      include: {
        subscriptions: true,
      },
    });

    if (!userRecord?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const newTier = searchParams.get('tier') as PricingTier;
    const billingInterval = (searchParams.get('billing') as BillingInterval) || 'monthly';

    if (!newTier || !['basic', 'essential', 'professional', 'enterprise', 'premium', 'starter'].includes(newTier)) {
      return NextResponse.json(
        { error: 'Invalid tier specified' },
        { status: 400 }
      );
    }

    if (!userRecord || !userRecord.subscriptions?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    const currentSubscription = userRecord.subscriptions;
    const priceMapping: any = STRIPE_PRICE_IDS;
    const newPriceId = priceMapping[newTier]?.[billingInterval];

    if (!newPriceId) {
      return NextResponse.json(
        { error: 'Invalid subscription configuration' },
        { status: 400 }
      );
    }

    try {
      // Get proration preview from Stripe
      const preview = await (stripe.invoices as any).retrieveUpcoming({
        customer: userRecord.stripeCustomerId!,
        subscription: currentSubscription.stripeSubscriptionId,
        subscription_items: [
          {
            id: (await stripe.subscriptions.retrieve(currentSubscription.stripeSubscriptionId!)).items.data[0].id,
            price: newPriceId,
          },
        ],
        subscription_proration_behavior: 'create_prorations',
      });

      const isUpgrade = isSubscriptionUpgrade(currentSubscription.tier, newTier);
      const isDowngrade = isSubscriptionDowngrade(currentSubscription.tier, newTier);

      return NextResponse.json({
        success: true,
        preview: {
          currentTier: currentSubscription.tier,
          newTier,
          changeType: isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : 'change',
          immediateCharge: preview.amount_due / 100, // Convert to dollars
          nextInvoiceAmount: preview.amount_due / 100,
          effectiveDate: isUpgrade ? new Date() : new Date(preview.period_end * 1000),
          billingInterval,
          prorationDetails: preview.lines.data.map((line: any) => ({
            description: line.description,
            amount: line.amount / 100,
            period: {
              start: new Date(line.period.start * 1000),
              end: new Date(line.period.end * 1000),
            },
          })),
        },
      });

    } catch (stripeError: any) {
      console.error('Stripe preview error:', stripeError);
      
      return NextResponse.json(
        { 
          error: 'Failed to generate preview',
          details: stripeError?.message || 'Unknown Stripe error',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Subscription preview error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}

// Helper functions
function isSubscriptionUpgrade(oldTier: string, newTier: string): boolean {
  const tierRanking = { basic: 1, essential: 2, professional: 3, enterprise: 4, premium: 5, starter: 1 };
  const oldRank = tierRanking[oldTier as keyof typeof tierRanking] || 0;
  const newRank = tierRanking[newTier as keyof typeof tierRanking] || 0;
  return newRank > oldRank;
}

function isSubscriptionDowngrade(oldTier: string, newTier: string): boolean {
  const tierRanking = { basic: 1, essential: 2, professional: 3, enterprise: 4, premium: 5, starter: 1 };
  const oldRank = tierRanking[oldTier as keyof typeof tierRanking] || 0;
  const newRank = tierRanking[newTier as keyof typeof tierRanking] || 0;
  return newRank < oldRank;
}

async function allocateSubscriptionCredits(userId: string, tier: string) {
  const creditAllocation = {
    basic: { credits: 3 },
    essential: { credits: 5 },
    professional: { credits: 8 },
    enterprise: { credits: 15 },
    premium: { credits: 20 },
    starter: { credits: 3 },
  };

  const allocation = creditAllocation[tier as keyof typeof creditAllocation] || creditAllocation.basic;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const creditsToCreate = [];
  for (let i = 0; i < allocation.credits; i++) {
    creditsToCreate.push({
      userId,
      type: 'universal',
      expiresAt,
    });
  }

  if (creditsToCreate.length > 0) {
    await prisma.jobPostingCredit.createMany({
      data: creditsToCreate,
    });
    console.log(`Allocated ${creditsToCreate.length} credits to user ${userId} for tier ${tier}`);
  }
}