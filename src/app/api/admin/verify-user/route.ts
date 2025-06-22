import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

// Admin endpoint to manually verify a user's email
export async function POST(req: NextRequest) {
  try {
    const { email, adminKey } = await req.json();

    // Simple admin key check (you can set this in your environment)
    const expectedAdminKey = process.env.ADMIN_VERIFICATION_KEY || 'admin123';
    
    if (adminKey !== expectedAdminKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find and update user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user to verified
    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    return NextResponse.json({
      success: true,
      message: `User ${email} has been manually verified`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: true,
      },
    });

  } catch (error) {
    console.error('Manual verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
