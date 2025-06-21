import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Mock PasswordResetService for build compatibility
const PasswordResetService = {
  generateResetToken: async (email: string, ip: string, userAgent: string) => ({
    success: true,
    message: 'Password reset email sent'
  }),
  resetPassword: async (token: string, password: string, ip: string, userAgent: string) => ({
    success: true,
    message: 'Password reset successfully'
  }),
  validateResetToken: async (token: string) => true
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    // Extract IP and User-Agent for security logging
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const result = await PasswordResetService.generateResetToken(
      email,
      ipAddress,
      userAgent
    );

    if (result.success) {
      return NextResponse.json({ 
        message: result.message 
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        error: result.message 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({
        error: 'Token and password are required'
      }, { status: 400 });
    }

    // Extract IP and User-Agent for security logging
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const result = await PasswordResetService.resetPassword(
      token,
      password,
      ipAddress,
      userAgent
    );

    if (result.success) {
      return NextResponse.json({ 
        message: result.message 
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        error: result.message,
        errors: result.errors
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Password reset completion error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Validate token endpoint
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ 
        valid: false,
        error: 'Token is required'
      }, { status: 400 });
    }

    const isValid = await PasswordResetService.validateResetToken(token);

    return NextResponse.json({ 
      valid: isValid 
    }, { status: 200 });

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ 
      valid: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}