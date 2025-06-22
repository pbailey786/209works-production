#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log('🧹 Starting cleanup of test/fake data...');

  try {
    // 1. Remove test jobs with obvious fake titles
    console.log('📋 Cleaning up test jobs...');

    const testJobTitles = [
      "Paul's first job yay",
      'Test Job for Instagram',
      'Test Job',
      'Sample Job',
      'Demo Job',
      'Fake Job',
      'Example Job',
    ];

    const testJobSources = [
      'test',
      'fake',
      'demo',
      'sample',
      'free_basic_post', // Remove free basic posts that might be test data
    ];

    // Delete jobs with test titles
    const deletedJobsByTitle = await prisma.job.deleteMany({
      where: {
        OR: testJobTitles.map(title => ({
          title: {
            contains: title,
            mode: 'insensitive',
          },
        })),
      },
    });

    console.log(
      `  ✅ Deleted ${deletedJobsByTitle.count} jobs with test titles`
    );

    // Delete jobs from test sources (but be careful with free_basic_post)
    const deletedJobsBySource = await prisma.job.deleteMany({
      where: {
        source: {
          in: testJobSources.filter(source => source !== 'free_basic_post'),
        },
      },
    });

    console.log(
      `  ✅ Deleted ${deletedJobsBySource.count} jobs from test sources`
    );

    // 2. Remove test users
    console.log('👤 Cleaning up test users...');

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
          in: testUserEmails,
        },
      },
    });

    console.log(`  ✅ Deleted ${deletedUsers.count} test users`);

    // 3. Remove Instagram test posts
    console.log('📸 Cleaning up test Instagram posts...');

    const deletedInstagramPosts = await prisma.instagramPost.deleteMany({
      where: {
        OR: [
          {
            caption: {
              contains: 'test',
              mode: 'insensitive',
            },
          },
          {
            hashtags: {
              has: 'test',
            },
          },
        ],
      },
    });

    console.log(
      `  ✅ Deleted ${deletedInstagramPosts.count} test Instagram posts`
    );

    // 4. Remove test Instagram templates
    console.log('🎨 Cleaning up test Instagram templates...');

    const deletedTemplates = await prisma.instagramTemplate.deleteMany({
      where: {
        name: {
          contains: 'test',
          mode: 'insensitive',
        },
      },
    });

    console.log(
      `  ✅ Deleted ${deletedTemplates.count} test Instagram templates`
    );

    // 5. Remove test Instagram schedules
    console.log('⏰ Cleaning up test Instagram schedules...');

    const deletedSchedules = await prisma.instagramSchedule.deleteMany({
      where: {
        name: {
          contains: 'test',
          mode: 'insensitive',
        },
      },
    });

    console.log(
      `  ✅ Deleted ${deletedSchedules.count} test Instagram schedules`
    );

    // 6. Clean up orphaned job applications (applications for deleted jobs)
    console.log('📝 Cleaning up orphaned job applications...');

    // First, find all job IDs that exist
    const existingJobIds = await prisma.job.findMany({
      select: { id: true },
    });
    const existingJobIdSet = new Set(existingJobIds.map(job => job.id));

    // Find applications for non-existent jobs
    const allApplications = await prisma.jobApplication.findMany({
      select: { id: true, jobId: true },
    });

    const orphanedApplicationIds = allApplications
      .filter(app => !existingJobIdSet.has(app.jobId))
      .map(app => app.id);

    if (orphanedApplicationIds.length > 0) {
      const deletedApplications = await prisma.jobApplication.deleteMany({
        where: {
          id: {
            in: orphanedApplicationIds,
          },
        },
      });
      console.log(
        `  ✅ Deleted ${deletedApplications.count} orphaned job applications`
      );
    } else {
      console.log(`  ✅ No orphaned job applications found`);
    }

    // 7. Clean up jobs with suspicious patterns (optional - be careful)
    console.log('🔍 Checking for suspicious job patterns...');

    const suspiciousJobs = await prisma.job.findMany({
      where: {
        OR: [
          {
            description: {
              contains: 'test',
              mode: 'insensitive',
            },
          },
          {
            company: {
              contains: 'test',
              mode: 'insensitive',
            },
          },
          {
            url: {
              contains: 'example.com',
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        company: true,
        source: true,
      },
    });

    console.log(
      `  ⚠️  Found ${suspiciousJobs.length} potentially suspicious jobs:`
    );
    suspiciousJobs.forEach(job => {
      console.log(
        `    - "${job.title}" by ${job.company} (source: ${job.source})`
      );
    });

    // Ask for confirmation before deleting suspicious jobs
    if (suspiciousJobs.length > 0) {
      console.log(
        '  ℹ️  Review these jobs manually and delete if they are test data'
      );
    }

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(
      `  • Jobs deleted: ${deletedJobsByTitle.count + deletedJobsBySource.count}`
    );
    console.log(`  • Users deleted: ${deletedUsers.count}`);
    console.log(`  • Instagram posts deleted: ${deletedInstagramPosts.count}`);
    console.log(`  • Instagram templates deleted: ${deletedTemplates.count}`);
    console.log(`  • Instagram schedules deleted: ${deletedSchedules.count}`);
    console.log(
      `  • Orphaned applications deleted: ${orphanedApplicationIds.length}`
    );
    console.log(
      `  • Suspicious jobs found: ${suspiciousJobs.length} (review manually)`
    );
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupTestData()
    .then(() => {
      console.log('✅ Cleanup script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Cleanup script failed:', error);
      process.exit(1);
    });
}

export { cleanupTestData };
