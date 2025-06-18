import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { prisma } from '@/lib/database/prisma';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';
import type { Session } from 'next-auth';

const purchaseSchema = z.object({
  addonId: z.string(),
  jobId: z.string().uuid().optional(),
  returnUrl: z.string().url().optional(),
});

// POST /api/addons/purchase - Create Stripe checkout for addon purchase
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = purchaseSchema.parse(body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, stripeCustomerId: true }
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Only employers can purchase addons' }, { status: 403 });
    }

    // Get addon details
    const addon = await prisma.addOn.findUnique({
      where: { id: validatedData.addonId }
    });

    if (!addon || !addon.isActive) {
      return NextResponse.json({ error: 'Addon not found or inactive' }, { status: 404 });
    }

    // Check if job exists (if jobId provided)
    if (validatedData.jobId) {
      const job = await prisma.job.findFirst({
        where: {
          id: validatedData.jobId,
          employerId: user.id
        }
      });

      if (!job) {
        return NextResponse.json({ error: 'Job not found or not owned by user' }, { status: 404 });
      }
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId || undefined,
      customer_email: user.stripeCustomerId ? undefined : session.user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: addon.name,
              description: addon.shortDescription || addon.description,
              metadata: {
                addonId: addon.id,
                category: addon.category
              }
            },
            unit_amount: Math.round(Number(addon.price) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: validatedData.returnUrl || `${process.env.NEXTAUTH_URL}/employers/dashboard?addon_success=true&addon=${addon.slug}`,
      cancel_url: validatedData.returnUrl || `${process.env.NEXTAUTH_URL}/employers/dashboard?addon_cancelled=true`,
      metadata: {
        userId: user.id,
        addonId: addon.id,
        jobId: validatedData.jobId || '',
        type: 'addon_purchase'
      },
      payment_intent_data: {
        metadata: {
          userId: user.id,
          addonId: addon.id,
          jobId: validatedData.jobId || '',
          type: 'addon_purchase'
        }
      }
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      addon: {
        id: addon.id,
        name: addon.name,
        price: addon.price
      }
    });

  } catch (error) {
    console.error('Error creating addon checkout:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// GET /api/addons/purchase - Get user's purchased addons
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Only employers can view purchased addons' }, { status: 403 });
    }

    // Get user's purchased addons
    const userAddons = await prisma.userAddOn.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      include: {
        AddOn: true
      },
      orderBy: {
        purchasedAt: 'desc'
      }
    });

    // Group by category and add usage info
    const groupedAddons = {
      promotion: userAddons.filter(ua => ua.AddOn.category === 'marketing').map(ua => ({
        id: ua.id,
        addon: ua.AddOn,
        purchasedAt: ua.purchasedAt,
        pricePaid: ua.pricePaid,
        usageData: ua.usageData,
        expiresAt: ua.expiresAt,
        canUse: !ua.expiresAt || ua.expiresAt > new Date()
      })),
      jobPosts: userAddons.filter(ua => ua.AddOn.category === 'recruitment_tools').map(ua => ({
        id: ua.id,
        addon: ua.AddOn,
        purchasedAt: ua.purchasedAt,
        pricePaid: ua.pricePaid,
        usageData: ua.usageData,
        expiresAt: ua.expiresAt,
        remainingUses: calculateRemainingUses(ua)
      }))
    };

    return NextResponse.json({
      success: true,
      addons: groupedAddons,
      totalPurchased: userAddons.length
    });

  } catch (error) {
    console.error('Error fetching purchased addons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchased addons' },
      { status: 500 }
    );
  }
}

// Helper function to calculate remaining uses for job post addons
function calculateRemainingUses(userAddon: any): number {
  const addon = userAddon.AddOn;
  const usageData = userAddon.usageData as any;
  
  if (addon.category !== 'recruitment_tools') {
    return 0;
  }

  const totalJobsAdded = addon.usageLimits?.jobPostsAdded || 0;
  const usedJobs = usageData?.jobPostsUsed || 0;
  
  return Math.max(0, totalJobsAdded - usedJobs);
}
