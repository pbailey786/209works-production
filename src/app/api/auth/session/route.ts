import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import type { Session } from 'next-auth';

/**
 * GET /api/auth/session - Get current user session
 * Returns session data for authenticated users, null for unauthenticated users
 * This endpoint should NOT return 401 for unauthenticated users - that's normal
 */
export async function GET(req: NextRequest) {
  try {
    // Get session with proper error handling - NextAuth v5 beta
    const session = await auth() as Session | null;

    // If no session, return null session (this is normal, not an error)
    if (!session || !session.user) {
      return NextResponse.json({
        session: null,
        authenticated: false,
      }, { status: 200 }); // 200, not 401 - no session is normal
    }

    // Basic validation for authenticated session
    const user = session.user as any;
    if (!user.email) {
      return NextResponse.json({
        session: null,
        authenticated: false,
        error: 'Invalid session data',
      }, { status: 200 });
    }

    // Return sanitized session data
    return NextResponse.json({
      session: {
        user: {
          id: user.id || '',
          email: user.email,
          name: user.name || '',
          role: user.role || 'jobseeker',
        },
        expires: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
      },
      authenticated: true,
    }, { status: 200 });
  } catch (error) {
    console.error('Session API error:', error);

    // Return null session on error (don't expose internal errors)
    return NextResponse.json({
      session: null,
      authenticated: false,
      error: 'Session retrieval failed',
    }, { status: 200 }); // 200, not 500 - treat as unauthenticated
  }
}

/**
 * POST /api/auth/session - Refresh session (optional)
 * Can be used to refresh session data if needed
 */
export async function POST(req: NextRequest) {
  try {
    // Same logic as GET for refresh
    return GET(req);
  } catch (error) {
    console.error('Session refresh error:', error);

    return NextResponse.json({
      session: null,
      authenticated: false,
      error: 'Session refresh failed',
    }, { status: 200 }); // 200, not 500 - treat as unauthenticated
  }
}