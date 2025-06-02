// Simple script to add test jobs directly
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addJobs() {
  console.log('Adding test jobs...');
  
  try {
    const job1 = await prisma.job.create({
      data: {
        title: 'Warehouse Associate',
        company: 'Amazon Fulfillment',
        description: 'Pick, pack, and ship orders. No experience required.',
        location: 'Stockton, CA',
        source: 'test-data',
        url: 'https://example.com/job1',
        postedAt: new Date(),
        categories: ['logistics'],
        jobType: 'full_time',
        salaryMin: 18,
        salaryMax: 22,
        status: 'active'
      }
    });

    const job2 = await prisma.job.create({
      data: {
        title: 'Customer Service Rep',
        company: 'Tracy Medical Center',
        description: 'Provide customer service to patients.',
        location: 'Tracy, CA',
        source: 'test-data',
        url: 'https://example.com/job2',
        postedAt: new Date(),
        categories: ['healthcare'],
        jobType: 'full_time',
        salaryMin: 16,
        salaryMax: 20,
        status: 'active'
      }
    });

    const job3 = await prisma.job.create({
      data: {
        title: 'Software Developer',
        company: 'Tech Solutions Inc',
        description: 'Develop web applications using React and Node.js.',
        location: 'Modesto, CA',
        source: 'test-data',
        url: 'https://example.com/job3',
        postedAt: new Date(),
        categories: ['technology'],
        jobType: 'full_time',
        salaryMin: 65000,
        salaryMax: 85000,
        isRemote: true,
        status: 'active'
      }
    });

    console.log('✅ Added 3 test jobs successfully!');
    console.log('Job IDs:', job1.id, job2.id, job3.id);

    // Verify
    const count = await prisma.job.count();
    console.log(`Total jobs now: ${count}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addJobs(); 