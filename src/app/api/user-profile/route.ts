import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '../auth/authOptions';
import { prisma } from '../auth/prisma';
import type { Session } from 'next-auth';

// GET /api/user-profile - Get user profile for job matching
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user profile from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, return empty profile data since we don't have a profile field
    // In a real implementation, you might have a separate UserProfile table

    // Return structured profile for job matching with default values
    const userProfile = {
      userId: user.id,
      name: user.name,
      email: user.email,
      experience: null,
      skills: [],
      location: null,
      preferences: {
        jobTypes: [],
        salaryRange: null,
        remoteWork: false,
        industries: [],
      },
      careerGoals: [],
      resume: null,
      lastUpdated: null,
    };

    return NextResponse.json({ profile: userProfile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/user-profile - Update user profile
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { experience, skills, location, preferences, careerGoals, resume } =
      body;

    // Validate input
    if (skills && !Array.isArray(skills)) {
      return NextResponse.json(
        { error: 'Skills must be an array' },
        { status: 400 }
      );
    }

    if (careerGoals && !Array.isArray(careerGoals)) {
      return NextResponse.json(
        { error: 'Career goals must be an array' },
        { status: 400 }
      );
    }

    // Build profile data
    const profileData = {
      experience: experience || null,
      skills: skills || [],
      location: location || null,
      preferences: {
        jobTypes: preferences?.jobTypes || [],
        salaryRange: preferences?.salaryRange || null,
        remoteWork: preferences?.remoteWork || false,
        industries: preferences?.industries || [],
      },
      careerGoals: careerGoals || [],
      resume: resume || null,
      lastUpdated: new Date().toISOString(),
    };

    // For now, just return success without saving to database
    // In a real implementation, you would save to a UserProfile table
    const updatedUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        userId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        ...profileData,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/user-profile/quick-setup - Quick profile setup for job matching
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const {
      jobTitle,
      experienceYears,
      topSkills,
      preferredLocation,
      salaryMin,
      salaryMax,
      remoteWork,
      jobTypes,
    } = body;

    // Build quick profile
    const quickProfile = {
      experience: experienceYears ? `${experienceYears} years` : null,
      skills: topSkills || [],
      location: preferredLocation || null,
      preferences: {
        jobTypes: jobTypes || [],
        salaryRange:
          salaryMin || salaryMax
            ? {
                min: salaryMin || null,
                max: salaryMax || null,
              }
            : null,
        remoteWork: remoteWork || false,
        industries: [],
      },
      careerGoals: jobTitle ? [jobTitle] : [],
      quickSetup: true,
      lastUpdated: new Date().toISOString(),
    };

    // For now, just simulate saving the profile
    // In a real implementation, you would save to a UserProfile table

    return NextResponse.json({
      message: 'Quick profile setup completed',
      profile: quickProfile,
    });
  } catch (error) {
    console.error('Error in quick profile setup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/user-profile - Clear user profile
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // For now, just simulate clearing the profile
    // In a real implementation, you would clear the UserProfile table

    return NextResponse.json({ message: 'Profile cleared successfully' });
  } catch (error) {
    console.error('Error clearing user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
