import { NextRequest, NextResponse } from 'next/server';

// Temporary placeholder - needs implementation
export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'This endpoint is temporarily unavailable' }, { status: 503 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'This endpoint is temporarily unavailable' }, { status: 503 });
}
