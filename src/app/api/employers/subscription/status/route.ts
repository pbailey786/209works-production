import { NextRequest, NextResponse } from 'next/server';

// Temporary placeholder - subscription status needs implementation
export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Subscription status is temporarily unavailable' }, { status: 503 });
}