import { NextResponse } from 'next/server';

console.log('Employers test API route loaded');

export async function GET() {
  console.log('Employers test GET request received');
  return NextResponse.json({ message: 'Employers API works!' });
}