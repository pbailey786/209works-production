import { getIronSession, SessionOptions } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export interface SessionData {
  user?: {
    id: string;
    email: string;
    name?: string;
    role: 'jobseeker' | 'employer' | 'admin';
    isEmailVerified?: boolean;
  };
  isLoggedIn: boolean;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'this-is-a-very-long-secret-that-should-be-at-least-32-characters',
  cookieName: '209jobs-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

/**
 * Get session from cookies (App Router)
 */
export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  return session;
}

/**
 * Get session from request (API Routes)
 */
export async function getSessionFromRequest(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  return session;
}

/**
 * Save session helper
 */
export async function saveSession(session: any) {
  await session.save();
}

/**
 * Destroy session helper
 */
export async function destroySession(session: any) {
  session.destroy();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession();
  return session.isLoggedIn === true && !!session.user;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user) {
    return null;
  }
  return session.user;
}

/**
 * Require authentication middleware
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

/**
 * Require specific role middleware
 */
export async function requireRole(role: 'jobseeker' | 'employer' | 'admin') {
  const user = await requireAuth();
  if (user.role !== role && user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return user;
}