import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const user = await currentUser();
    
    return NextResponse.json({
      authenticated: !!user,
      userId: user?.id || null,
      email: user?.emailAddresses[0]?.emailAddress || null,
      firstName: user?.firstName || null,
      lastName: user?.lastName || null,
      clerkEnabled: process.env.NEXT_PUBLIC_ENABLE_CLERK_AUTH === 'true',
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check auth status',
      details: error instanceof Error ? error.message : 'Unknown error',
      clerkEnabled: process.env.NEXT_PUBLIC_ENABLE_CLERK_AUTH === 'true',
    }, { status: 500 });
  }
}