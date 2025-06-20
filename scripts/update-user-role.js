#!/usr/bin/env node

/**
 * Script to update a user's role to 'employer' for testing purposes
 * Usage: node scripts/update-user-role.js <email>
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserRole(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.email} (ID: ${user.id})`);
    console.log(`📋 Current role: ${user.role}`);

    if (user.role === 'employer') {
      console.log(`✅ User is already an employer!`);
      return;
    }

    // Update the user role to employer
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        role: 'employer',
        // Also mark onboarding as completed for employers
        onboardingCompleted: true
      }
    });

    console.log(`🎉 Successfully updated user role!`);
    console.log(`📋 New role: ${updatedUser.role}`);
    console.log(`✅ Onboarding completed: ${updatedUser.onboardingCompleted}`);

  } catch (error) {
    console.error('❌ Error updating user role:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/update-user-role.js <email>');
  process.exit(1);
}

updateUserRole(email);
