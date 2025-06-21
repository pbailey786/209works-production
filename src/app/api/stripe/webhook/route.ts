import { NextRequest, NextResponse } from 'next/server';
import { headers } from '@/components/ui/card';
import { stripe, STRIPE_WEBHOOK_EVENTS } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';
import { EmailQueue } from '@prisma/client';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Webhook error types for better error handling
enum WebhookErrorType {
  SIGNATURE_VERIFICATION = 'SIGNATURE_VERIFICATION',
  MISSING_METADATA = 'MISSING_METADATA',
  DATABASE_ERROR = 'DATABASE_ERROR',
  STRIPE_API_ERROR = 'STRIPE_API_ERROR',
  UNKNOWN = 'UNKNOWN'
}

class WebhookError extends Error {
  constructor(
    message: string,
    public type: WebhookErrorType,
    public eventType?: string,
    public eventId?: string
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let event: Stripe.Event | undefined;
  
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      throw new WebhookError(
        'Missing stripe-signature header',
        WebhookErrorType.SIGNATURE_VERIFICATION
      );
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      throw new WebhookError(
        `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        WebhookErrorType.SIGNATURE_VERIFICATION
      );
    }

    // Log webhook received
    console.log(`[Stripe Webhook] Received: ${event.type} (${event.id})`);

    // Check for idempotency - prevent duplicate processing
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id }
    }).catch(() => null); // Handle case where table doesn't exist yet

    if (existingEvent) {
      console.log(`[Stripe Webhook] Event already processed: ${event.id}`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Record webhook event (optional - only if table exists)
    try {
      await prisma.webhookEvent.create({
        data: {
          stripeEventId: event.id,
          type: event.type,
          data: event.data.object as any,
          processedAt: new Date()
        }
      });
    } catch (error) {
      console.warn('[Stripe Webhook] Could not log webhook event:', error);
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

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'customer.subscription.trial_will_end':
        await handleSubscriptionTrialWillEnd(
          event.data.object as Stripe.Subscription
        );
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[Stripe Webhook] Processed ${event.type} in ${processingTime}ms`);
    
    return NextResponse.json({ received: true, processingTime });
  } catch (error) {
    const errorType = error instanceof WebhookError ? error.type : WebhookErrorType.UNKNOWN;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[Stripe Webhook] Error:`, {
      type: errorType,
      message: errorMessage,
      eventType: event?.type,
      eventId: event?.id,
      error
    });

    // Log to monitoring service (e.g., Sentry)
    if (event) {
      try {
        await prisma.webhookError.create({
          data: {
            stripeEventId: event.id,
            eventType: event.type,
            errorType,
            errorMessage,
            createdAt: new Date()
          }
        });
      } catch (logError) {
        console.warn('[Stripe Webhook] Could not log webhook error:', logError);
      }
    }

    // Return appropriate status code based on error type
    const statusCode = errorType === WebhookErrorType.SIGNATURE_VERIFICATION ? 400 : 500;
    
    return NextResponse.json(
      { 
        error: 'Webhook handler failed',
        type: errorType,
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: statusCode }
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
        data: { stripeCustomerId: session.customer }
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
        select: { email: true }
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
          price: stripeSubscription.items.data[0]?.price.unit_amount || 0
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
          price: stripeSubscription.items.data[0]?.price.unit_amount || 0
        }
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
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!dbUser) {
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
        price: subscription.items.data[0]?.price.unit_amount || 0
      },
      create: {
        userId,
        email: dbUser.email,
        stripeSubscriptionId: subscription.id,
        tier: tier as any || 'starter',
        billingCycle: 'monthly',
        status: subscription.status === 'trialing' ? 'trial' : 'active',
        startDate: new Date((subscription as any).current_period_start * 1000),
        endDate: new Date((subscription as any).current_period_end * 1000),
        price: subscription.items.data[0]?.price.unit_amount || 0
      }
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
      expiresAt
    });
  }

  if (creditsToCreate.length > 0) {
    await prisma.jobPostingCredit.createMany({
      data: creditsToCreate
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
    // Get the current subscription data
    const currentSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    if (!currentSubscription) {
      console.error('Subscription not found:', subscription.id);
      return;
    }

    // Detect plan changes (upgrades/downgrades)
    const newPriceId = subscription.items.data[0]?.price.id;
    const oldTier = currentSubscription.tier;
    const newTier = detectTierFromPriceId(newPriceId);
    const isUpgrade = isSubscriptionUpgrade(oldTier, newTier);
    const isDowngrade = isSubscriptionDowngrade(oldTier, newTier);

    // Update subscription
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: mapStripeStatusToSubscriptionStatus(subscription.status),
        tier: newTier as any,
        startDate: new Date((subscription as any).current_period_start * 1000),
        endDate: new Date((subscription as any).current_period_end * 1000),
        price: subscription.items.data[0]?.price.unit_amount || 0,
        updatedAt: new Date()
      }
    });

    // Handle upgrades - immediate credit allocation
    if (isUpgrade && subscription.status === 'active') {
      await allocateSubscriptionCredits(userId, newTier);
      
      // Send upgrade confirmation
      const emailQueue = EmailQueue.getInstance();
      await emailQueue.addEmailJob({
        type: 'generic',
        to: currentSubscription.user.email,
        subject: '🎉 Subscription Upgraded Successfully!',
        template: 'system-notification',
        data: {
          userName: currentSubscription.user.name || 'Valued Customer',
          title: 'Subscription Upgraded!',
          message: `Your subscription has been upgraded from ${oldTier} to ${newTier}. Your new credits are now available!`,
          details: [
            `New plan: ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}`,
            `Monthly credits: ${getCreditsForTier(newTier)}`,
            'Credits are available immediately',
          ],
          ctaText: 'Post a Job',
          ctaUrl: `${process.env.NEXTAUTH_URL}/employers/post-job`
        },
        userId,
        priority: 'normal'
      });
    }

    // Handle downgrades - will take effect at end of billing period
    if (isDowngrade) {
      // Send downgrade confirmation
      const emailQueue = EmailQueue.getInstance();
      await emailQueue.addEmailJob({
        type: 'generic',
        to: currentSubscription.user.email,
        subject: 'Subscription Change Confirmed',
        template: 'system-notification',
        data: {
          userName: currentSubscription.user.name || 'Valued Customer',
          title: 'Subscription Change Scheduled',
          message: `Your subscription will change from ${oldTier} to ${newTier} at the end of your current billing period.`,
          details: [
            `Current plan remains active until: ${new Date((subscription as any).current_period_end * 1000).toLocaleDateString()}`,
            `New plan starts: ${new Date((subscription as any).current_period_end * 1000).toLocaleDateString()}`,
            'You can continue using your current credits until they expire',
          ],
          ctaText: 'View Subscription',
          ctaUrl: `${process.env.NEXTAUTH_URL}/employers/settings/billing`
        },
        userId,
        priority: 'normal'
      });
    }

    console.log(`Subscription updated for user ${userId}: ${oldTier} -> ${newTier}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'cancelled',
        endDate: new Date()
      }
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
          status: 'active'
        }
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
      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: (invoice as any).subscription },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      if (!subscription) {
        console.error('Subscription not found for failed invoice:', (invoice as any).subscription);
        return;
      }

      // Update subscription status
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'past_due',
          updatedAt: new Date()
        }
      });

      // Create payment failure record for tracking (optional)
      try {
        await prisma.paymentFailure.create({
          data: {
            subscriptionId: subscription.id,
            userId: subscription.userId,
            invoiceId: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            attemptCount: invoice.attempt_count || 1,
            nextRetryAt: invoice.next_payment_attempt 
              ? new Date(invoice.next_payment_attempt * 1000)
              : null,
            reason: (invoice as any).last_payment_error?.message || 'Unknown error',
            createdAt: new Date()
          }
        });
      } catch (paymentFailureError) {
        console.warn('[Stripe Webhook] Could not create payment failure record:', paymentFailureError);
      }

      // Send payment failure notification
      const emailQueue = EmailQueue.getInstance();
      await emailQueue.addEmailJob({
        type: 'generic',
        to: subscription.user.email,
        subject: '⚠️ Payment Failed - Action Required',
        template: 'system-notification',
        data: {
          userName: subscription.user.name || 'Valued Customer',
          title: 'Payment Failed',
          message: `We were unable to process your payment for your ${subscription.tier} subscription. Please update your payment method to continue enjoying uninterrupted service.`,
          details: [
            `Amount due: $${(invoice.amount_due / 100).toFixed(2)}`,
            `Next retry: ${invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString() : 'No automatic retry scheduled'}`,
            'Your subscription will remain active during the grace period',
          ],
          ctaText: 'Update Payment Method',
          ctaUrl: `${process.env.NEXTAUTH_URL}/employers/settings/billing`
        },
        userId: subscription.userId,
        priority: 'high',
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: subscription.id,
          attemptCount: invoice.attempt_count
        }
      });

      console.log(
        `Invoice payment failed for subscription: ${(invoice as any).subscription} (attempt ${invoice.attempt_count})`
      );
    } catch (error) {
      console.error('Error handling invoice payment failed:', error);
      throw error;
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
    const userRecord = await prisma.user.findUnique({
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
        stripePaymentIntentId: session.payment_intent as string
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    // Create individual credits for the user (unified system - all credits are universal)
    const creditsToCreate = [];

    // Calculate total credits from all sources (unified system)
    const totalCredits = purchase.jobPostCredits + purchase.featuredPostCredits + purchase.socialGraphicCredits;

    // Add all credits as universal type (unified system)
    for (let i = 0; i < totalCredits; i++) {
      creditsToCreate.push({
        userId,
        purchaseId: purchase.id,
        type: 'universal', // All credits are now universal and interchangeable
        expiresAt: purchase.expiresAt
      });
    }

    // Note: All credits are now universal and interchangeable in the unified system

    // Create all credits
    if (creditsToCreate.length > 0) {
      await prisma.jobPostingCredit.createMany({
        data: creditsToCreate
      });
    }

    // Use the already calculated totalCredits

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
          expirationDate: purchase.expiresAt ? new Date(purchase.expiresAt).toLocaleDateString() : null
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
        stripePaymentIntentId: session.payment_intent as string
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true
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
        upsellBundle
      }
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
          ctaUrl: `${process.env.NEXTAUTH_URL}/employers/my-jobs`
        },
        userId: upsellPurchase.user.id,
        priority: 'high',
        metadata: {
          jobId,
          upsellType: upsellBundle ? 'bundle' : (socialMediaShoutout && placementBump ? 'both' : socialMediaShoutout ? 'social' : 'placement'),
          totalAmount
        }
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

// Helper function to detect tier from Stripe price ID
function detectTierFromPriceId(priceId?: string): PricingTier {
  if (!priceId) return 'starter';
  
  const priceIdLower = priceId.toLowerCase();
  
  if (priceIdLower.includes('pro') || priceIdLower.includes('premium')) {
    return 'premium' as any;
  } else if (priceIdLower.includes('standard') || priceIdLower.includes('professional')) {
    return 'professional' as any;
  } else if (priceIdLower.includes('starter') || priceIdLower.includes('basic')) {
    return 'basic' as any;
  }
  
  // Check environment variables
  if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID) return 'premium' as any;
  if (priceId === process.env.STRIPE_STANDARD_MONTHLY_PRICE_ID) return 'professional' as any;
  if (priceId === process.env.STRIPE_STARTER_MONTHLY_PRICE_ID) return 'basic' as any;
  
  return 'basic' as any; // Default
}

