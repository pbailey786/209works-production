import { NextRequest, NextResponse } from 'next/server';
import { AdRotationService } from '@/lib/services/adRotationService';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('adId');
    const emailId = searchParams.get('emailId');
    const recipientId = searchParams.get('recipientId');
    const source = searchParams.get('source') || 'email';
    const placement = searchParams.get('placement') || 'inline';

    if (!adId) {
      // Return 1x1 transparent pixel even for invalid requests
      return new NextResponse(
        Buffer.from(
          'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          'base64'
        ),
        {
          status: 200,
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    // Record the impression
    try {
      await AdRotationService.recordImpression(adId, {
        sessionId: `email_${emailId || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: recipientId || undefined,
        page: `email/${emailId || 'unknown'}`,
        position: placement,
        userAgent: request.headers.get('user-agent') || 'Email Client',
        referrer: source,
      });
    } catch (error) {
      console.error('Error recording email impression:', error);
      // Still return pixel even if tracking fails
    }

    // Return 1x1 transparent tracking pixel
    return new NextResponse(
      Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in email impression tracking:', error);

    // Always return a tracking pixel, even on error
    return new NextResponse(
      Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}
