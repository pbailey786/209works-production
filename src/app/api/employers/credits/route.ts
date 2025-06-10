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
        jobPostCredits: true,
        featuredPostCredits: true,
        socialGraphicCredits: true,
      },
    });

    if (!user || user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return credits (with defaults if not set)
    const credits = {
      jobPost: user.jobPostCredits || 0,
      featuredPost: user.featuredPostCredits || 0,
      socialGraphic: user.socialGraphicCredits || 0,
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

// POST /api/employers/credits - Update user's credit balance (for admin use)
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
    const { jobPost, featuredPost, socialGraphic, operation = 'set' } = body;

    // Update credits based on operation
    const updateData: any = {};
    
    if (operation === 'add') {
      // Add credits
      if (jobPost !== undefined) {
        updateData.jobPostCredits = { increment: jobPost };
      }
      if (featuredPost !== undefined) {
        updateData.featuredPostCredits = { increment: featuredPost };
      }
      if (socialGraphic !== undefined) {
        updateData.socialGraphicCredits = { increment: socialGraphic };
      }
    } else if (operation === 'subtract') {
      // Subtract credits
      if (jobPost !== undefined) {
        updateData.jobPostCredits = { decrement: jobPost };
      }
      if (featuredPost !== undefined) {
        updateData.featuredPostCredits = { decrement: featuredPost };
      }
      if (socialGraphic !== undefined) {
        updateData.socialGraphicCredits = { decrement: socialGraphic };
      }
    } else {
      // Set credits (default)
      if (jobPost !== undefined) {
        updateData.jobPostCredits = jobPost;
      }
      if (featuredPost !== undefined) {
        updateData.featuredPostCredits = featuredPost;
      }
      if (socialGraphic !== undefined) {
        updateData.socialGraphicCredits = socialGraphic;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        jobPostCredits: true,
        featuredPostCredits: true,
        socialGraphicCredits: true,
      },
    });

    const credits = {
      jobPost: updatedUser.jobPostCredits || 0,
      featuredPost: updatedUser.featuredPostCredits || 0,
      socialGraphic: updatedUser.socialGraphicCredits || 0,
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
