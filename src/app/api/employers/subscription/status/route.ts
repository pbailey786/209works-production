import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

// GET /api/employers/subscription/status - Check user's subscription status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're an employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        role: true,
        currentTier: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
      },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user has an active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Determine if user has active subscription
    let hasActiveSubscription = false;
    let subscriptionDetails = null;

    if (subscription) {
      // Check if subscription is still active
      const now = new Date();
      const isActive = subscription.status === 'active' && 
        (!subscription.endDate || subscription.endDate > now);
      
      hasActiveSubscription = isActive;
      
      if (isActive) {
        subscriptionDetails = {
          tier: subscription.tier,
          status: subscription.status,
          endDate: subscription.endDate,
          billingCycle: subscription.billingCycle,
        };
      }
    } else {
      // Check if user is on a paid tier (even without subscription record)
      const paidTiers = ['starter', 'professional', 'premium', 'enterprise'];
      hasActiveSubscription = paidTiers.includes(user.currentTier);
      
      if (hasActiveSubscription) {
        subscriptionDetails = {
          tier: user.currentTier,
          status: 'active',
          endDate: user.subscriptionEndsAt,
          billingCycle: 'monthly', // default
        };
      }
    }

    // Check trial status
    const isInTrial = user.trialEndsAt && user.trialEndsAt > new Date();

    return NextResponse.json({
      success: true,
      hasActiveSubscription,
      isInTrial,
      currentTier: user.currentTier,
      subscription: subscriptionDetails,
      message: hasActiveSubscription 
        ? 'Active subscription found' 
        : 'No active subscription. Upgrade to access premium features.',
    });

  } catch (error) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}
