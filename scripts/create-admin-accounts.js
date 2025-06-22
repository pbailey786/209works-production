#!/usr/bin/env node

/**
 * Create Fresh Admin Accounts for 209 Works
 * Run this after clean slate user reset
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Admin account configurations
const ADMIN_ACCOUNTS = [
  {
    email: 'admin@209.works',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    credits: 1000, // Lots of credits for testing
  },
  {
    email: 'pbailey786@gmail.com', // Your email
    firstName: 'Paul',
    lastName: 'Bailey',
    role: 'admin',
    credits: 1000,
  },
  // Add more admin accounts as needed
];

async function createAdminAccounts() {
  console.log('🚀 Creating fresh admin accounts for 209 Works...\n');

  try {
    for (const adminData of ADMIN_ACCOUNTS) {
      console.log(`Creating admin account: ${adminData.email}`);

      // Create user record
      const user = await prisma.user.create({
        data: {
          email: adminData.email,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          role: adminData.role,
          credits: adminData.credits,
          emailVerified: true, // Pre-verify admin accounts
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Created admin user: ${user.email} (ID: ${user.id})`);

      // Create employer profile for admin (so they can post jobs)
      const employerProfile = await prisma.employerProfile.create({
        data: {
          userId: user.id,
          companyName: '209 Works Admin',
          companyDescription: 'Administrative account for 209 Works platform',
          industry: 'Technology',
          companySize: '1-10',
          website: 'https://209.works',
          location: 'Stockton, CA',
          verified: true, // Pre-verify admin company
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Created employer profile for: ${user.email}`);

      // Create job seeker profile too (for testing)
      const jobSeekerProfile = await prisma.jobSeekerProfile.create({
        data: {
          userId: user.id,
          title: 'Platform Administrator',
          bio: 'Administrator of the 209 Works job platform',
          location: 'Stockton, CA',
          experienceLevel: 'senior',
          skills: [
            'Platform Management',
            'User Support',
            'System Administration',
          ],
          desiredSalaryMin: 100000,
          desiredSalaryMax: 150000,
          availability: 'full-time',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Created job seeker profile for: ${user.email}\n`);
    }

    // Create some sample data for testing
    console.log('📊 Creating sample data for testing...');

    // Sample job for testing
    const sampleJob = await prisma.job.create({
      data: {
        title: 'Software Developer - Test Job',
        description:
          'This is a sample job posting for testing the 209 Works platform.',
        company: '209 Works',
        location: 'Stockton, CA',
        salaryMin: 70000,
        salaryMax: 90000,
        type: 'full-time',
        experienceLevel: 'mid',
        skills: ['JavaScript', 'React', 'Node.js'],
        benefits: ['Health Insurance', 'Remote Work', '401k'],
        requirements: ['3+ years experience', "Bachelor's degree preferred"],
        applicationMethod: 'internal',
        status: 'active',
        featured: true,
        urgent: false,
        remote: false,
        postedById: 1, // First admin user
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    console.log(
      `✅ Created sample job: ${sampleJob.title} (ID: ${sampleJob.id})`
    );

    console.log('\n🎉 Admin account setup complete!');
    console.log('\n📋 Admin Account Summary:');

    for (const admin of ADMIN_ACCOUNTS) {
      console.log(
        `   • ${admin.email} - ${admin.role} (${admin.credits} credits)`
      );
    }

    console.log('\n🔑 Next Steps:');
    console.log('1. Go to https://209.works/sign-up');
    console.log('2. Sign up with one of the admin emails above');
    console.log('3. Clerk will create the authentication account');
    console.log(
      '4. The system will automatically link to the database profile'
    );
    console.log("5. You'll have full admin access immediately");

    console.log('\n⚠️  Important Notes:');
    console.log('• Admin accounts are pre-verified and have 1000 credits');
    console.log('• Both employer and job seeker profiles are created');
    console.log('• Sample job created for testing functionality');
    console.log('• All accounts have admin role permissions');
  } catch (error) {
    console.error('❌ Error creating admin accounts:', error);

    if (error.code === 'P2002') {
      console.log(
        '\n💡 Tip: If you get unique constraint errors, the accounts may already exist.'
      );
      console.log(
        '   Run the clean slate script first to delete existing accounts.'
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to verify admin accounts
async function verifyAdminAccounts() {
  console.log('🔍 Verifying admin accounts...\n');

  try {
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      include: {
        employerProfile: true,
        jobSeekerProfile: true,
      },
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin accounts found');
      return false;
    }

    console.log(`✅ Found ${adminUsers.length} admin account(s):`);

    for (const user of adminUsers) {
      console.log(`   • ${user.email} - ${user.credits} credits`);
      console.log(
        `     - Employer profile: ${user.employerProfile ? '✅' : '❌'}`
      );
      console.log(
        `     - Job seeker profile: ${user.jobSeekerProfile ? '✅' : '❌'}`
      );
    }

    return true;
  } catch (error) {
    console.error('❌ Error verifying admin accounts:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--verify') || args.includes('-v')) {
    verifyAdminAccounts();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
209 Works Admin Account Creator

Usage:
  node create-admin-accounts.js          # Create fresh admin accounts
  node create-admin-accounts.js --verify # Verify existing admin accounts
  node create-admin-accounts.js --help   # Show this help

This script will:
  1. Create admin user accounts in the database
  2. Set up both employer and job seeker profiles
  3. Give admin accounts 1000 credits
  4. Create sample data for testing

Note: Run the clean slate script first if you want to delete existing accounts.
    `);
  } else {
    createAdminAccounts();
  }
}

module.exports = { createAdminAccounts, verifyAdminAccounts };
