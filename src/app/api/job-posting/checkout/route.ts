import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { stripe } from '@/lib/stripe';
import { JOB_POSTING_CONFIG } from '@/lib/stripe';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
import type { Session } from 'next-auth';

const checkoutSchema = z.object({
  tier: z.enum(['starter', 'standard', 'pro']).optional(),
  addons: z.array(z.enum(['featuredPost', 'socialGraphic', 'featureAndSocialBundle'])).optional().default([]),
  creditPack: z.enum(['singleCredit', 'fiveCredits']).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
}).refine(data => data.tier || data.creditPack, {
  message: "Either tier or creditPack must be specified"
});

// Simple GET endpoint to test configuration
export async function GET() {
  try {
    return NextResponse.json({
      status: 'API route working',
      timestamp: new Date().toISOString(),
      configLoaded: !!JOB_POSTING_CONFIG,
      envVarsSet: {
        STRIPE_PRICE_STARTER: !!process.env.STRIPE_PRICE_STARTER,
        STRIPE_PRICE_STANDARD: !!process.env.STRIPE_PRICE_STANDARD,
        STRIPE_PRICE_PRO: !!process.env.STRIPE_PRICE_PRO,
      },
      tierConfig: {
        starter: {
          name: JOB_POSTING_CONFIG.tiers.starter.name,
          price: JOB_POSTING_CONFIG.tiers.starter.price,
          hasPriceId: !!JOB_POSTING_CONFIG.tiers.starter.stripePriceId,
        }
      }
    });
  } catch (error) {
    console.error('GET /api/job-posting/checkout error:', error);
    return NextResponse.json(
      { error: 'Configuration test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log('🛒 Job posting checkout API called - START');

  // Test imports first
  try {
    console.log('🔧 Testing imports...');
    console.log('🔧 authOptions:', typeof authOptions);
    console.log('🔧 stripe:', typeof stripe);
    console.log('🔧 JOB_POSTING_CONFIG:', typeof JOB_POSTING_CONFIG);
    console.log('🔧 prisma:', typeof prisma);
    console.log('🔧 z:', typeof z);
  } catch (importError) {
    console.error('❌ Import error:', importError);
    return NextResponse.json(
      { error: 'Import error', details: importError instanceof Error ? importError.message : 'Unknown' },
      { status: 500 }
    );
  }

  try {
    console.log('🛒 Job posting checkout API called - INSIDE TRY');
    console.log('🔧 Environment check - STRIPE_PRICE_STARTER:', !!process.env.STRIPE_PRICE_STARTER);
    console.log('🔧 JOB_POSTING_CONFIG loaded:', !!JOB_POSTING_CONFIG);

    // Check authentication
    const session = (await getServerSession(authOptions)) as Session | null;
    console.log('🔐 Session check:', !!session, session?.user?.email);

    if (!session?.user?.email) {
      console.log('❌ No session or email found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    console.log('🔍 Looking up user:', session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true, stripeCustomerId: true, role: true },
    });
    console.log('👤 User found:', !!user, user?.role);

    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'employer') {
      console.log('❌ User is not an employer:', user.role);
      return NextResponse.json(
        { error: 'Only employers can purchase job posting packages' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    console.log('📦 Request body:', body);
    const validatedData = checkoutSchema.parse(body);
    console.log('✅ Validated data:', validatedData);

    // Determine if this is a tier purchase or credit pack purchase
    let tierConfig = null;
    let creditPackConfig = null;
    let basePrice = 0;
    let jobCredits = 0;

    if (validatedData.tier) {
      tierConfig = JOB_POSTING_CONFIG.tiers[validatedData.tier];
      console.log('🎯 Tier config:', tierConfig);
      console.log('💰 Stripe Price ID:', tierConfig?.stripePriceId);

      if (!tierConfig) {
        console.log('❌ Invalid tier config');
        return NextResponse.json(
          { error: 'Invalid tier selected' },
          { status: 400 }
        );
      }

      if (!tierConfig.stripePriceId) {
        console.log('❌ Missing Stripe Price ID for tier:', validatedData.tier);
        return NextResponse.json(
          { error: `Stripe price not configured for tier: ${validatedData.tier}` },
          { status: 500 }
        );
      }

      basePrice = tierConfig.price;
      jobCredits = tierConfig.features.jobPosts;
    } else if (validatedData.creditPack) {
      creditPackConfig = JOB_POSTING_CONFIG.creditPacks[validatedData.creditPack];
      console.log('📦 Credit pack config:', creditPackConfig);
      console.log('💰 Stripe Price ID:', creditPackConfig?.stripePriceId);

      if (!creditPackConfig) {
        console.log('❌ Invalid credit pack config');
        return NextResponse.json(
          { error: 'Invalid credit pack selected' },
          { status: 400 }
        );
      }

      if (!creditPackConfig.stripePriceId) {
        console.log('❌ Missing Stripe Price ID for credit pack:', validatedData.creditPack);
        return NextResponse.json(
          { error: `Stripe price not configured for credit pack: ${validatedData.creditPack}` },
          { status: 500 }
        );
      }

      basePrice = creditPackConfig.price;
      jobCredits = creditPackConfig.credits;
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;

    // If user has a stored customer ID, verify it exists in Stripe
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
        console.log(`✅ Existing Stripe customer found: ${customerId}`);
      } catch (error) {
        console.log(`❌ Stored customer ID ${customerId} not found in Stripe, creating new customer`);
        customerId = null; // Reset to create a new customer
      }
    }

    // Create new customer if none exists or stored one is invalid
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      console.log(`✅ Created new Stripe customer: ${customerId}`);

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Build line items for checkout
    const lineItems = [];

    // Add tier or credit pack as base item
    if (tierConfig) {
      lineItems.push({
        price: tierConfig.stripePriceId,
        quantity: 1,
      });
    } else if (creditPackConfig) {
      lineItems.push({
        price: creditPackConfig.stripePriceId,
        quantity: 1,
      });
    }

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

    const totalAmount = basePrice + totalAddonPrice;

    // Determine checkout mode based on what's being purchased
    // All job posting purchases are one-time payments (not subscriptions)
    // This includes tiers, credit packs, and addons
    const checkoutMode = 'payment';

    console.log('🔄 Checkout mode:', checkoutMode);
    console.log('📦 Purchase type:', 'One-time Payment (Tier/Credits/Addons)');
    console.log('💰 Total amount calculated:', totalAmount);
    console.log('📋 Line items:', lineItems);

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: lineItems,
      mode: checkoutMode, // Always 'payment' for one-time job posting purchases
      allow_promotion_codes: true,
      success_url: validatedData.successUrl || 
        `${process.env.NEXTAUTH_URL}/employers/dashboard?purchase_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: validatedData.cancelUrl || 
        `${process.env.NEXTAUTH_URL}/employers/dashboard?purchase_cancelled=true`,
      metadata: {
        userId: user.id,
        tier: validatedData.tier?.toUpperCase() || '',
        creditPack: validatedData.creditPack?.toUpperCase() || '',
        addons: selectedAddons.map(a => a.key.toUpperCase()).join(','),
        type: 'job_posting_purchase',
        totalAmount: totalAmount.toString(),
        jobCredits: jobCredits.toString(),
        featuredCredits: selectedAddons.filter(a =>
          a.key === 'featuredPost' || a.key === 'featureAndSocialBundle'
        ).length.toString(),
        socialCredits: selectedAddons.filter(a =>
          a.key === 'socialGraphic' || a.key === 'featureAndSocialBundle'
        ).length.toString(),
      },
    });

    // Create pending purchase record
    await prisma.jobPostingPurchase.create({
      data: {
        userId: user.id,
        stripeSessionId: checkoutSession.id,
        tier: validatedData.tier || (validatedData.creditPack ? `credit_pack_${validatedData.creditPack}` : ''),
        tierPrice: basePrice,
        addons: selectedAddons,
        totalAmount: totalAmount,
        status: 'pending',
        // Calculate credits based on tier or credit pack
        jobPostCredits: jobCredits,
        featuredPostCredits: ((tierConfig?.features as any)?.featuredPosts || 0) + selectedAddons.filter(a =>
          a.key === 'featuredPost' || a.key === 'featureAndSocialBundle'
        ).length,
        socialGraphicCredits: selectedAddons.filter(a =>
          a.key === 'socialGraphic' || a.key === 'featureAndSocialBundle'
        ).length,
        repostCredits: 0, // Removed repost functionality
        // Set expiration (30 days from now - standardized duration)
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: {
          tierConfig,
          creditPackConfig,
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
      creditPack: validatedData.creditPack,
      addons: selectedAddons,
      totalAmount,
      jobCredits,
    });

  } catch (error) {
    console.error('❌ Error creating job posting checkout session:', error);
    console.error('❌ Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'Unknown');

    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation error:', error.errors);
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
