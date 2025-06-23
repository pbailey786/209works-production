import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email: user.emailAddresses[0]?.emailAddress },
    });

    if (existingUser) {
      return NextResponse.json({ user: existingUser });
    }

    // Create new user in database
    const newUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        passwordHash: 'clerk_managed', // Placeholder since Clerk handles authentication
        role: 'jobseeker', // Default role - can be changed during onboarding
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}