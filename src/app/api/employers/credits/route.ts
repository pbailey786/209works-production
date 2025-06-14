import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/authOptions';
import { prisma } from '@/lib/database/prisma';
import type { Session } from 'next-auth';

// GET /api/employers/credits - Get user's credit balance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

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

// POST /api/employers/credits - Add credits to user's account (for admin use or purchases)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

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

    const body = await request.json();
    const { credits: creditCount, operation = 'add', expiresAt } = body;

    // Create credit records based on operation (unified system)
    const creditsToCreate = [];

    if (operation === 'add' && creditCount && creditCount > 0) {
      // Add universal credits
      for (let i = 0; i < creditCount; i++) {
        creditsToCreate.push({
          userId: user.id,
          type: 'universal',
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        });
      }

      // Create all credits
      await prisma.jobPostingCredit.createMany({
        data: creditsToCreate,
      });
    }

    // Get updated credit count (unified system)
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

    const credits = {
      universal: totalCredits,
      total: totalCredits,
    };

    return NextResponse.json({
      success: true,
      credits,
      message: 'Credits updated successfully',
    });

  } catch (error) {
    console.error('Error updating user credits:', error);
    return NextResponse.json(
      { error: 'Failed to update credits' },
      { status: 500 }
    );
  }
}
