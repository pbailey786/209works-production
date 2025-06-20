import { NextRequest, NextResponse } from '@/components/ui/card';
import { requireRole } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

// GET /api/employers/subscription/status - Check user's subscription status
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking subscription status...');

    // Check authentication using modern session validator
    const { user: authUser } = await requireRole(['employer', 'admin']);

    console.log('✅ Auth successful for user:', authUser.id);

    // Get full user data with subscription info
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        role: true,
        currentTier: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

  } catch (error: any) {
    console.error('💥 Error checking subscription status:', error);

    // Handle authentication errors specifically
    if (error.statusCode === 401) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    if (error.statusCode === 403) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to check subscription status', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
