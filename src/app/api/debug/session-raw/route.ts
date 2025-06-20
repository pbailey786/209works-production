import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Debug route to see raw session data from NextAuth v5
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Debug: Getting raw session data...');
    
    // For NextAuth v5, we need to use the auth() function as middleware
    // Let's try both patterns to see which works
    let session1 = null;
    let session2 = null;
    
    try {
      session1 = await auth();
      console.log('🔍 Method 1 - auth():', !!session1);
    } catch (e) {
      console.log('🔍 Method 1 failed:', e.message);
    }
    
    // Method 2 not needed since NextAuth v5 uses auth() without params
    
    const session = session1 || session2;
    
    console.log('🔍 Debug: Raw session from auth():', {
      session: session,
      sessionType: typeof session,
      sessionKeys: session ? Object.keys(session) : 'null',
      userExists: !!session?.user,
      userKeys: session?.user ? Object.keys(session.user) : 'no user',
    });

    return NextResponse.json({
      success: true,
      rawSession: session,
      debug: {
        sessionExists: !!session,
        userExists: !!session?.user,
        userKeys: session?.user ? Object.keys(session.user) : null,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userRole: (session?.user as any)?.role,
        fullUser: session?.user,
      }
    });
  } catch (error) {
    console.error('🔍 Debug: Session error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rawSession: null
    });
  }
}