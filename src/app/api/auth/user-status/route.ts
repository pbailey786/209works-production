import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  console.log('🔍 USER-STATUS API - Called');
  try {
    const clerkUser = await currentUser();
    console.log('🔍 USER-STATUS API - Clerk user:', clerkUser?.emailAddresses[0]?.emailAddress || 'none');
    
    if (!clerkUser) {
      console.log('❌ USER-STATUS API - Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      console.log('❌ USER-STATUS API - No email found');
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    console.log('💾 USER-STATUS API - Looking up user in database:', userEmail);

    // Get user's status from database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingCompleted: true,
        employerOnboardingCompleted: true,
      },
    });

    console.log('💾 USER-STATUS API - Database result:', user || 'not found');

    if (!user) {
      console.log('❌ USER-STATUS API - User not found in database');
      return NextResponse.json({ 
        user: null,
        message: 'User not found in database'
      });
    }

    console.log('✅ USER-STATUS API - Returning user data');
    return NextResponse.json({ user });
  } catch (error) {
    console.error('❌ USER-STATUS API - Error:', error);
    return NextResponse.json(
      { error: 'Failed to get user status' },
      { status: 500 }
    );
  }
}