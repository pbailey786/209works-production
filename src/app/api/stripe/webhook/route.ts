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
import { EmailQueue } from '@/lib/services/email-queue';

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

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
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
  const type = session.metadata?.type;

  if (!userId) {
    console.error('Missing userId in checkout session:', session.id);
    return;
  }

  // Handle job posting purchases and credit packs
  if (type === 'job_posting_purchase' || type === 'credit_pack_purchase') {
    await handleJobPostingPurchase(session);
    return;
  }

  // Handle addon purchases
  if (type === 'addon_purchase') {
    await handleAddonPurchase(session);
    return;
  }

  // Handle job upsell purchases
  if (type === 'job_upsell_purchase') {
    await handleJobUpsellPurchase(session);
    return;
  }

  // Handle subscription purchases
  const tier = session.metadata?.tier as PricingTier;
  const billingInterval = session.metadata?.billingInterval as BillingInterval;

  if (!tier || !billingInterval) {
    console.error('Missing subscription metadata in checkout session:', session.id);
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
  const tier = subscription.metadata?.tier;

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

    // Create or update subscription
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        stripeSubscriptionId: subscription.id,
        status: 'active',
        tier: tier as any || 'starter',
        startDate: new Date((subscription as any).current_period_start * 1000),
        endDate: new Date((subscription as any).current_period_end * 1000),
        price: subscription.items.data[0]?.price.unit_amount || 0,
      },
      create: {
        userId,
        email: user.email,
        stripeSubscriptionId: subscription.id,
        tier: tier as any || 'starter',
        billingCycle: 'monthly',
        status: subscription.status === 'trialing' ? 'trial' : 'active',
        startDate: new Date((subscription as any).current_period_start * 1000),
        endDate: new Date((subscription as any).current_period_end * 1000),
        price: subscription.items.data[0]?.price.unit_amount || 0,
      },
    });

    // Allocate credits based on tier
    await allocateSubscriptionCredits(userId, tier as string || 'starter');

    console.log(`Subscription created for user ${userId} with tier ${tier}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

// Helper function to allocate credits based on subscription tier (unified system)
async function allocateSubscriptionCredits(userId: string, tier: string) {
  const creditAllocation = {
    starter: { credits: 3 },
    standard: { credits: 5 },
    pro: { credits: 12 }, // 10 + 2 featured = 12 total unified credits
  };

  const allocation = creditAllocation[tier as keyof typeof creditAllocation] || creditAllocation.starter;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Credits expire in 30 days

  const creditsToCreate = [];

  // Add universal credits (can be used for any feature)
  for (let i = 0; i < allocation.credits; i++) {
    creditsToCreate.push({
      userId,
      type: 'universal', // Unified credit type
      expiresAt,
    });
  }

  if (creditsToCreate.length > 0) {
    await prisma.jobPostingCredit.createMany({
      data: creditsToCreate,
    });
    console.log(`Allocated ${creditsToCreate.length} universal credits to user ${userId} for tier ${tier}`);
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
      // Update subscription status
      const subscription = await prisma.subscription.update({
        where: { stripeSubscriptionId: (invoice as any).subscription },
        data: {
          status: 'active',
        },
      });

      // For recurring payments (not the first payment), allocate new credits
      if (invoice.billing_reason === 'subscription_cycle') {
        await allocateSubscriptionCredits(subscription.userId, subscription.tier);
        console.log(`Allocated recurring credits for subscription: ${(invoice as any).subscription}`);
      }

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

async function handleAddonPurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const addonId = session.metadata?.addonId;
  const jobId = session.metadata?.jobId;

  if (!userId || !addonId) {
    console.error('Missing addon purchase metadata:', session.id);
    return;
  }

  try {
    // Get addon details
    const addon = await prisma.addOn.findUnique({
      where: { id: addonId }
    });

    if (!addon) {
      console.error('Addon not found:', addonId);
      return;
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      console.error('User not found:', userId);
      return;
    }

    // Calculate expiration date for addon
    let expiresAt: Date | null = null;
    if (addon.usageLimits && (addon.usageLimits as any).expirationMonths) {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (addon.usageLimits as any).expirationMonths);
    }

    // Create UserAddOn record
    await prisma.userAddOn.create({
      data: {
        id: `ua_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        addOnId: addonId,
        isActive: true,
        purchasedAt: new Date(),
        activatedAt: new Date(),
        expiresAt,
        pricePaid: addon.price,
        billingInterval: addon.billingInterval,
        updatedAt: new Date(),
        usageData: {
          purchaseSessionId: session.id,
          appliedToJobs: [],
          jobPostsUsed: 0
        }
      }
    });

    // Update user's Stripe customer ID if not set
    if (session.customer && typeof session.customer === 'string') {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: session.customer }
      });
    }

    console.log(`Addon purchase completed: ${addon.name} for user ${userId}`);
  } catch (error) {
    console.error('Error handling addon purchase:', error);
  }
}

