import { NextRequest, NextResponse } from 'next/server';
import { emailAgent } from '@/lib/agents/email-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, userType, companyName } = body;

    // Validate required fields
    if (!email || !name || !userType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send welcome email
    const result = await emailAgent.sendWelcomeEmail({
      email,
      name,
      userType,
      companyName,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
