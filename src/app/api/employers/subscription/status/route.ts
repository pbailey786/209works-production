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

    // Check if user has any active subscriptions in the database
    let hasActiveSubscription = false;
    let subscriptionTier = null;
    
    if (user.stripeCustomerId) {
      // Check for active job posting purchases that represent subscriptions
      const activeSubscription = await prisma.jobPostingPurchase.findFirst({
        where: {
          userId: user.id,
          status: 'completed',
          tier: { in: ['starter', 'standard', 'pro'] },
          expiresAt: { gt: new Date() },
        },
        orderBy: { purchasedAt: 'desc' },
      });

      if (activeSubscription) {
        hasActiveSubscription = true;
        subscriptionTier = activeSubscription.tier;
      }
    }

    return NextResponse.json({
      subscriptionStatus: hasActiveSubscription ? 'active' : 'inactive',
      currentTier: subscriptionTier || user.currentTier || 'none',
      subscriptionEndsAt: user.subscriptionEndsAt,
      hasStripeCustomer: !!user.stripeCustomerId,
      paymentModel: 'subscription_plus_credits', // Updated to reflect new model
      message: hasActiveSubscription 
        ? `Active ${subscriptionTier} subscription`
        : 'No active subscription - purchase a plan to get monthly credits'
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}