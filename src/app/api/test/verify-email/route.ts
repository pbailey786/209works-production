import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

// Public endpoint to manually verify a test user's email (for development only)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Only allow this in development or for specific test emails
    const allowedTestEmails = [
      'onethoughtstudio@gmail.com',
      'test@209.works',
      'admin@209.works'
    ];

    if (!allowedTestEmails.includes(email.toLowerCase())) {
      return NextResponse.json(
        { error: 'This endpoint is only for test accounts' },
        { status: 403 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
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
      message: `✅ Email verified for ${email}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: true,
      },
    });

  } catch (error) {
    console.error('Test verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check verification status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });

  } catch (error) {
    console.error('Check verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
