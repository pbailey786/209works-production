import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database/prisma';

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        error: 'Test endpoints are disabled in production for security reasons',
        message: 'Please use proper credit purchase flow via /api/job-posting/buy-credits'
      }, { status: 403 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { creditType = 'universal', count = 5 } = await req.json();

    // Create a test purchase record
    const purchase = await prisma.jobPostingPurchase.create({
      data: {
        userId,
        stripeSessionId: `test_${Date.now()}_${userId}`,
        tier: 'test_credits',
        tierPrice: 0,
        addons: [],
        totalAmount: 0,
        status: 'completed',
        jobPostCredits: creditType === 'job_post' ? count : 0,
        featuredPostCredits: creditType === 'featured_post' ? count : 0,
        socialGraphicCredits: creditType === 'social_graphic' ? count : 0,
        repostCredits: 0,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        metadata: {
          testCredits: true,
          addedAt: new Date().toISOString(),
        },
      },
    });

    // Create individual credit records
    const credits = [];
    for (let i = 0; i < count; i++) {
      credits.push({
        userId,
        purchaseId: purchase.id,
        type: creditType,
        isUsed: false,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      });
    }

    await prisma.jobPostingCredit.createMany({
      data: credits,
    });

    return NextResponse.json({
      success: true,
      message: `Added ${count} ${creditType} credits`,
      purchaseId: purchase.id,
    });
  } catch (error) {
    console.error('Error adding test credits:', error);
    return NextResponse.json(
      { error: 'Failed to add test credits' },
      { status: 500 }
    );
  }
}
