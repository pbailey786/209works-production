import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/database/prisma';

/**
 * Ensures a Clerk user exists in our database
 * Creates the user if they don't exist
 * Returns the user data
 */
export async function ensureUserExists() {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      throw new Error('Not authenticated');
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      throw new Error('No email found');
    }

    // Check if user already exists in database
    let existingUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create new user in database
    const newUser = await prisma.user.create({
      data: {
        id: clerkUser.id,
        email: userEmail,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
        passwordHash: 'clerk_managed',
        role: 'jobseeker',
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Auto-created user:', newUser.id);
    return newUser;
  } catch (error) {
    console.error('❌ Error ensuring user exists:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    console.error('❌ Clerk user data:', clerkUser ? {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName
    } : 'No Clerk user');
    throw error;
  }
}

/**
 * Get user data with automatic creation if needed
 */
export async function getUserWithAutoSync() {
  try {
    const user = await ensureUserExists();
    return user;
  } catch (error) {
    console.error('Error getting user with auto-sync:', error);
    return null;
  }
}