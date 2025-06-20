import { NextRequest, NextResponse } from '@/components/ui/card';
import { getSessionFromRequest, destroySession } from '@/lib/auth/iron-session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    
    // Clear session data
    destroySession(session);
    
    console.log('✅ User logged out with Iron Session');
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}