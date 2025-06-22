import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next'; // TODO: Replace with Clerk
import authOptions from '../../auth/authOptions';
import { prisma } from '../../auth/prisma';
// import type { Session } from 'next-auth'; // TODO: Replace with Clerk
import { normalizeEmail } from '@/lib/utils/email-utils';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    // TODO: Replace with Clerk
  const session = { user: { role: "admin", email: "admin@209.works", name: "Admin User", id: "admin-user-id" } } // Mock session as Session | null;
    if (!session!.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user by email
    const currentUser = await prisma.user.findUnique({
      where: { email: session!.user?.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { name, email, bio, location, phone, website, companyWebsite } =
      await req.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Normalize email for case-insensitive comparison
    const normalizedEmail = normalizeEmail(email);
    const normalizedSessionEmail = normalizeEmail(session!.user?.email || '');

    // Check if email is already taken by another user
    if (normalizedEmail !== normalizedSessionEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser && existingUser.id !== currentUser.id) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name: name || null,
        email: normalizedEmail,
        bio: bio || null,
        location: location || null,
        phoneNumber: phone || null, // Use phoneNumber field
        companyWebsite: companyWebsite || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        location: true,
        phoneNumber: true,
        companyWebsite: true,
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
