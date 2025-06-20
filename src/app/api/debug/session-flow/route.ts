import { NextRequest, NextResponse } from '@/components/ui/card';
import { auth } from '@/components/ui/card';
import { redirect } from '@/components/ui/card';
import { headers, cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Debug endpoint only available in development' },
      { status: 403 }
    );
  }

  try {
    console.log('🔍 === SESSION FLOW DEBUG ===');
    
    // Get all request info
    const headersList = await headers();
    const cookieStore = await cookies();
    
    // Debug request headers and cookies
    const authCookies: Record<string, string> = {};
    cookieStore.getAll().forEach(cookie => {
      if (cookie.name.includes('next-auth') || cookie.name.includes('auth')) {
        authCookies[cookie.name] = cookie.value.substring(0, 50) + '...'; // Truncate for security
      }
    });

    console.log('🔍 Auth cookies found:', Object.keys(authCookies));
    
    // Try to get server session
    let serverSession = null;
    let sessionError = null;
    
    try {
      console.log('🔍 Attempting getServerSession...');
      serverSession = await auth();
      console.log('🔍 Server session result:', serverSession);
    } catch (error) {
      sessionError = error instanceof Error ? error.message : 'Unknown session error';
      console.error('🔍 Server session error:', error);
    }

    // Test the session endpoint directly
    let directSessionTest = null;
    try {
      const sessionResponse = await fetch(new URL('/api/auth/session', request.url), {
        headers: {
          cookie: headersList.get('cookie') || '',
        },
      });
      directSessionTest = await sessionResponse.json();
      console.log('🔍 Direct session endpoint result:', directSessionTest);
    } catch (error) {
      console.error('🔍 Direct session test failed:', error);
    }

    // Analyze the session data
    const analysis = {
      sessionExists: !!serverSession,
      userExists: !!(serverSession as any)?.user,
      hasUserId: !!((serverSession as any)?.user as any)?.id,
      hasUserEmail: !!((serverSession as any)?.user)?.email,
      hasUserRole: !!((serverSession as any)?.user as any)?.role,
      expires: (serverSession as any)?.expires,
    };

    console.log('🔍 Session analysis:', analysis);

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      },
      request: {
        url: request.url,
        userAgent: headersList.get('user-agent'),
        origin: headersList.get('origin'),
        referer: headersList.get('referer'),
      },
      cookies: {
        authCookiesFound: Object.keys(authCookies),
        totalCookies: cookieStore.getAll().length,
      },
      session: {
        serverSession,
        sessionError,
        directSessionTest,
        analysis,
      },
      authConfig: {
        version: 'v5',
        strategy: 'jwt',
        note: 'Auth configuration migrated to auth.ts',
        status: 'migrated'
      },
    };

    // Log potential issues
    if (analysis.sessionExists && !analysis.hasUserId) {
      console.warn('⚠️ POTENTIAL ISSUE: Session exists but user.id is missing');
    }
    if (analysis.sessionExists && !analysis.hasUserEmail) {
      console.warn('⚠️ POTENTIAL ISSUE: Session exists but user.email is missing');
    }
    if (analysis.sessionExists && !analysis.hasUserRole) {
      console.warn('⚠️ POTENTIAL ISSUE: Session exists but user.role is missing');
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('🔍 Debug API error:', error);
    
    return NextResponse.json(
      {
        error: 'Debug API failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}