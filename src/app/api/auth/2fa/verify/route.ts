import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { prisma } from '../../prisma';
import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        {
          error: '2FA code is required',
        },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          error: '2FA code must be 6 digits',
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: {
        id: true,
        email: true,
        role: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        {
          error: '2FA not set up. Please set up 2FA first.',
        },
        { status: 400 }
      );
    }

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        {
          error: '2FA is already enabled for this account',
        },
        { status: 400 }
      );
    }

    // Verify the TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps before/after for clock drift
    });

    if (verified) {
      // Enable 2FA for the user
      await prisma.user.update({
        where: { email: token.email },
        data: { twoFactorEnabled: true },
      });

      return NextResponse.json({
        success: true,
        message: '2FA has been successfully enabled for your account',
      });
    } else {
      return NextResponse.json(
        {
          error: 'Invalid 2FA code. Please try again.',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during 2FA verification',
      },
      { status: 500 }
    );
  }
}
