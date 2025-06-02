import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '../prisma';
// @ts-ignore: No types for nodemailer unless @types/nodemailer is installed
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // For security, do not reveal if the email exists
    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
  }

  const passwordResetToken = randomBytes(32).toString('hex');
  const passwordResetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.user.update({
    where: { email },
    data: { passwordResetToken, passwordResetExpires },
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${passwordResetToken}`;

  // Validate required email environment variables
  if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASS) {
    console.error('Email configuration missing. Required: EMAIL_SERVER_HOST, EMAIL_SERVER_USER, EMAIL_SERVER_PASS');
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: process.env.EMAIL_SERVER_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASS,
    },
  });

  try {
    await transporter.sendMail({
      to: email,
      from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
      subject: 'Reset your password - 209jobs',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your 209jobs account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">209jobs - Your Career, Our Priority</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Password reset email send error:', err);
    return NextResponse.json({ error: 'Email send failed', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }

  return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' });
}

export async function PATCH(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and new password are required.' }, { status: 400 });
  }

  // Validate password strength
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 });
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

  return NextResponse.json({ message: 'Password has been reset successfully.' });
} 