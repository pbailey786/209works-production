import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { sendEmail } from '@/lib/email';
import { EmailVerificationTemplate } from '@/lib/email/templates/email-verification';
import { randomBytes } from 'crypto';
import { normalizeEmail } from '@/lib/utils/email-utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      // Redirect to verification page with expired message
      const redirectUrl = new URL('/verify-email', req.url);
      redirectUrl.searchParams.set('error', 'expired');
      return NextResponse.redirect(redirectUrl);
    }

    // Check if email is already verified
    if (verificationToken.user.isEmailVerified) {
      // Delete the token since email is already verified
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });

      // Redirect to sign-in page with already verified message
      const redirectUrl = new URL('/signin', req.url);
      redirectUrl.searchParams.set('message', 'Email already verified. Please sign in.');
      return NextResponse.redirect(redirectUrl);
    }

    // Mark user as verified and delete the token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { isEmailVerified: true },
      }),
      prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      }),
    ]);

    // Redirect to sign-in page with success message
    const redirectUrl = new URL('/signin', req.url);
    redirectUrl.searchParams.set('verified', 'true');
    redirectUrl.searchParams.set('message', 'Email verified successfully! You can now sign in.');

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Email verification error:', error);
    const redirectUrl = new URL('/verify-email', req.url);
    redirectUrl.searchParams.set('error', 'server');
    return NextResponse.redirect(redirectUrl);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail } = await req.json();

    if (!rawEmail) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize email for case-insensitive lookup
    const email = normalizeEmail(rawEmail);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists and is not verified, a verification email has been sent.',
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified. You can sign in.',
      });
    }

    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: 'email_verification',
      },
    });

    // Generate new verification token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        type: 'email_verification',
        expiresAt,
      },
    });

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email address - 209 Works',
        react: EmailVerificationTemplate({
          userName: user.name || user.email.split('@')[0],
          verificationUrl,
          expiresIn: '24 hours',
        }),
        metadata: {
          source: 'email-verification',
          userId: user.id,
        },
        priority: 'high',
      });

      console.log('📧 Verification email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('📧 Failed to send verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
