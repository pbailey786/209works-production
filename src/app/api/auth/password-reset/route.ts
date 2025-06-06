import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '../prisma';
import { EmailHelpers } from '@/lib/email/email-helpers';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // For security, do not reveal if the email exists
    return NextResponse.json({
      message: 'If that email exists, a reset link has been sent.',
    });
  }

  const passwordResetToken = randomBytes(32).toString('hex');
  const passwordResetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.user.update({
    where: { email },
    data: { passwordResetToken, passwordResetExpires },
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${passwordResetToken}`;

  // Send password reset email using our email system
  try {
    await EmailHelpers.sendPasswordReset(user.email, {
      userName: user.name || user.email.split('@')[0],
      resetUrl,
    }, {
      userId: user.id,
      priority: 'urgent',
    });
    console.log('📧 Password reset email sent successfully');
  } catch (emailError) {
    console.error('📧 Failed to send password reset email:', emailError);
    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'If that email exists, a reset link has been sent.',
  });
}

export async function PATCH(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json(
      { error: 'Token and new password are required.' },
      { status: 400 }
    );
  }

  // Validate password strength
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters long.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token.' },
      { status: 400 }
    );
  }

  const { hash } = await import('bcryptjs');
  const passwordHash = await hash(password, 12); // Increased from 10 to 12 for better security

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return NextResponse.json({
    message: 'Password has been reset successfully.',
  });
}
