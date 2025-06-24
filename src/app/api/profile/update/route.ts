import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';
import { ensureUserExists } from '@/lib/auth/user-sync';

export async function POST(req: NextRequest) {
  try {
    // Ensure user exists in database (auto-sync with Clerk)
    const baseUser = await ensureUserExists();
    
    // Get current user from database
    const currentUser = await prisma.user.findUnique({
      where: { email: baseUser.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { 
      name, 
      email, 
      bio, 
      location, 
      phone, 
      website, 
      companyWebsite,
      skills,
      profileStrength
    } = await req.json();

    // Update data object with only provided fields
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (phone !== undefined) updateData.phoneNumber = phone;
    if (companyWebsite !== undefined) updateData.companyWebsite = companyWebsite;
    if (skills !== undefined) updateData.skills = skills;
    if (profileStrength !== undefined) updateData.profileStrength = profileStrength;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        location: true,
        phoneNumber: true,
        companyWebsite: true,
        skills: true,
        profileStrength: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
