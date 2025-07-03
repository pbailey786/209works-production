import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(req: NextRequest) {
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
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all user's purchase records
    const purchases = await prisma.jobPostingPurchase.findMany({
      where: { userId: user.id },
      orderBy: { purchasedAt: 'desc' },
      take: 10,
    });

    // Get all user's credits
    const credits = await prisma.jobPostingCredit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Count credits by type
    const creditStats = {
      universal: credits.filter(c => c.type === 'universal' && !c.isUsed).length,
      job_post: credits.filter(c => c.type === 'job_post' && !c.isUsed).length,
      featured_post: credits.filter(c => c.type === 'featured_post' && !c.isUsed).length,
      social_graphic: credits.filter(c => c.type === 'social_graphic' && !c.isUsed).length,
      used: credits.filter(c => c.isUsed).length,
      expired: credits.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length,
    };

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      purchases: purchases.map(p => ({
        id: p.id,
        tier: p.tier,
        status: p.status,
        totalAmount: p.totalAmount,
        jobPostCredits: p.jobPostCredits,
        featuredPostCredits: p.featuredPostCredits,
        socialGraphicCredits: p.socialGraphicCredits,
        purchasedAt: p.purchasedAt,
        stripeSessionId: p.stripeSessionId,
      })),
      credits: credits.map(c => ({
        id: c.id,
        type: c.type,
        isUsed: c.isUsed,
        expiresAt: c.expiresAt,
        createdAt: c.createdAt,
        purchaseId: c.purchaseId,
      })),
      creditStats,
      totalAvailableCredits: creditStats.universal + creditStats.job_post + creditStats.featured_post + creditStats.social_graphic,
      debug: {
        timestamp: new Date().toISOString(),
        webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'MISSING',
        environment: process.env.NODE_ENV || 'unknown',
      }
    });

  } catch (error) {
    console.error('Error in credits debug:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch debug info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}