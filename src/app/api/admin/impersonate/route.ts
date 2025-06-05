import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Permission } from '@/lib/auth/permissions';
import { hasPermission } from '@/lib/auth/rbac';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasPermission(session.user, Permission.MANAGE_SYSTEM)) {
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

    // Create impersonation session record
    const impersonationSession = await prisma.impersonationSession.create({
      data: {
        adminId: session.user.id,
        targetUserId: targetUser.id,
        reason: reason || 'Admin debugging',
        token: impersonationToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        isActive: true,
      },
    });

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
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasPermission(session.user, Permission.MANAGE_SYSTEM)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Find and deactivate the impersonation session
    const impersonationSession = await prisma.impersonationSession.findUnique({
      where: { id: sessionId },
      include: {
        targetUser: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    if (!impersonationSession) {
      return NextResponse.json({ error: 'Impersonation session not found' }, { status: 404 });
    }

    if (impersonationSession.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Can only end your own impersonation sessions' }, { status: 403 });
    }

    // Deactivate the session
    await prisma.impersonationSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

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
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasPermission(session.user, Permission.MANAGE_SYSTEM)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get active and recent impersonation sessions
    const [sessions, totalCount] = await Promise.all([
      prisma.impersonationSession.findMany({
        where: {
          adminId: session.user.id,
        },
        include: {
          targetUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.impersonationSession.count({
        where: {
          adminId: session.user.id,
        },
      }),
    ]);

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
