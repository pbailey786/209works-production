import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { JOB_POSTING_CONFIG } from '@/lib/stripe';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

const checkoutSchema = z.object({
  tier: z.enum(['starter', 'standard', 'pro']),
  addons: z.array(z.enum(['featuredPost', 'socialGraphic', 'repostJob', 'featureAndSocialBundle'])).optional().default([]),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true, stripeCustomerId: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'employer') {
      return NextResponse.json(
        { error: 'Only employers can purchase job posting packages' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = checkoutSchema.parse(body);

    // Get tier configuration
    const tierConfig = JOB_POSTING_CONFIG.tiers[validatedData.tier];
    if (!tierConfig) {
      return NextResponse.json(
        { error: 'Invalid tier selected' },
        { status: 400 }
      );
    }

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

    // Build line items for checkout
    const lineItems = [
      {
        price: tierConfig.stripePriceId,
        quantity: 1,
      },
    ];

    // Add addon line items
    let totalAddonPrice = 0;
    const selectedAddons = [];
    for (const addonKey of validatedData.addons) {
      const addon = JOB_POSTING_CONFIG.addons[addonKey];
      if (addon) {
        lineItems.push({
          price: addon.stripePriceId,
          quantity: 1,
        });
        totalAddonPrice += addon.price;
        selectedAddons.push({
          key: addonKey,
          name: addon.name,
          price: addon.price,
          stripePriceId: addon.stripePriceId,
        });
      }
    }

    const totalAmount = tierConfig.price + totalAddonPrice;

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: lineItems,
      mode: 'payment', // One-time payment, not subscription
      allow_promotion_codes: true,
      success_url: validatedData.successUrl || 
        `${process.env.NEXTAUTH_URL}/employers/dashboard?purchase_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: validatedData.cancelUrl || 
        `${process.env.NEXTAUTH_URL}/employers/dashboard?purchase_cancelled=true`,
      metadata: {
        userId: user.id,
        tier: validatedData.tier,
        addons: JSON.stringify(selectedAddons),
        type: 'job_posting_purchase',
        totalAmount: totalAmount.toString(),
      },
    });

    // Create pending purchase record
    await prisma.jobPostingPurchase.create({
      data: {
        userId: user.id,
        stripeSessionId: checkoutSession.id,
        tier: validatedData.tier,
        tierPrice: tierConfig.price,
        addons: selectedAddons,
        totalAmount: totalAmount,
        status: 'pending',
        // Calculate credits based on tier
        jobPostCredits: tierConfig.features.jobPosts,
        featuredPostCredits: tierConfig.features.featuredPosts || 0,
        socialGraphicCredits: selectedAddons.filter(a => 
          a.key === 'socialGraphic' || a.key === 'featureAndSocialBundle'
        ).length,
        repostCredits: selectedAddons.filter(a => a.key === 'repostJob').length,
        // Set expiration (90 days from now)
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        metadata: {
          tierConfig,
          selectedAddons,
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
      tier: validatedData.tier,
      addons: selectedAddons,
      totalAmount,
    });

  } catch (error) {
    console.error('Error creating job posting checkout session:', error);
    
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
