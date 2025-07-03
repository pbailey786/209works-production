import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function POST(req: NextRequest) {
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
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all pending purchases for this user
    const pendingPurchases = await prisma.jobPostingPurchase.findMany({
      where: { 
        userId: user.id,
        status: 'pending'
      },
      orderBy: { purchasedAt: 'desc' }
    });

    if (pendingPurchases.length === 0) {
      return NextResponse.json({
        message: 'No pending purchases found',
        fixed: 0
      });
    }

    const results = [];

    // Process each pending purchase
    for (const purchase of pendingPurchases) {
      try {
        await prisma.$transaction(async (tx) => {
          // Update purchase status
          await tx.jobPostingPurchase.update({
            where: { id: purchase.id },
            data: { 
              status: 'completed',
              stripePaymentIntentId: 'manual_fix_' + Date.now()
            },
          });

          // For subscription tiers, create universal credits directly based on tier
          let creditsToCreate = 0;
          
          if (purchase.tier === 'starter') {
            creditsToCreate = 3;
          } else if (purchase.tier === 'standard') {
            creditsToCreate = 6;
          } else if (purchase.tier === 'pro') {
            creditsToCreate = 12;
          } else {
            // For credit packs, use the existing jobPostCredits value
            creditsToCreate = (purchase.jobPostCredits || 0) + 
                             (purchase.featuredPostCredits || 0) + 
                             (purchase.socialGraphicCredits || 0);
          }

          // Create universal credits
          const credits = [];
          for (let i = 0; i < creditsToCreate; i++) {
            credits.push({
              userId: user.id,
              purchaseId: purchase.id,
              type: 'universal',
              expiresAt: purchase.expiresAt,
            });
          }

          if (credits.length > 0) {
            await tx.jobPostingCredit.createMany({
              data: credits,
            });
          }

          results.push({
            purchaseId: purchase.id,
            tier: purchase.tier,
            creditsCreated: creditsToCreate,
            purchasedAt: purchase.purchasedAt
          });
        });
      } catch (error) {
        console.error(`Error fixing purchase ${purchase.id}:`, error);
        results.push({
          purchaseId: purchase.id,
          tier: purchase.tier,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Fixed ${results.filter(r => !r.error).length} of ${pendingPurchases.length} pending purchases`,
      results,
      totalCreditsCreated: results.reduce((sum, r) => sum + ('creditsCreated' in r ? (r as any).creditsCreated : 0), 0)
    });

  } catch (error) {
    console.error('Error fixing pending purchases:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix pending purchases',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}