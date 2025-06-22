import { NextRequest, NextResponse } from 'next/server';

// Ultra-simple email test that bypasses all complex logic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({
        error: 'Email parameter required',
        usage: '/api/simple-email-test?email=your@email.com'
      });
    }

    // Check environment variables first
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY not configured in environment variables',
        config: {
          hasResendKey: false,
          hasFromEmail: !!process.env.RESEND_EMAIL_FROM,
          nodeEnv: process.env.NODE_ENV,
        }
      });
    }

    if (!process.env.RESEND_EMAIL_FROM) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_EMAIL_FROM not configured in environment variables',
        config: {
          hasResendKey: true,
          hasFromEmail: false,
          nodeEnv: process.env.NODE_ENV,
        }
      });
    }

    // Try to send the simplest possible email
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const result = await resend.emails.send({
        from: process.env.RESEND_EMAIL_FROM,
        to: email,
        subject: '209 Works - Simple Email Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ff6b35;">209 Works Email Test</h1>
            <p>This is the simplest possible test email.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
            <p><strong>From:</strong> ${process.env.RESEND_EMAIL_FROM}</p>
            <p>If you received this email, the basic Resend configuration is working!</p>
          </div>
        `,
        text: `209 Works Email Test - Simple test email sent at ${new Date().toISOString()}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully!',
        result: {
          id: result.data?.id,
          from: process.env.RESEND_EMAIL_FROM,
          to: email,
          timestamp: new Date().toISOString(),
        },
        config: {
          hasResendKey: true,
          hasFromEmail: true,
          fromEmail: process.env.RESEND_EMAIL_FROM,
          nodeEnv: process.env.NODE_ENV,
        }
      });

    } catch (emailError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to send email',
        details: emailError instanceof Error ? emailError.message : 'Unknown error',
        config: {
          hasResendKey: true,
          hasFromEmail: true,
          fromEmail: process.env.RESEND_EMAIL_FROM,
          nodeEnv: process.env.NODE_ENV,
        }
      });
    }

  } catch (error) {
    console.error('Simple email test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'general_error'
      },
      { status: 500 }
    );
  }
}
