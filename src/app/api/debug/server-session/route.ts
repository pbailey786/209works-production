import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Debug endpoint to test server-side session retrieval
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Debug: Testing server-side session...');
    
    // Test the auth() function directly
    const session = await auth();
    
    console.log('🔍 Debug: Server session result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: (session?.user as any)?.role,
    });

    return NextResponse.json({
      session,
      debug: {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userRole: (session?.user as any)?.role,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('🔍 Debug: Server session error:', error);
    
    return NextResponse.json({
      session: null,
      error: error.message,
      debug: {
        hasSession: false,
        timestamp: new Date().toISOString(),
      }
    });
  }
}
