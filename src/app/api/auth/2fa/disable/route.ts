import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { prisma } from '../../prisma';
// TODO: Replace with Clerk JWT
// import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
  try {
    // TODO: Replace with Clerk authentication
    const token = { email: 'admin@209.works', sub: 'mock-user-id' }; // Mock token
    if (!token || !token.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        {
          error: '2FA code is required to disable 2FA',
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

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        {
          error: '2FA is not enabled for this account',
        },
        { status: 400 }
      );
    }

    // Verify the TOTP code before disabling
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps before/after for clock drift
    });

    if (!verified) {
      return NextResponse.json(
        {
          error:
            'Invalid 2FA code. Cannot disable 2FA without valid verification.',
        },
        { status: 400 }
      );
    }

    // Disable 2FA and remove secret
    await prisma.user.update({
      where: { email: token.email },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: '2FA has been successfully disabled for your account',
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during 2FA disable',
      },
      { status: 500 }
    );
  }
}
