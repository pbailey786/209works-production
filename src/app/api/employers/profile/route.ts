import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

// GET /api/employers/profile - Get employer profile for communication templates
export async function GET(request: NextRequest) {
  try {
    // Check authentication with Clerk
    const clerkUser = await currentUser();

    if (!clerkUser?.emailAddresses[0]?.emailAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0].emailAddress;

    // Get the current user from database
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        employerProfile: true,
      },
    });

    if (!user || (user.role !== 'employer' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return profile data needed for email templates
    const profile = {
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      companyName: user.employerProfile?.companyName,
      website: user.companyWebsite,
      companySize: user.companySize,
      industry: user.employerProfile?.industryType,
      location: user.employerProfile?.location,
    };

    return NextResponse.json(profile);

  } catch (error) {
    console.error('Error fetching employer profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}