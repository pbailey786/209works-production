import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { role } = await request.json();

    if (!role || (role !== 'jobseeker' && role !== 'employer')) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    // Update user role in database (create if doesn't exist)
    const updatedUser = await prisma.user.upsert({
      where: { email: userEmail },
      update: { role },
      create: {
        id: user.id,
        email: userEmail,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        passwordHash: 'clerk_managed',
        role,
        onboardingCompleted: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}