// Helper function to check if subscription is an upgrade
function isSubscriptionUpgrade(oldTier: string, newTier: string): boolean {
  const tierRanking = { basic: 1, essential: 2, professional: 3, enterprise: 4, premium: 5, starter: 1 };
  const oldRank = tierRanking[oldTier as keyof typeof tierRanking] || 0;
  const newRank = tierRanking[newTier as keyof typeof tierRanking] || 0;
  return newRank > oldRank;
}

// Helper function to check if subscription is a downgrade
function isSubscriptionDowngrade(oldTier: string, newTier: string): boolean {
  const tierRanking = { basic: 1, essential: 2, professional: 3, enterprise: 4, premium: 5, starter: 1 };
  const oldRank = tierRanking[oldTier as keyof typeof tierRanking] || 0;
  const newRank = tierRanking[newTier as keyof typeof tierRanking] || 0;
  return newRank < oldRank;
}

// Helper function to get credits for a tier
function getCreditsForTier(tier: string): number {
  const creditMap = {
    basic: 3,
    essential: 5,
    professional: 8,
    enterprise: 15,
    premium: 20,
    starter: 3
  };
  return creditMap[tier as keyof typeof creditMap] || 3;
}

// New handler for payment intent failures
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.userId;
  const subscriptionId = paymentIntent.metadata?.subscriptionId;

  if (!userId) {
    console.error('Missing userId in payment intent metadata:', paymentIntent.id);
    return;
  }

  try {
    // Log the failure for analysis (optional)
    try {
      await prisma.paymentFailure.create({
        data: {
          userId,
          subscriptionId,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          reason: (paymentIntent as any).last_payment_error?.message || 'Unknown error',
          attemptCount: 1,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.warn('[Stripe Webhook] Could not create payment failure record:', error);
    }

    console.log(`Payment intent failed for user ${userId}: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

// New handler for trial ending notifications
async function handleSubscriptionTrialWillEnd(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata:', subscription.id);
    return;
  }

  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (!user) {
      console.error('User not found:', userId);
      return;
    }

    // Send trial ending notification
    const emailQueue = EmailQueue.getInstance();
    const trialEndDate = new Date((subscription as any).trial_end * 1000);
    const daysRemaining = Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    await emailQueue.addEmailJob({
      type: 'generic',
      to: user.email,
      subject: `⏰ Your trial ends in ${daysRemaining} days`,
      template: 'system-notification',
      data: {
        userName: user.name || 'Valued Customer',
        title: 'Trial Ending Soon',
        message: `Your trial period will end on ${trialEndDate.toLocaleDateString()}. Add a payment method now to ensure uninterrupted service.`,
        details: [
          `Trial ends: ${trialEndDate.toLocaleDateString()}`,
          'No charges until trial ends',
          'Cancel anytime without charge',
        ],
        ctaText: 'Add Payment Method',
        ctaUrl: `${process.env.NEXTAUTH_URL}/employers/settings/billing`
      },
      userId,
      priority: 'high'
    });

    console.log(`Trial ending notification sent for subscription: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling trial ending notification:', error);
  }
}
