import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { compare } from 'bcryptjs';
import { normalizeEmail } from '@/lib/utils/email-utils';
import { getSessionFromRequest, saveSession } from '@/lib/auth/iron-session';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get session
    const session = await getSessionFromRequest(req);

    // Test credentials for development
    if (email === 'test@test.com' && password === 'test123') {
      session.user = {
        id: 'test-user-id',
        email: 'test@test.com',
        name: 'Test User',
        role: 'jobseeker',
        isEmailVerified: true,
      };
      session.isLoggedIn = true;
      await saveSession(session);

      console.log('✅ Test user logged in with Iron Session');
      
      return NextResponse.json({
        success: true,
        user: session.user,
      });
    }

    // Production authentication
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isPasswordValid = await compare(password, user.passwordHash || '');
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Set session data
    session.user = {
      id: user.id,
      email: user.email,
      name: user.name || user.email,
      role: user.role as 'jobseeker' | 'employer' | 'admin',
      isEmailVerified: user.isEmailVerified,
    };
    session.isLoggedIn = true;
    await saveSession(session);

    console.log('✅ User logged in with Iron Session:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: session.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}