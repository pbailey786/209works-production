import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Debug endpoint only available in development' },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const delay = parseInt(url.searchParams.get('delay') || '0', 10);
  const fail = url.searchParams.get('fail') === 'true';
  
  try {
    console.log(`⏰ Timeout test: delay=${delay}ms, fail=${fail}`);
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    if (fail) {
      throw new Error('Intentional failure for testing');
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      delay,
      message: `Request completed successfully after ${delay}ms delay`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        delay,
      },
      { status: 500 }
    );
  }
}