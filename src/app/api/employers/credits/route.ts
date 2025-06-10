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

    // Get available credits by counting unused credits
    const [jobPostCredits, featuredPostCredits, socialGraphicCredits] = await Promise.all([
      prisma.jobPostingCredit.count({
        where: {
          userId: user.id,
          type: 'job_post',
          isUsed: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      }),
      prisma.jobPostingCredit.count({
        where: {
          userId: user.id,
          type: 'featured_post',
          isUsed: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      }),
      prisma.jobPostingCredit.count({
        where: {
          userId: user.id,
          type: 'social_graphic',
          isUsed: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })
    ]);

    // Return credits
    const credits = {
      jobPost: jobPostCredits,
      featuredPost: featuredPostCredits,
      socialGraphic: socialGraphicCredits,
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
    const { jobPost, featuredPost, socialGraphic, operation = 'add', expiresAt } = body;

    // Create credit records based on operation
    const creditsToCreate = [];

    if (operation === 'add') {
      // Add job post credits
      if (jobPost && jobPost > 0) {
        for (let i = 0; i < jobPost; i++) {
          creditsToCreate.push({
            userId: user.id,
            type: 'job_post',
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          });
        }
      }

      // Add featured post credits
      if (featuredPost && featuredPost > 0) {
        for (let i = 0; i < featuredPost; i++) {
          creditsToCreate.push({
            userId: user.id,
            type: 'featured_post',
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          });
        }
      }

      // Add social graphic credits
      if (socialGraphic && socialGraphic > 0) {
        for (let i = 0; i < socialGraphic; i++) {
          creditsToCreate.push({
            userId: user.id,
            type: 'social_graphic',
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          });
        }
      }

      // Create all credits
      if (creditsToCreate.length > 0) {
        await prisma.jobPostingCredit.createMany({
          data: creditsToCreate,
        });
      }
    }

    // Get updated credit counts
    const [jobPostCredits, featuredPostCredits, socialGraphicCredits] = await Promise.all([
      prisma.jobPostingCredit.count({
        where: {
          userId: user.id,
          type: 'job_post',
          isUsed: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      }),
      prisma.jobPostingCredit.count({
        where: {
          userId: user.id,
          type: 'featured_post',
          isUsed: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      }),
      prisma.jobPostingCredit.count({
        where: {
          userId: user.id,
          type: 'social_graphic',
          isUsed: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })
    ]);

    const credits = {
      jobPost: jobPostCredits,
      featuredPost: featuredPostCredits,
      socialGraphic: socialGraphicCredits,
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
