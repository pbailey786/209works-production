import { NextRequest, NextResponse } from 'next/server';

// Temporary placeholder - company logo upload needs implementation
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Logo upload is temporarily unavailable' }, { status: 503 });
}