async function handleJobPostingPurchase(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier;
    const creditPack = session.metadata?.creditPack;
    const addonsJson = session.metadata?.addons;
    const totalAmount = session.metadata?.totalAmount;

    if (!userId) {
      console.error('Missing userId in job posting purchase:', session.id);
      return;
    }

    // Parse addons
    let addons = [];
    try {
      addons = addonsJson ? JSON.parse(addonsJson) : [];
    } catch (e) {
      console.error('Failed to parse addons JSON:', addonsJson);
    }

    // Update purchase record
    const purchase = await prisma.jobPostingPurchase.update({
      where: { stripeSessionId: session.id },
      data: {
        status: 'completed',
        stripePaymentIntentId: session.payment_intent as string,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });

    // Create individual credits for the user (unified system - all credits are universal)
    const creditsToCreate = [];

    // Calculate total credits from all sources (unified system)
    const totalCredits = (purchase.jobPostCredits || 0) + (purchase.featuredPostCredits || 0) + (purchase.socialGraphicCredits || 0);

    // Add universal credits (can be used for any feature)
    for (let i = 0; i < totalCredits; i++) {
      creditsToCreate.push({
        userId,
        purchaseId: purchase.id,
        type: 'universal', // Unified credit type - can be used for job posts, featured posts, or social graphics
        expiresAt: purchase.expiresAt,
      });
    }

    // Note: Repost functionality removed - credits don't roll over month to month

    // Create all credits
    if (creditsToCreate.length > 0) {
      await prisma.jobPostingCredit.createMany({
        data: creditsToCreate,
      });
    }

    // Total credits already calculated above

    // Send credit confirmation email
    try {
      const emailQueue = EmailQueue.getInstance();
      const planType = tier || creditPack || 'credit_pack';

      await emailQueue.addCreditConfirmationEmail(
        purchase.user.email,
        {
          userName: purchase.user.name || 'Valued Customer',
          creditAmount: totalCredits,
          planType: planType.replace('_', ' ').toUpperCase(),
          dashboardUrl: `${process.env.NEXTAUTH_URL}/employers/dashboard`,
          expirationDate: purchase.expiresAt ? new Date(purchase.expiresAt).toLocaleDateString() : null,
        },
        userId
      );
    } catch (emailError) {
      console.error('Failed to send credit confirmation email:', emailError);
      // Don't fail the webhook if email fails - credits are still assigned
    }

    console.log(`Job posting purchase completed for user ${userId}: ${tier || creditPack} with ${totalCredits} total credits`);
  } catch (error) {
    console.error('Error handling job posting purchase:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.userId;
  const type = paymentIntent.metadata?.type;

  if (type === 'addon_purchase' && userId) {
    console.log(`Payment succeeded for addon purchase by user ${userId}`);
    // Additional logic if needed for payment confirmation
  }
}

async function handleJobUpsellPurchase(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    const jobId = session.metadata?.jobId;
    const socialMediaShoutout = session.metadata?.socialMediaShoutout === 'true';
    const placementBump = session.metadata?.placementBump === 'true';
    const upsellBundle = session.metadata?.upsellBundle === 'true';
    const totalAmount = parseFloat(session.metadata?.totalAmount || '0');

    if (!userId || !jobId) {
      console.error('Missing required metadata in job upsell purchase:', session.id);
      return;
    }

    // Update the upsell purchase record
    const upsellPurchase = await prisma.jobUpsellPurchase.update({
      where: { stripeSessionId: session.id },
      data: {
        status: 'completed',
        stripePaymentIntentId: session.payment_intent as string,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true,
          }
        }
      }
    });

    // Update the job with upsell flags
    await prisma.job.update({
      where: { id: jobId },
      data: {
        socialMediaShoutout,
        placementBump,
        upsellBundle,
      },
    });

    // Send confirmation email
    try {
      const emailQueue = EmailQueue.getInstance();
      await emailQueue.addEmailJob({
        type: 'upsell_confirmation',
        to: upsellPurchase.user.email,
        subject: `🚀 Your job promotion for "${upsellPurchase.job.title}" is active!`,
        template: 'system-notification',
        data: {
          userName: upsellPurchase.user.name || 'Valued Customer',
          title: 'Job Promotion Activated!',
          message: `Great news! Your promotion package for "${upsellPurchase.job.title}" is now active and working to get you more qualified applicants.`,
          details: [
            socialMediaShoutout && 'Social Media Shoutout: Your job will be promoted on our Instagram and X channels',
            placementBump && 'On-Site Placement Bump: JobsGPT will actively recommend your job to chat users',
            upsellBundle && 'Complete Bundle: You\'re getting maximum exposure with both services',
          ].filter(Boolean),
          ctaText: 'View Job Dashboard',
          ctaUrl: `${process.env.NEXTAUTH_URL}/employers/my-jobs`,
        },
        userId: upsellPurchase.user.id,
        priority: 'high',
        metadata: {
          jobId,
          upsellType: upsellBundle ? 'bundle' : (socialMediaShoutout && placementBump ? 'both' : socialMediaShoutout ? 'social' : 'placement'),
          totalAmount,
        },
      });
    } catch (emailError) {
      console.error('Failed to send upsell confirmation email:', emailError);
      // Don't fail the webhook if email fails
    }

    console.log(`Job upsell purchase completed for user ${userId}, job ${jobId}: $${totalAmount}`);
  } catch (error) {
    console.error('Error handling job upsell purchase:', error);
  }
}

function mapStripeStatusToSubscriptionStatus(
  stripeStatus: string
): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
    case 'trialing': // Map trialing to active since we don't have trials
      return 'active';
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
