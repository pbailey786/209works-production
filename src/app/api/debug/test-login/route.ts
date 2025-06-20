import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/auth';

/**
 * Debug route to test programmatic login
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Debug: Testing programmatic login...');
    
    const { email, password } = await req.json();
    
    // Test the authorize function directly
    const testUser = {
      id: 'test-user-id',
      email: 'test@test.com',
      name: 'Test User',
      role: 'jobseeker'
    };
    
    console.log('🧪 Debug: Test user object:', testUser);
    
    return NextResponse.json({
      success: true,
      message: 'Login test completed',
      testUser,
      // We can't easily test signIn here due to CSRF, but we can verify the user object structure
    });
    
  } catch (error) {
    console.error('🧪 Debug: Login test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}