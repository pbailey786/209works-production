import { NextRequest, NextResponse } from 'next/server';

// Temporary placeholder - bulk upload needs fixing
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Bulk upload is temporarily unavailable' }, { status: 503 });
}