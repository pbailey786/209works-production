import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Clearing session cookies...');
    
    const cookieStore = cookies();
    
    // Clear all NextAuth cookies
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      'next-auth.pkce.code_verifier',
      '__Secure-next-auth.pkce.code_verifier'
    ];
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Session cleared successfully',
      clearedCookies: cookiesToClear
    });
    
    // Clear each cookie
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });
    
    console.log('✅ Session cookies cleared');
    
    return response;
  } catch (error) {
    console.error('❌ Error clearing session:', error);
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}
