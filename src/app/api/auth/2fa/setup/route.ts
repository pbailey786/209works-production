import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { prisma } from '../../prisma';
// @ts-ignore - NextAuth v4 JWT import issue
// TODO: Replace with Clerk JWT
// import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
  try {
    // TODO: Replace with Clerk authentication
    const token = { email: 'admin@209.works', sub: 'mock-user-id' }; // Mock token
    if (!token || !token.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists and is admin
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: { id: true, email: true, role: true, twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow admins to set up 2FA (as per requirements)
    if (user.role !== 'admin') {
      return NextResponse.json(
        {
          error: '2FA is only available for admin accounts',
        },
        { status: 403 }
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

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `209jobs (${token.email})`,
      issuer: '209jobs',
      length: 32,
    });

    if (!secret.base32) {
      return NextResponse.json(
        {
          error: 'Failed to generate 2FA secret',
        },
        { status: 500 }
      );
    }

    // Save the secret (not enabled yet) to the user in DB
    await prisma.user.update({
      where: { email: token.email },
      data: { twoFactorSecret: secret.base32 },
    });

    // Generate QR code
    const otpauthUrl = secret.otpauth_url;
    if (!otpauthUrl) {
      return NextResponse.json(
        {
          error: 'Failed to generate otpauth URL',
        },
        { status: 500 }
      );
    }

    const qrCode = await qrcode.toDataURL(otpauthUrl);

    return NextResponse.json({
      qrCode,
      otpauthUrl,
      message:
        '2FA setup initiated. Scan the QR code with your authenticator app and verify to complete setup.',
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during 2FA setup',
      },
      { status: 500 }
    );
  }
}
