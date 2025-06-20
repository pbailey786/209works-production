import { NextRequest, NextResponse } from '@/components/ui/card';
import { requireRole } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';


export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(['employer', 'admin']);

    // Get available credits (unified system - all credits are universal)
    const totalCredits = await prisma.jobPostingCredit.count({
      where: {
        userId: user.id,
        isUsed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    // Return credits (unified system)
    const credits = {
      universal: totalCredits,
      total: totalCredits,
    };

    return NextResponse.json({
      success: true,
      credits,
    });

  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

// POST /api/employers/credits - DEPRECATED: Direct credit addition disabled for security
// Credits can only be added through proper payment processing via Stripe
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(['employer', 'admin']);

    // SECURITY: Direct credit addition is disabled to prevent bypass of payment processing
    // Credits can only be added through:
    // 1. Stripe webhook after successful payment (/api/stripe/webhook)
    // 2. Admin manual assignment (/api/admin/credits/assign)
    // 3. Test environment only (/api/test/add-credits)

    return NextResponse.json({
      error: 'Direct credit addition is disabled. Please purchase credits through the proper checkout process.',
      redirectUrl: '/employers/pricing',
      supportedMethods: [
        'Purchase credits via /api/job-posting/buy-credits',
        'Admin assignment via /api/admin/credits/assign (admin only)',
        'Automatic allocation via Stripe webhooks'
      ]
    }, { status: 403 });

  } catch (error) {
    console.error('Error updating user credits:', error);
    return NextResponse.json(
      { error: 'Failed to update credits' },
      { status: 500 }
    );
  }
}
