import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

// Credit packages available for purchase
const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    jobCredits: 5,
    featuredCredits: 1,
    price: 2500, // $25.00 in cents
    description: 'Perfect for small businesses',
  },
  professional: {
    id: 'professional',
    name: 'Professional Pack',
    jobCredits: 15,
    featuredCredits: 3,
    price: 5000, // $50.00 in cents
    description: 'Great for growing companies',
    popular: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Pack',
    jobCredits: 50,
    featuredCredits: 10,
    price: 15000, // $150.00 in cents
    description: 'For large organizations',
  },
  bulk: {
    id: 'bulk',
    name: 'Bulk Credits',
    jobCredits: 100,
    featuredCredits: 20,
    price: 25000, // $250.00 in cents
    description: 'Maximum value pack',
  },
};

const purchaseSchema = z.object({
  packageId: z.enum(['starter', 'professional', 'enterprise', 'bulk']),
  quantity: z.number().min(1).max(10).default(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// POST /api/employers/credits/purchase - Create Stripe checkout session (prep)
export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin" } } // Mock session as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're an employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, email: true, name: true },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = purchaseSchema.parse(body);

    const selectedPackage = CREDIT_PACKAGES[validatedData.packageId];
    if (!selectedPackage) {
      return NextResponse.json({ error: 'Invalid package selected' }, { status: 400 });
    }

    // Calculate total cost
    const totalPrice = selectedPackage.price * validatedData.quantity;
    const totalJobCredits = selectedPackage.jobCredits * validatedData.quantity;
    const totalFeaturedCredits = selectedPackage.featuredCredits * validatedData.quantity;

    // For now, we'll return the purchase details without creating actual Stripe session
    // This is the prep work - Stripe integration will be added later
    const purchaseDetails = {
      packageId: validatedData.packageId,
      packageName: selectedPackage.name,
      quantity: validatedData.quantity,
      unitPrice: selectedPackage.price,
      totalPrice,
      jobCredits: totalJobCredits,
      featuredCredits: totalFeaturedCredits,
      description: selectedPackage.description,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
    };

    // Log the purchase intent
    await prisma.auditLog
      .create({
        data: {
          userId: user.id,
          action: 'credit_purchase_initiated',
          resource: 'credit_purchase',
          resourceId: `${validatedData.packageId}_${Date.now()}`,
          details: {
            packageId: validatedData.packageId,
            packageName: selectedPackage.name,
            quantity: validatedData.quantity,
            totalPrice,
            jobCredits: totalJobCredits,
            featuredCredits: totalFeaturedCredits,
            initiatedAt: new Date().toISOString(),
          },
        },
      })
      .catch(error => {
        console.error('Failed to log credit purchase intent:', error);
      });

    // TODO: When ready to integrate Stripe, this is where we would create the checkout session
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const checkoutSession = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [{
    //     price_data: {
    //       currency: 'usd',
    //       product_data: {
    //         name: `${selectedPackage.name} x${validatedData.quantity}`,
    //         description: selectedPackage.description,
    //       },
    //       unit_amount: selectedPackage.price,
    //     },
    //     quantity: validatedData.quantity,
    //   }],
    //   mode: 'payment',
    //   success_url: validatedData.successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/employers/dashboard?purchase=success`,
    //   cancel_url: validatedData.cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/employers/dashboard?purchase=cancelled`,
    //   customer_email: user.email,
    //   metadata: {
    //     userId: user.id,
    //     packageId: validatedData.packageId,
    //     quantity: validatedData.quantity.toString(),
    //     jobCredits: totalJobCredits.toString(),
    //     featuredCredits: totalFeaturedCredits.toString(),
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'Purchase details prepared (Stripe integration pending)',
      purchaseDetails,
      // When Stripe is integrated, return this:
      // checkoutUrl: checkoutSession.url,
      // sessionId: checkoutSession.id,
      
      // For now, return mock checkout URL
      checkoutUrl: `/employers/credits/checkout?package=${validatedData.packageId}&quantity=${validatedData.quantity}`,
      sessionId: `mock_session_${Date.now()}`,
    });
  } catch (error) {
    console.error('Error preparing credit purchase:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid purchase data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to prepare purchase' },
      { status: 500 }
    );
  }
}

// GET /api/employers/credits/purchase - Get available credit packages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're an employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      packages: Object.values(CREDIT_PACKAGES),
      currency: 'USD',
      note: 'Stripe integration pending - these are the available packages',
    });
  } catch (error) {
    console.error('Error fetching credit packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit packages' },
      { status: 500 }
    );
  }
}
