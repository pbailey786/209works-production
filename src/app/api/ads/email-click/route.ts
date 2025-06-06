import { NextRequest, NextResponse } from 'next/server';
import { AdRotationService } from '@/lib/services/adRotationService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('adId');
    const targetUrl = searchParams.get('targetUrl');
    const emailId = searchParams.get('emailId');
    const recipientId = searchParams.get('recipientId');
    const source = searchParams.get('source') || 'email';
    const placement = searchParams.get('placement') || 'inline';

    // Validate required parameters
    if (!adId || !targetUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: adId and targetUrl' },
        { status: 400 }
      );
    }

    // Validate target URL
    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid target URL' },
        { status: 400 }
      );
    }

    // Record the click
    try {
      await AdRotationService.recordClick(adId, {
        sessionId: `email_${emailId || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: recipientId || undefined,
        targetUrl,
        userAgent: request.headers.get('user-agent') || 'Email Client',
        referrer: source,
      });
    } catch (error) {
      console.error('Error recording email click:', error);
      // Continue with redirect even if tracking fails
    }

    // Redirect to target URL
    return NextResponse.redirect(targetUrl, 302);
  } catch (error) {
    console.error('Error in email click tracking:', error);

    // If we have a target URL, still redirect even on error
    const targetUrl = new URL(request.url).searchParams.get('targetUrl');
    if (targetUrl) {
      try {
        new URL(targetUrl);
        return NextResponse.redirect(targetUrl, 302);
      } catch {
        // Invalid URL, return error
      }
    }

    return NextResponse.json(
      { error: 'Failed to process click tracking' },
      { status: 500 }
    );
  }
}
