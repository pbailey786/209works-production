import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook endpoint is reachable',
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    console.log('Test webhook received:', {
      headers: Object.fromEntries(req.headers.entries()),
      bodyLength: body.length,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      received: true,
      message: 'Test webhook processed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ 
      error: 'Test webhook failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}