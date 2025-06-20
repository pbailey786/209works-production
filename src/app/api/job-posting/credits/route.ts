import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { JobPostingCreditsService } from '@/lib/services/job-posting-credits';
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    // Check authentication - NextAuth v5 beta
    const session = await auth() as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'employer') {
      return NextResponse.json(
        { error: 'Only employers can access job posting credits' },
        { status: 403 }
      );
    }

    // Get user's available credits
    const credits = await JobPostingCreditsService.getUserCredits(user.id);

    // Get expiring credits (within 7 days)
    const expiringSoon = await JobPostingCreditsService.getExpiringSoonCredits(user.id);

    // Get recent purchase history
    const recentPurchases = await JobPostingCreditsService.getPurchaseHistory(user.id, 5);

    return NextResponse.json({
      ...credits,
      expiringSoon: expiringSoon.length,
      recentPurchases: recentPurchases.map(purchase => ({
        id: purchase.id,
        tier: purchase.tier,
        totalAmount: purchase.totalAmount,
        purchasedAt: purchase.purchasedAt,
        status: purchase.status,
        creditsUsed: purchase.credits.filter(c => c.isUsed).length,
        totalCredits: purchase.credits.length,
      })),
    });

  } catch (error) {
    console.error('Error fetching job posting credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

// POST endpoint to manually use credits (for testing or admin purposes)
export async function POST(req: NextRequest) {
  try {
    // Check authentication - NextAuth v5 beta
    const session = await auth() as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'employer') {
      return NextResponse.json(
        { error: 'Only employers can use job posting credits' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { jobId, creditType, count = 1 } = body;

    if (!jobId || !creditType) {
      return NextResponse.json(
        { error: 'jobId and creditType are required' },
        { status: 400 }
      );
    }

    // Use the credits
    const result = await JobPostingCreditsService.useCredits(
      user.id,
      jobId,
      { [creditType]: count }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Return updated credits
    const updatedCredits = await JobPostingCreditsService.getUserCredits(user.id);

    return NextResponse.json({
      success: true,
      message: `Successfully used ${count} ${creditType} credit(s)`,
      credits: updatedCredits,
    });

  } catch (error) {
    console.error('Error using job posting credits:', error);
    return NextResponse.json(
      { error: 'Failed to use credits' },
      { status: 500 }
    );
  }
}
