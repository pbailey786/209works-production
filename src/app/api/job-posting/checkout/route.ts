import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { stripe } from '@/lib/stripe';
import { JOB_POSTING_CONFIG, SUBSCRIPTION_TIERS_CONFIG } from '@/lib/stripe';
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
          name: SUBSCRIPTION_TIERS_CONFIG.starter.name,
          monthlyPrice: SUBSCRIPTION_TIERS_CONFIG.starter.monthlyPrice,
          hasPriceId: !!SUBSCRIPTION_TIERS_CONFIG.starter.stripePriceId,
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

    if (validatedData.tier && typeof validatedData.tier === 'string') {
      tierConfig = SUBSCRIPTION_TIERS_CONFIG[validatedData.tier as keyof typeof SUBSCRIPTION_TIERS_CONFIG];
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

      basePrice = tierConfig.monthlyPrice;
      jobCredits = tierConfig.features.credits || (tierConfig.features as any).jobPosts || 0; // Support both new and legacy field names
    } else if (validatedData.creditPack && typeof validatedData.creditPack === 'string') {
      creditPackConfig = JOB_POSTING_CONFIG.creditPacks[validatedData.creditPack as keyof typeof JOB_POSTING_CONFIG.creditPacks];
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
      if (typeof addonKey === 'string') {
        const addon = JOB_POSTING_CONFIG.addons[addonKey as keyof typeof JOB_POSTING_CONFIG.addons];
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

    // Create checkout session with error handling for price type mismatch
    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.create({
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
    } catch (stripeError: any) {
      console.error('❌ Stripe checkout error:', stripeError);

      // Check if the error is due to using recurring price in payment mode
      if (stripeError.message?.includes('recurring price') || stripeError.message?.includes('subscription mode')) {
        console.log('🔄 Detected recurring price error, creating dynamic one-time prices...');

        // Create dynamic one-time prices for the items
        const dynamicLineItems = [];

        for (const item of lineItems) {
          const originalPriceId = item.price;

          // Get the price details to create a one-time equivalent
          let priceAmount = 0;
          let productName = '';

          // Check if this is a dynamic price ID (fallback)
          if (originalPriceId?.startsWith('price_dynamic_')) {
            if (tierConfig && tierConfig.stripePriceId === originalPriceId) {
              priceAmount = tierConfig.monthlyPrice * 100; // Convert to cents
              productName = tierConfig.name;
            } else if (creditPackConfig && creditPackConfig.stripePriceId === originalPriceId) {
              priceAmount = creditPackConfig.price * 100;
              productName = creditPackConfig.name;
            } else {
              // Find in addons
              const addon = Object.values(JOB_POSTING_CONFIG.addons).find(a => a.stripePriceId === originalPriceId);
              if (addon) {
                priceAmount = addon.price * 100;
                productName = addon.name;
              }
            }
          } else if (originalPriceId && typeof originalPriceId === 'string') {
            // Try to get price from Stripe and convert to one-time
            try {
              const stripePrice = await stripe.prices.retrieve(originalPriceId);
              priceAmount = stripePrice.unit_amount || 0;

              if (stripePrice.product && typeof stripePrice.product === 'string') {
                const product = await stripe.products.retrieve(stripePrice.product);
                productName = product.name || 'Product';
              } else if (typeof stripePrice.product === 'object' && stripePrice.product && 'name' in stripePrice.product) {
                productName = (stripePrice.product as any).name || 'Product';
              }
            } catch (priceError) {
              console.error('❌ Error retrieving price from Stripe:', priceError);
              // Fallback to config values
              if (tierConfig && tierConfig.stripePriceId === originalPriceId) {
                priceAmount = tierConfig.monthlyPrice * 100;
                productName = tierConfig.name;
              } else if (creditPackConfig && creditPackConfig.stripePriceId === originalPriceId) {
                priceAmount = creditPackConfig.price * 100;
                productName = creditPackConfig.name;
              } else {
                const addon = Object.values(JOB_POSTING_CONFIG.addons).find(a => a.stripePriceId === originalPriceId);
                if (addon) {
                  priceAmount = addon.price * 100;
                  productName = addon.name;
                }
              }
            }
          }

          if (priceAmount > 0 && productName) {
            // Create a dynamic one-time price
            const dynamicPrice = await stripe.prices.create({
              unit_amount: priceAmount,
              currency: 'usd',
              product_data: {
                name: productName,
              },
            });

            dynamicLineItems.push({
              price: dynamicPrice.id,
              quantity: item.quantity,
            });

            console.log(`✅ Created dynamic price for ${productName}: $${priceAmount / 100}`);
          } else {
            console.error(`❌ Could not determine price for item: ${originalPriceId}`);
          }
        }

        // Retry checkout with dynamic prices
        checkoutSession = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          billing_address_collection: 'required',
          line_items: dynamicLineItems,
          mode: checkoutMode,
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
            dynamicPrices: 'true',
          },
        });

        console.log('✅ Successfully created checkout with dynamic one-time prices');
      } else {
        // Re-throw other Stripe errors
        throw stripeError;
      }
    }

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
        // Calculate credits based on tier or credit pack (unified system)
        jobPostCredits: jobCredits, // This will be migrated to universal credits
        featuredPostCredits: 0, // Legacy field - featured posts now use universal credits
        socialGraphicCredits: 0, // Legacy field - social graphics now use universal credits
        repostCredits: 0, // Removed repost functionality
        // Set expiration (30 days from now - standardized duration)
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: {
          tierConfig: tierConfig ? JSON.parse(JSON.stringify(tierConfig)) : null,
          creditPackConfig: creditPackConfig ? JSON.parse(JSON.stringify(creditPackConfig)) : null,
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
