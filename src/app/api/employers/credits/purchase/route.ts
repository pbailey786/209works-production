import { NextRequest, NextResponse } from 'next/server';

// Temporary placeholder - needs fixing
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'This endpoint is temporarily unavailable' }, { status: 503 });
}