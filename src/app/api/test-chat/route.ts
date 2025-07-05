import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Test chat API received:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Chat API is working',
      received: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test chat API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}