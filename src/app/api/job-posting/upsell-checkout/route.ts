import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import type { Session } from 'next-auth';
import { prisma } from '@/lib/database/prisma';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';

const upsellCheckoutSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  upsells: z.object({
    socialMediaShoutout: z.boolean(),
    placementBump: z.boolean(),
    upsellBundle: z.boolean(),
    total: z.number().min(0),
  }),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, stripeCustomerId: true, name: true, email: true },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json(
        { error: 'Employer access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = upsellCheckoutSchema.parse(body);

    // Verify the job exists and belongs to the user
    const job = await prisma.job.findFirst({
      where: {
        id: validatedData.jobId,
        companyId: user.id,
      },
      select: { id: true, title: true, company: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or access denied' },
        { status: 404 }
      );
    }

    // If no upsells selected, return success without creating checkout
    if (validatedData.upsells.total === 0) {
      return NextResponse.json({
        success: true,
        message: 'No upsells selected',
        url: validatedData.successUrl || `${process.env.NEXTAUTH_URL}/employers/my-jobs`,
      });
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

    // Build line items for upsells
    const lineItems = [];
    
    if (validatedData.upsells.upsellBundle) {
      // Complete bundle
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Complete Promotion Bundle',
            description: `Social Media Shoutout + On-Site Placement Bump for "${job.title}"`,
            metadata: {
              jobId: job.id,
              upsellType: 'complete_bundle',
            },
          },
          unit_amount: 8500, // $85.00
        },
        quantity: 1,
      });
    } else {
      // Individual upsells
      if (validatedData.upsells.socialMediaShoutout) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Social Media Shoutout',
              description: `Promote "${job.title}" on Instagram and X (Twitter)`,
              metadata: {
                jobId: job.id,
                upsellType: 'social_media',
              },
            },
            unit_amount: 4900, // $49.00
          },
          quantity: 1,
        });
      }

      if (validatedData.upsells.placementBump) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'On-Site Placement Bump',
              description: `JobsGPT actively promotes "${job.title}" to chat users`,
              metadata: {
                jobId: job.id,
                upsellType: 'placement_bump',
              },
            },
            unit_amount: 4900, // $49.00
          },
          quantity: 1,
        });
      }
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: lineItems,
      mode: 'payment',
      allow_promotion_codes: true,
      success_url: validatedData.successUrl || 
        `${process.env.NEXTAUTH_URL}/employers/my-jobs?upsell_success=true&job_id=${job.id}`,
      cancel_url: validatedData.cancelUrl || 
        `${process.env.NEXTAUTH_URL}/employers/my-jobs?upsell_cancelled=true&job_id=${job.id}`,
      metadata: {
        userId: user.id,
        jobId: job.id,
        type: 'job_upsell_purchase',
        socialMediaShoutout: validatedData.upsells.socialMediaShoutout.toString(),
        placementBump: validatedData.upsells.placementBump.toString(),
        upsellBundle: validatedData.upsells.upsellBundle.toString(),
        totalAmount: validatedData.upsells.total.toString(),
      },
    });

    // Create pending upsell purchase record
    await prisma.jobUpsellPurchase.create({
      data: {
        userId: user.id,
        jobId: job.id,
        stripeSessionId: checkoutSession.id,
        socialMediaShoutout: validatedData.upsells.socialMediaShoutout,
        placementBump: validatedData.upsells.placementBump,
        upsellBundle: validatedData.upsells.upsellBundle,
        totalAmount: validatedData.upsells.total,
        status: 'pending',
        metadata: {
          jobTitle: job.title,
          company: job.company,
          sessionMetadata: {
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error('Error creating upsell checkout session:', error);

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
