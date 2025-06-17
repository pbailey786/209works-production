import { NextRequest, NextResponse } from 'next/server';
import * as speakeasy from 'speakeasy';
import { prisma } from '@/lib/database/prisma';
import { normalizeEmail } from '@/lib/utils/email-utils';
import { compare } from 'bcryptjs';
import { headers } from 'next/headers';

/**
 * This endpoint handles 2FA verification during login
 * It should be called after initial credentials verification
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, totp } = body;

    if (!email || !password || !totp) {
      return NextResponse.json({
        error: 'Email, password, and 2FA code are required'
      }, { status: 400 });
    }

    // Validate TOTP code format
    if (!/^\d{6}$/.test(totp)) {
      return NextResponse.json({
        error: '2FA code must be 6 digits'
      }, { status: 400 });
    }

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    // Find user with security fields
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        isEmailVerified: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      }
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Check if account is locked
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      return NextResponse.json({
        error: 'Account is temporarily locked due to multiple failed login attempts'
      }, { status: 423 });
    }

    // Verify password
    const isValidPassword = await compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // Check email verification
    if (!user.isEmailVerified) {
      return NextResponse.json({
        error: 'Email not verified'
      }, { status: 401 });
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({
        error: '2FA is not enabled for this account'
      }, { status: 400 });
    }

    // Verify TOTP code
    const isValidTotp = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: totp,
      window: 2 // Allow 2 time steps for clock drift
    });

    if (!isValidTotp) {
      // Log failed 2FA attempt
      const headersList = await headers();
      const ipAddress = headersList.get('x-forwarded-for') || 
                       headersList.get('x-real-ip') || 
                       'unknown';
      const userAgent = headersList.get('user-agent') || 'unknown';

      await prisma.securityLog.create({
        data: {
          userId: user.id,
          event: 'TWO_FACTOR_FAILED',
          ipAddress,
          userAgent,
          metadata: {
            email: user.email
          }
        }
      });

      // Increment failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 }
        }
      });

      return NextResponse.json({
        error: 'Invalid 2FA code'
      }, { status: 401 });
    }

    // Success - reset failed attempts and log success
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });

    // Log successful 2FA verification
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await prisma.securityLog.create({
      data: {
        userId: user.id,
        event: 'TWO_FACTOR_SUCCESS',
        ipAddress,
        userAgent,
        metadata: {
          email: user.email
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: '2FA verification successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('2FA login verification error:', error);
    return NextResponse.json({
      error: 'Internal server error during 2FA verification'
    }, { status: 500 });
  }
}