import { NextRequest, NextResponse } from 'next/server';

// Temporary placeholder - individual applicant management needs implementation
export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Individual applicant view is temporarily unavailable' }, { status: 503 });
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ error: 'Applicant updates are temporarily unavailable' }, { status: 503 });
}