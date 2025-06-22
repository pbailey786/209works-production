import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk

// GET /api/employers/credits - Get user's credit balance
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're an employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    // TODO: Replace with Clerk
    const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } }; // Mock session

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they're an employer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
