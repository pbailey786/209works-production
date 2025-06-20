import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/iron-session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    
    console.log('🔍 Iron Session data:', {
      isLoggedIn: session.isLoggedIn,
      hasUser: !!session.user,
      userId: session.user?.id,
    });
    
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: session.user,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: 'Failed to check session',
    });
  }
}