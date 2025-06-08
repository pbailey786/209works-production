import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { JOB_POSTING_CONFIG } from '@/lib/stripe';
import type { Session } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    // Check authentication - only allow admins to see this debug info
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if all required environment variables are set
    const envCheck = {
      STRIPE_PUBLISHABLE_KEY: !!process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      
      // Tier price IDs
      STRIPE_PRICE_STARTER: !!process.env.STRIPE_PRICE_STARTER,
      STRIPE_PRICE_STANDARD: !!process.env.STRIPE_PRICE_STANDARD,
      STRIPE_PRICE_PRO: !!process.env.STRIPE_PRICE_PRO,
      
      // Addon price IDs
      STRIPE_PRICE_FEATURED: !!process.env.STRIPE_PRICE_FEATURED,
      STRIPE_PRICE_GRAPHIC: !!process.env.STRIPE_PRICE_GRAPHIC,
      STRIPE_PRICE_BOOST_PACK: !!process.env.STRIPE_PRICE_BOOST_PACK,

      // Credit pack price IDs
      STRIPE_PRICE_CREDIT_1: !!process.env.STRIPE_PRICE_CREDIT_1,
      STRIPE_PRICE_CREDIT_5: !!process.env.STRIPE_PRICE_CREDIT_5,
    };

    // Get the actual price IDs (masked for security)
    const priceIds = {
      starter: process.env.STRIPE_PRICE_STARTER ? 
        `${process.env.STRIPE_PRICE_STARTER.substring(0, 10)}...` : 'NOT SET',
      standard: process.env.STRIPE_PRICE_STANDARD ? 
        `${process.env.STRIPE_PRICE_STANDARD.substring(0, 10)}...` : 'NOT SET',
      pro: process.env.STRIPE_PRICE_PRO ? 
        `${process.env.STRIPE_PRICE_PRO.substring(0, 10)}...` : 'NOT SET',
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
      tiersConfigured: Object.values(JOB_POSTING_CONFIG.tiers).every(tier => tier.stripePriceId),
      addonsConfigured: Object.values(JOB_POSTING_CONFIG.addons).every(addon => addon.stripePriceId),
    };

    const allEnvVarsSet = Object.values(envCheck).every(Boolean);

    return NextResponse.json({
      status: allEnvVarsSet ? 'OK' : 'INCOMPLETE',
      environmentVariables: envCheck,
      priceIds,
      configuration: configCheck,
      jobPostingConfig: {
        tiers: Object.entries(JOB_POSTING_CONFIG.tiers).map(([key, tier]) => ({
          key,
          name: tier.name,
          price: tier.price,
          hasPriceId: !!tier.stripePriceId,
          features: tier.features,
        })),
        addons: Object.entries(JOB_POSTING_CONFIG.addons).map(([key, addon]) => ({
          key,
          name: addon.name,
          price: addon.price,
          hasPriceId: !!addon.stripePriceId,
          description: addon.description,
        })),
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
