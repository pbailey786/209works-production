import { NextRequest, NextResponse } from '@/components/ui/card';
import { requireRole } from '@/components/ui/card';
import { stripe } from '@/components/ui/card';
import { JOB_POSTING_CONFIG } from '@/components/ui/card';
import { prisma } from '@/components/ui/card';
import { z } from 'zod';

const buyCreditSchema = z.object({
  creditPack: z.enum(['singleCredit', 'fiveCredits', 'small', 'medium', 'large']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication using modern session validator
    const { user: authUser } = await requireRole(['employer', 'admin']);

    // Get full user data from database
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, email: true, name: true, stripeCustomerId: true, role: true, currentTier: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has an active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Determine if user has active subscription
    let hasActiveSubscription = false;
    if (subscription) {
      const now = new Date();
      hasActiveSubscription = subscription.status === 'active' &&
        (!subscription.endDate || subscription.endDate > now);
    } else {
      // Check if user is on a paid tier (even without subscription record)
      const paidTiers = ['starter', 'professional', 'premium', 'enterprise'];
      hasActiveSubscription = paidTiers.includes(user.currentTier || '');
    }

    if (!hasActiveSubscription) {
      return NextResponse.json(
        {
          error: 'Active subscription required to purchase additional credits',
          code: 'SUBSCRIPTION_REQUIRED',
          redirectUrl: '/employers/pricing?message=subscription_required_for_credits'
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = buyCreditSchema.parse(body);

    // Get credit pack configuration
    const creditPackConfig = JOB_POSTING_CONFIG.creditPacks[validatedData.creditPack];
    if (!creditPackConfig) {
      return NextResponse.json(
        { error: 'Invalid credit pack selected' },
        { status: 400 }
      );
    }

    // For new credit pack keys, use dynamic pricing (will be set in Stripe)
    const isNewCreditPack = ['small', 'medium', 'large'].includes(validatedData.creditPack);
    const actualPrice = isNewCreditPack ? 0 : creditPackConfig.price; // Price will be determined by Stripe price ID

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session for credit pack only
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        {
          price: creditPackConfig.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment
      allow_promotion_codes: true,
      success_url: validatedData.successUrl || 
        `${process.env.NEXTAUTH_URL}/employers/dashboard?credit_purchase_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: validatedData.cancelUrl || 
        `${process.env.NEXTAUTH_URL}/employers/dashboard?credit_purchase_cancelled=true`,
      metadata: {
        userId: user.id,
        creditPack: validatedData.creditPack.toUpperCase(),
        type: 'credit_pack_purchase',
        totalAmount: actualPrice.toString(),
        jobCredits: creditPackConfig.credits.toString(),
      },
    });

    // Create pending purchase record
    await prisma.jobPostingPurchase.create({
      data: {
        userId: user.id,
        stripeSessionId: checkoutSession.id,
        tier: `credit_pack_${validatedData.creditPack}`,
        tierPrice: actualPrice,
        addons: [],
        totalAmount: actualPrice,
        status: 'pending',
        jobPostCredits: creditPackConfig.credits,
        featuredPostCredits: 0,
        socialGraphicCredits: 0,
        repostCredits: 0,
        // Set expiration (60 days from now)
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        metadata: {
          creditPackConfig: JSON.parse(JSON.stringify(creditPackConfig)),
          sessionMetadata: {
            userAgent: req.headers.get('user-agent'),
            ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      creditPack: validatedData.creditPack,
      credits: creditPackConfig.credits,
      price: actualPrice,
      totalAmount: actualPrice,
    });

  } catch (error) {
    console.error('Error creating credit purchase checkout session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
