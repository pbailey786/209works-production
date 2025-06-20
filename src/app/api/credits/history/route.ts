import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json(
        { error: 'Employer access required' },
        { status: 403 }
      );
    }

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get credit history
    const [creditHistory, totalCount] = await Promise.all([
      prisma.jobPostingCredit.findMany({
        where: { userId: user.id },
        include: {
          purchase: {
            select: {
              tier: true,
              totalAmount: true,
              purchasedAt: true,
            }
          },
          job: {
            select: {
              id: true,
              title: true,
              company: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.jobPostingCredit.count({
        where: { userId: user.id }
      })
    ]);

    // Get purchase history
    const purchaseHistory = await prisma.jobPostingPurchase.findMany({
      where: { userId: user.id },
      include: {
        credits: {
          select: {
            type: true,
            isUsed: true,
            usedAt: true,
          }
        }
      },
      orderBy: { purchasedAt: 'desc' },
      take: 20,
    });

    // Calculate credit statistics
    const stats = {
      totalCreditsEarned: creditHistory.length,
      totalCreditsUsed: creditHistory.filter(credit => credit.isUsed).length,
      totalCreditsExpired: creditHistory.filter(credit => 
        !credit.isUsed && credit.expiresAt && new Date(credit.expiresAt) < new Date()
      ).length,
      activeCredits: creditHistory.filter(credit => 
        !credit.isUsed && (!credit.expiresAt || new Date(credit.expiresAt) > new Date())
      ).length,
      totalSpent: purchaseHistory.reduce((sum, purchase) => 
        sum + parseFloat(purchase.totalAmount.toString()), 0
      ),
    };

    // Get credits expiring soon (within 7 days)
    const expiringCredits = await prisma.jobPostingCredit.findMany({
      where: {
        userId: user.id,
        isUsed: false,
        expiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        }
      },
      orderBy: { expiresAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      history: creditHistory.map(credit => ({
        id: credit.id,
        type: credit.type,
        isUsed: credit.isUsed,
        usedAt: credit.usedAt?.toISOString(),
        expiresAt: credit.expiresAt?.toISOString(),
        createdAt: credit.createdAt.toISOString(),
        purchase: credit.purchase ? {
          tier: credit.purchase.tier,
          totalAmount: parseFloat(credit.purchase.totalAmount.toString()),
          purchasedAt: credit.purchase.purchasedAt.toISOString(),
        } : null,
        job: credit.job ? {
          id: credit.job.id,
          title: credit.job.title,
          company: credit.job.company,
        } : null,
      })),
      purchases: purchaseHistory.map(purchase => ({
        id: purchase.id,
        tier: purchase.tier,
        totalAmount: parseFloat(purchase.totalAmount.toString()),
        purchasedAt: purchase.purchasedAt.toISOString(),
        expiresAt: purchase.expiresAt?.toISOString(),
        status: purchase.status,
        credits: {
          jobPost: purchase.jobPostCredits,
          featuredPost: purchase.featuredPostCredits,
          socialGraphic: purchase.socialGraphicCredits,
          repost: purchase.repostCredits,
        },
        creditsUsed: purchase.credits.filter(c => c.isUsed).length,
        creditsTotal: purchase.credits.length,
      })),
      stats,
      expiringCredits: {
        count: expiringCredits.length,
        nextExpirationDate: expiringCredits[0]?.expiresAt?.toISOString(),
      },
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error) {
    console.error('Error fetching credit history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
