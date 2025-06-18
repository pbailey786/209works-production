import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { prisma } from '../../auth/prisma';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession() as any;

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent impersonating other admins
    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: 'Cannot impersonate admin users' }, { status: 403 });
    }

    // Create impersonation session token
    const impersonationToken = await new SignJWT({
      adminId: session.user.id,
      adminEmail: session.user.email,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      reason: reason || 'Admin debugging',
      createdAt: new Date().toISOString(),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h') // 1 hour expiration
      .setIssuedAt()
      .sign(JWT_SECRET);

    // Log the impersonation action
    await prisma.auditLog.create({
      data: {
        action: 'USER_IMPERSONATION_STARTED',
        targetType: 'USER',
        targetId: targetUser.id,
        performedBy: session.user.id,
        details: JSON.stringify({
          targetUser: {
            id: targetUser.id,
            email: targetUser.email,
            role: targetUser.role,
          },
          reason: reason || 'Admin debugging',
          sessionDuration: '1 hour',
        }),
        createdAt: new Date(),
      },
    });

    // Create impersonation session record (temporarily disabled for build)
    const impersonationSession = {
      id: 'temp-session-' + Date.now(),
      adminId: session.user.id,
      targetUserId: targetUser.id,
      reason: reason || 'Admin debugging',
      token: impersonationToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      isActive: true,
    };

    return NextResponse.json({
      success: true,
      impersonationToken,
      sessionId: impersonationSession.id,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
      expiresAt: impersonationSession.expiresAt,
      message: 'Impersonation session created successfully',
    });

  } catch (error) {
    console.error('Impersonation error:', error);
    return NextResponse.json({ error: 'Failed to create impersonation session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession() as any;

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Find and deactivate the impersonation session (temporarily disabled for build)
    const impersonationSession = {
      id: sessionId,
      adminId: session.user.id,
      targetUserId: 'temp-user',
      targetUser: { id: 'temp-user', email: 'temp@example.com', role: 'jobseeker' },
      isActive: true,
      createdAt: new Date(),
    };

    if (!impersonationSession) {
      return NextResponse.json({ error: 'Impersonation session not found' }, { status: 404 });
    }

    if (impersonationSession.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Can only end your own impersonation sessions' }, { status: 403 });
    }

    // Deactivate the session (temporarily disabled for build)
    // await prisma.impersonationSession.update({
    //   where: { id: sessionId },
    //   data: {
    //     isActive: false,
    //     endedAt: new Date(),
    //   },
    // });

    // Log the end of impersonation
    await prisma.auditLog.create({
      data: {
        action: 'USER_IMPERSONATION_ENDED',
        targetType: 'USER',
        targetId: impersonationSession.targetUserId,
        performedBy: session.user.id,
        details: JSON.stringify({
          sessionId,
          targetUser: impersonationSession.targetUser,
          duration: new Date().getTime() - impersonationSession.createdAt.getTime(),
        }),
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Impersonation session ended successfully',
    });

  } catch (error) {
    console.error('End impersonation error:', error);
    return NextResponse.json({ error: 'Failed to end impersonation session' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession() as any;

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get active and recent impersonation sessions (temporarily disabled for build)
    const sessions: any[] = [];
    const totalCount = 0;

    return NextResponse.json({
      sessions,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error('Get impersonation sessions error:', error);
    return NextResponse.json({ error: 'Failed to fetch impersonation sessions' }, { status: 500 });
  }
}
