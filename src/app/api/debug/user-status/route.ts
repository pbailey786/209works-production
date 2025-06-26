import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function GET() {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingCompleted: true,
        employerOnboardingCompleted: true,
        name: true,
      },
    });

    return NextResponse.json({
      clerkUser: {
        id: clerkUser.id,
        email: userEmail,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
      },
      databaseUser: user,
    });

  } catch (error) {
    console.error('Debug user status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}