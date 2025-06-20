import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { validateSession } from '@/lib/utils/safe-fetch';
import type { Session } from 'next-auth';

/**
 * GET /api/auth/session - Get current user session
 * Provides safe session validation with proper error handling
 */
export async function GET(req: NextRequest) {
  try {
    // Get session with proper error handling - NextAuth v5 beta
    const session = await auth() as Session | null;
    
    // Validate session structure
    const validation = validateSession(session);
    
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: validation.error || 'No valid session found',
        session: null,
      }, { status: 401 });
    }

    // Return sanitized session data
    return NextResponse.json({
      success: true,
      session: {
        user: validation.user,
        // NextAuth Session type doesn't have expires by default
        // We can add expiry info based on our auth configuration
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
      },
    });
  } catch (error) {
    console.error('Session API error:', error);
    
    // Don't expose internal errors to clients
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve session',
      session: null,
    }, { status: 500 });
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
      error: 'Internal Server Error', 
      message: 'Failed to refresh session',
      session: null,
    }, { status: 500 });
  }
}