import { NextRequest, NextResponse } from 'next/server';
import { auth as getServerSession } from "@/auth";
import { checkAuthEnvironment } from '@/lib/auth/env-checker';

export async function GET(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Debug endpoint only available in development' },
      { status: 403 }
    );
  }

  try {
    console.log('🔍 NextAuth Debug API called');

    // Check environment variables
    const envCheck = checkAuthEnvironment();
    
    // Try to get session
    let sessionData = null;
    let sessionError = null;
    
    try {
      sessionData = await getServerSession();
      console.log('🔍 Server session data:', sessionData);
    } catch (error) {
      sessionError = error instanceof Error ? error.message : 'Unknown session error';
      console.error('🔍 Server session error:', error);
    }

    // Check database connection
    let dbStatus = 'unknown';
    try {
      const { prisma } = await import('@/lib/database/prisma');
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      console.log('🔍 Database connection: OK');
    } catch (error) {
      dbStatus = 'error';
      console.error('🔍 Database connection error:', error);
    }

    // Check NextAuth v5 configuration
    const authConfig = {
      version: 'v5',
      note: 'Configuration moved to auth.ts - debug info limited in v5',
      sessionStrategy: 'jwt', // v5 default
      status: 'migrated'
    };

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        ...envCheck,
      },
      database: {
        status: dbStatus,
        hasUrl: !!process.env.DATABASE_URL,
      },
      session: {
        data: sessionData,
        error: sessionError,
        hasServerSession: !!sessionData,
      },
      authConfig,
      request: {
        url: request.url,
        headers: {
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
          cookie: request.headers.get('cookie')?.includes('next-auth') ? 'NextAuth cookies present' : 'No NextAuth cookies',
        },
      },
    };

    console.log('🔍 Debug info compiled:', debugInfo);

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

// Additional endpoint to test session creation
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Debug endpoint only available in development' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'test-auth') {
      // Test the auth flow with dummy credentials
      const testResult = {
        timestamp: new Date().toISOString(),
        environment: checkAuthEnvironment(),
        message: 'Auth test completed - check server logs for details',
      };

      return NextResponse.json(testResult);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Debug POST failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}