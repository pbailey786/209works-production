import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  console.log('🔍 Checking database status...');
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check if ChatHistory table exists
    try {
      const chatHistoryCount = await prisma.chatHistory.count();
      console.log(`✅ ChatHistory table exists with ${chatHistoryCount} records`);
    } catch (error) {
      console.log('❌ ChatHistory table does not exist or is not accessible');
      console.log('Error:', error);
    }

    // Check if SavedJob table exists
    try {
      const savedJobCount = await prisma.savedJob.count();
      console.log(`✅ SavedJob table exists with ${savedJobCount} records`);
    } catch (error) {
      console.log('❌ SavedJob table does not exist or is not accessible');
      console.log('Error:', error);
    }

    // Check if JobApplication table exists
    try {
      const jobApplicationCount = await prisma.jobApplication.count();
      console.log(`✅ JobApplication table exists with ${jobApplicationCount} records`);
    } catch (error) {
      console.log('❌ JobApplication table does not exist or is not accessible');
      console.log('Error:', error);
    }

    // Check if Job table exists
    try {
      const jobCount = await prisma.job.count();
      console.log(`✅ Job table exists with ${jobCount} records`);
    } catch (error) {
      console.log('❌ Job table does not exist or is not accessible');
      console.log('Error:', error);
    }

    // Check if User table exists
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User table exists with ${userCount} records`);
    } catch (error) {
      console.log('❌ User table does not exist or is not accessible');
      console.log('Error:', error);
    }

    // Check for test data
    console.log('\n🧹 Checking for test data...');
    
    try {
      const testJobs = await prisma.job.findMany({
        where: {
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { title: { contains: 'sample', mode: 'insensitive' } },
            { title: { contains: 'demo', mode: 'insensitive' } },
            { company: { contains: 'test', mode: 'insensitive' } },
          ]
        },
        select: { id: true, title: true, company: true }
      });
      
      if (testJobs.length > 0) {
        console.log(`⚠️  Found ${testJobs.length} potential test jobs:`);
        testJobs.forEach(job => {
          console.log(`   - ${job.title} at ${job.company} (ID: ${job.id})`);
        });
      } else {
        console.log('✅ No obvious test jobs found');
      }
    } catch (error) {
      console.log('❌ Could not check for test jobs');
    }

    // Check for orphaned applications by checking if jobId references exist
    try {
      const allApplications = await prisma.jobApplication.findMany({
        select: { id: true, jobId: true }
      });

      const existingJobIds = await prisma.job.findMany({
        select: { id: true }
      });

      const existingJobIdSet = new Set(existingJobIds.map(job => job.id));
      const orphanedApps = allApplications.filter(app => !existingJobIdSet.has(app.jobId));

      if (orphanedApps.length > 0) {
        console.log(`⚠️  Found ${orphanedApps.length} orphaned job applications`);
      } else {
        console.log('✅ No orphaned job applications found');
      }
    } catch (error) {
      console.log('❌ Could not check for orphaned applications');
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus().catch(console.error);
