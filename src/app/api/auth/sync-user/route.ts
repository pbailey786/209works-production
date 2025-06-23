import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    console.log('🔄 Syncing user:', userEmail, 'with Clerk ID:', user.id);

    // Check if user already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (existingUser) {
      console.log('✅ User already exists:', existingUser.id);
      return NextResponse.json({ user: existingUser });
    }

    console.log('➕ Creating new user in database...');

    // Create new user in database
    const newUser = await prisma.user.create({
      data: {
        id: user.id,
        email: userEmail,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        passwordHash: 'clerk_managed', // Placeholder since Clerk handles authentication
        role: 'jobseeker', // Default role - can be changed during onboarding
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ User created successfully:', newUser.id);
    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error('❌ Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}