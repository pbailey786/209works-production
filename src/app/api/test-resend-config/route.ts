import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to check Resend configuration (no auth required for debugging)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'check';

    if (action === 'check') {
      // Check environment variables
      const hasResendKey = !!process.env.RESEND_API_KEY;
      const hasFromEmail = !!process.env.RESEND_EMAIL_FROM;
      const resendKeyLength = process.env.RESEND_API_KEY?.length || 0;
      const fromEmail = process.env.RESEND_EMAIL_FROM || 'not-set';

      return NextResponse.json({
        success: true,
        config: {
          hasResendKey,
          hasFromEmail,
          resendKeyLength,
          fromEmail,
          resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 8) + '...' || 'not-set',
          nodeEnv: process.env.NODE_ENV,
        },
        status: hasResendKey && hasFromEmail ? 'READY' : 'MISSING_CONFIG',
        message: hasResendKey && hasFromEmail 
          ? 'Resend configuration appears complete'
          : 'Missing required Resend configuration',
      });
    } else if (action === 'test') {
      // Test Resend API connection
      if (!process.env.RESEND_API_KEY) {
        return NextResponse.json({
          success: false,
          error: 'RESEND_API_KEY not configured',
          config: {
            hasResendKey: false,
            hasFromEmail: !!process.env.RESEND_EMAIL_FROM,
          }
        });
      }

      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Test API connection by getting domains (this doesn't send an email)
        const domains = await resend.domains.list();

        return NextResponse.json({
          success: true,
          message: 'Resend API connection successful',
          config: {
            hasResendKey: true,
            hasFromEmail: !!process.env.RESEND_EMAIL_FROM,
            fromEmail: process.env.RESEND_EMAIL_FROM,
            resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 8) + '...',
          },
          apiTest: {
            connected: true,
            domainsCount: Array.isArray(domains.data) ? domains.data.length : 0,
          }
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          config: {
            hasResendKey: true,
            hasFromEmail: !!process.env.RESEND_EMAIL_FROM,
            fromEmail: process.env.RESEND_EMAIL_FROM,
          },
          apiTest: {
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        });
      }
    } else {
      return NextResponse.json({
        message: 'Resend Configuration Test Endpoint',
        usage: {
          check: '/api/test-resend-config?action=check',
          test: '/api/test-resend-config?action=test',
        },
      });
    }

  } catch (error) {
    console.error('Test Resend config error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
