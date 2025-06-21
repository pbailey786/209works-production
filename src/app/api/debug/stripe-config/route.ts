import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/components/ui/card';
import { JOB_POSTING_CONFIG, SUBSCRIPTION_TIERS_CONFIG, STRIPE_PRICE_IDS, validateStripeConfig, getStripePriceId } from '@/lib/stripe';


export async function GET(req: NextRequest) {
  try {
    // Check authentication - only allow admins to see this debug info
    await requireRole('admin');

    // Use the new validation function
    const validation = validateStripeConfig();
    
    // Check if all required environment variables are set
    const envCheck = {
      STRIPE_PUBLISHABLE_KEY: !!process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      
      // NEW: Updated environment variables that actually exist
      STRIPE_PRICE_STARTER: !!process.env.STRIPE_PRICE_STARTER,
      STRIPE_PRICE_STANDARD: !!process.env.STRIPE_PRICE_STANDARD, 
      STRIPE_PRICE_PID: !!process.env.STRIPE_PRICE_PID,
      
      // Addon price IDs
      STRIPE_PRICE_FEATURED: !!process.env.STRIPE_PRICE_FEATURED,
      STRIPE_PRICE_GRAPHIC: !!process.env.STRIPE_PRICE_GRAPHIC,
      STRIPE_PRICE_BOOST_PACK: !!process.env.STRIPE_PRICE_BOOST_PACK,

      // Credit pack price IDs
      STRIPE_PRICE_CREDIT_1: !!process.env.STRIPE_PRICE_CREDIT_1,
      STRIPE_PRICE_CREDIT_5: !!process.env.STRIPE_PRICE_CREDIT_5,
    };

    // Get the actual price IDs (masked for security) using the NEW environment variables
    const priceIds = {
      starter: getStripePriceId('starter') ? 
        `${getStripePriceId('starter')!.substring(0, 10)}...` : 'NOT SET',
      standard: getStripePriceId('standard') ?
        `${getStripePriceId('standard')!.substring(0, 10)}...` : 'NOT SET', 
      pro: getStripePriceId('pro') ?
        `${getStripePriceId('pro')!.substring(0, 10)}...` : 'NOT SET',
      featured: process.env.STRIPE_PRICE_FEATURED ?
        `${process.env.STRIPE_PRICE_FEATURED.substring(0, 10)}...` : 'NOT SET',
      graphic: process.env.STRIPE_PRICE_GRAPHIC ?
        `${process.env.STRIPE_PRICE_GRAPHIC.substring(0, 10)}...` : 'NOT SET',
      boostPack: process.env.STRIPE_PRICE_BOOST_PACK ?
        `${process.env.STRIPE_PRICE_BOOST_PACK.substring(0, 10)}...` : 'NOT SET',
      credit1: process.env.STRIPE_PRICE_CREDIT_1 ?
        `${process.env.STRIPE_PRICE_CREDIT_1.substring(0, 10)}...` : 'NOT SET',
      credit5: process.env.STRIPE_PRICE_CREDIT_5 ?
        `${process.env.STRIPE_PRICE_CREDIT_5.substring(0, 10)}...` : 'NOT SET',
    };

    // Check configuration validity
    const configCheck = {
      subscriptionTiersConfigured: Object.values(SUBSCRIPTION_TIERS_CONFIG).every(tier => tier.stripePriceId),
      addonsConfigured: Object.values(JOB_POSTING_CONFIG.addons).every(addon => addon.stripePriceId),
      creditPacksConfigured: Object.values(JOB_POSTING_CONFIG.creditPacks).every(pack => pack.stripePriceId),
    };

    const allEnvVarsSet = Object.values(envCheck).every(Boolean);

    return NextResponse.json({
      status: validation.isValid ? 'OK' : 'INCOMPLETE',
      validation,
      environmentVariables: envCheck,
      priceIds,
      configuration: configCheck,
      subscriptionConfig: {
        tiers: Object.entries(SUBSCRIPTION_TIERS_CONFIG).map(([key, tier]) => ({
          key,
          name: tier.name,
          monthlyPrice: tier.monthlyPrice,
          hasPriceId: !!tier.stripePriceId,
          features: tier.features,
          description: tier.description,
        })),
      },
      jobPostingConfig: {
        addons: Object.entries(JOB_POSTING_CONFIG.addons).map(([key, addon]) => ({
          key,
          name: addon.name,
          price: addon.price,
          hasPriceId: !!addon.stripePriceId,
          description: addon.description,
        })),
        creditPacks: Object.entries(JOB_POSTING_CONFIG.creditPacks).map(([key, pack]) => ({
          key,
          name: pack.name,
          price: pack.price,
          credits: pack.credits,
          hasPriceId: !!pack.stripePriceId,
          description: pack.description,
        })),
      },
      stripeConfig: {
        priceIds: STRIPE_PRICE_IDS,
      },
      recommendations: allEnvVarsSet ? [] : [
        'Set missing environment variables in Netlify dashboard',
        'Ensure all Stripe price IDs are correctly configured',
        'Test checkout flow in Stripe test mode',
      ],
    });

  } catch (error) {
    console.error('Error checking Stripe configuration:', error);
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    );
  }
}
