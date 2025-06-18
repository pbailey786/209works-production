import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { prisma } from '@/lib/database/prisma';
import { Session } from 'next-auth';

// GET /api/debug/current-user - Get current user info for debugging
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession() as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        session: null 
      }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found in database',
        sessionEmail: session.user.email 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: user,
      session: {
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role,
      },
      needsAdminUpdate: user.role !== 'admin',
    });

  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/debug/current-user - Update current user to admin role
export async function POST(req: NextRequest) {
  try {
    // For this specific case, update paul@voodoo.rodeo to admin
    const targetEmail = 'paul@voodoo.rodeo';

    // Update user to admin role
    const updatedUser = await prisma.user.update({
      where: { email: targetEmail },
      data: {
        role: 'admin',
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User updated to admin role successfully',
      user: updatedUser,
      instructions: [
        '1. Sign out of your account',
        '2. Sign back in',
        '3. Navigate to /admin',
        '4. You should now see the Email Management section'
      ]
    });

  } catch (error) {
    console.error('Error updating user to admin:', error);
    return NextResponse.json({ 
      error: 'Failed to update user role',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
