import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { prisma } from '@/lib/database/prisma';

// GET /api/debug/current-user - Get current user info for debugging
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId! },
    });

    if (!user?.email) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        session: null 
      }, { status: 401 });
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: user?.email },
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
        sessionEmail: user?.email 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: user,
      session: {
        email: user?.email,
        name: user?.name,
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
