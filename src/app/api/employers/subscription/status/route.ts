import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication with Clerk
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: clerkUser.emailAddresses[0].emailAddress },
      select: { 
        id: true, 
        role: true,
        currentTier: true,
        subscriptionEndsAt: true,
        stripeCustomerId: true
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For now, we're using a credit-based system, not subscriptions
    // Return basic subscription info
    return NextResponse.json({
      subscriptionStatus: 'active', // We don't use subscriptions, always active
      currentTier: user.currentTier || 'basic',
      subscriptionEndsAt: user.subscriptionEndsAt,
      hasStripeCustomer: !!user.stripeCustomerId,
      paymentModel: 'credits', // Indicate we use credits, not subscriptions
      message: 'Using credit-based billing model'
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}