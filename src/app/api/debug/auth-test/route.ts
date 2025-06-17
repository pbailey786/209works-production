import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '../../auth/authOptions';

export async function GET(req: NextRequest) {
  try {
    console.log('🚀 Auth test endpoint called');
    
    // Test getServerSession
    const session = await getServerSession(authOptions);
    console.log('📋 Session result:', session);
    
    return NextResponse.json({
      success: true,
      session: session,
      timestamp: new Date().toISOString(),
      authOptionsCheck: {
        hasProviders: !!authOptions.providers,
        providersCount: authOptions.providers?.length || 0,
        sessionStrategy: authOptions.session?.strategy,
        hasCallbacks: !!authOptions.callbacks,
      }
    });
  } catch (error) {
    console.error('❌ Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}