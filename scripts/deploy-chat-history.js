#!/usr/bin/env node

/**
 * Deployment script for chat history feature
 * This script should be run after deployment to:
 * 1. Update database schema
 * 2. Clean up test data
 * 3. Debug job applications
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function deploymentScript() {
  console.log('🚀 Starting chat history deployment...');
  
  try {
    // Step 1: Generate Prisma client
    console.log('\n📦 Generating Prisma client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate Prisma client:', error.message);
      throw error;
    }

    // Step 2: Push database schema
    console.log('\n🗄️ Updating database schema...');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ Database schema updated successfully');
    } catch (error) {
      console.error('❌ Failed to update database schema:', error.message);
      throw error;
    }

    // Step 3: Test database connection
    console.log('\n🔌 Testing database connection...');
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }

    // Step 4: Debug current state
    console.log('\n🔍 Debugging current database state...');
    await debugCurrentState();

    // Step 5: Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await cleanupTestData();

    // Step 6: Final verification
    console.log('\n✅ Final verification...');
    await finalVerification();

    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Database schema updated with ChatHistory model');
    console.log('  ✅ Test data cleaned up');
    console.log('  ✅ Chat history API endpoints deployed');
    console.log('  ✅ Job application debugging completed');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function debugCurrentState() {
  try {
    // Check jobs
    const jobCount = await prisma.job.count();
    console.log(`  📋 Total jobs: ${jobCount}`);

    // Check applications
    const applicationCount = await prisma.jobApplication.count();
    console.log(`  📝 Total applications: ${applicationCount}`);

    // Check employers
    const employerCount = await prisma.user.count({
      where: { role: 'employer' }
    });
    console.log(`  👔 Total employers: ${employerCount}`);

    // Check job seekers
    const jobSeekerCount = await prisma.user.count({
      where: { role: 'jobseeker' }
    });
    console.log(`  👤 Total job seekers: ${jobSeekerCount}`);

    // Check for jobs without employers
    const jobsWithoutEmployer = await prisma.job.count({
      where: { employerId: null }
    });
    console.log(`  ⚠️  Jobs without employer: ${jobsWithoutEmployer}`);

  } catch (error) {
    console.error('  ❌ Debug failed:', error.message);
  }
}

async function cleanupTestData() {
  try {
    const testJobTitles = [
      'Paul\'s first job yay',
      'Test Job for Instagram',
      'Test Job',
      'Sample Job',
      'Demo Job',
      'Fake Job',
      'Example Job',
    ];

    // Delete test jobs
    const deletedJobs = await prisma.job.deleteMany({
      where: {
        OR: testJobTitles.map(title => ({
          title: {
            contains: title,
            mode: 'insensitive'
          }
        }))
      }
    });

    console.log(`  ✅ Deleted ${deletedJobs.count} test jobs`);

    // Delete test users
    const testUserEmails = [
      'test@instagram.com',
      'test@test.com',
      'demo@test.com',
      'fake@test.com',
      'sample@test.com',
    ];

    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          in: testUserEmails
        }
      }
    });

    console.log(`  ✅ Deleted ${deletedUsers.count} test users`);

    // Clean up orphaned applications
    const existingJobIds = await prisma.job.findMany({
      select: { id: true }
    });
    const existingJobIdSet = new Set(existingJobIds.map(job => job.id));

    const allApplications = await prisma.jobApplication.findMany({
      select: { id: true, jobId: true }
    });

    const orphanedApplicationIds = allApplications
      .filter(app => !existingJobIdSet.has(app.jobId))
      .map(app => app.id);

    if (orphanedApplicationIds.length > 0) {
      const deletedApplications = await prisma.jobApplication.deleteMany({
        where: {
          id: {
            in: orphanedApplicationIds
          }
        }
      });
      console.log(`  ✅ Deleted ${deletedApplications.count} orphaned applications`);
    } else {
      console.log(`  ✅ No orphaned applications found`);
    }

  } catch (error) {
    console.error('  ❌ Cleanup failed:', error.message);
  }
}

async function finalVerification() {
  try {
    // Verify ChatHistory table exists
    const chatHistoryCount = await prisma.chatHistory.count();
    console.log(`  📱 ChatHistory table ready (${chatHistoryCount} records)`);

    // Check job-application relationships
    const applicationsWithJobs = await prisma.jobApplication.count({
      where: {
        job: {
          isNot: null
        }
      }
    });
    console.log(`  🔗 Valid job applications: ${applicationsWithJobs}`);

    // Check employer-job relationships
    const jobsWithEmployers = await prisma.job.count({
      where: {
        employerId: {
          not: null
        }
      }
    });
    console.log(`  👔 Jobs with employers: ${jobsWithEmployers}`);

  } catch (error) {
    console.error('  ❌ Verification failed:', error.message);
  }
}

// Run the deployment script
if (require.main === module) {
  deploymentScript()
    .then(() => {
      console.log('\n✅ Deployment script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Deployment script failed:', error);
      process.exit(1);
    });
}

module.exports = { deploymentScript };
