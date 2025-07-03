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

    const { purchaseId } = await req.json();

    if (!purchaseId) {
      return NextResponse.json(
        { error: 'purchaseId is required' },
        { status: 400 }
      );
    }

    // Get the pending purchase
    const purchase = await prisma.jobPostingPurchase.findFirst({
      where: { 
        id: purchaseId,
        userId: user.id,
        status: 'pending'
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Pending purchase not found' },
        { status: 404 }
      );
    }

    // Manually complete the purchase and create credits
    await prisma.$transaction(async (tx) => {
      // Update purchase status
      await tx.jobPostingPurchase.update({
        where: { id: purchase.id },
        data: { 
          status: 'completed',
          stripePaymentIntentId: 'manual_completion_test'
        },
      });

      // Calculate total credits (unified system)
      const totalCredits = (purchase.jobPostCredits || 0) + 
                          (purchase.featuredPostCredits || 0) + 
                          (purchase.socialGraphicCredits || 0);

      // Create universal credits
      const creditsToCreate = [];
      for (let i = 0; i < totalCredits; i++) {
        creditsToCreate.push({
          userId: user.id,
          purchaseId: purchase.id,
          type: 'universal',
          expiresAt: purchase.expiresAt,
        });
      }

      if (creditsToCreate.length > 0) {
        await tx.jobPostingCredit.createMany({
          data: creditsToCreate,
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Manually completed purchase and created ${(purchase.jobPostCredits || 0) + (purchase.featuredPostCredits || 0) + (purchase.socialGraphicCredits || 0)} credits`,
      purchaseId: purchase.id,
      creditsCreated: (purchase.jobPostCredits || 0) + (purchase.featuredPostCredits || 0) + (purchase.socialGraphicCredits || 0),
    });

  } catch (error) {
    console.error('Error manually completing purchase:', error);
    return NextResponse.json(
      { 
        error: 'Failed to complete purchase',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}