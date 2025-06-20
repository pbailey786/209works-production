import { NextRequest, NextResponse } from '@/components/ui/card';
import { requireRole } from '@/components/ui/card';
import { JobPostingCreditsService } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Checking job posting credits...');

    // Check authentication using modern session validator
    const { user } = await requireRole(['employer', 'admin']);

    console.log('✅ Auth successful for credits check:', user.id);

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

  } catch (error: any) {
    console.error('💥 Error fetching job posting credits:', error);

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
      { error: 'Failed to fetch credits', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST endpoint to manually use credits (for testing or admin purposes)
export async function POST(req: NextRequest) {
  try {
    // Check authentication using modern session validator
    const { user } = await requireRole(['employer', 'admin']);

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
